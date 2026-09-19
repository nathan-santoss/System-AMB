import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Nunca lê as credenciais locais nem conecta ao banco da aplicação.
Object.assign(process.env, {
    DOTENV_CONFIG_PATH: new URL('inexistente.env', import.meta.url).pathname,
    DATABASE_URL: 'postgres://test:test@127.0.0.1:1/test',
    JWT_SECRET: '  chave-exclusiva-para-testes-com-mais-de-32-caracteres  ',
    BOOTSTRAP_ADMIN_EMAIL: '', BOOTSTRAP_ADMIN_PASSWORD: '',
    TRUST_PROXY: '', NODE_ENV: 'test', PORT: '0'
});
const { default: db } = await import('../src/config/database.js');
const { default: Usuario } = await import('../src/models/usuarios.js');
const { default: Funcionario } = await import('../src/models/funcionarios.js');
const { default: Alergia } = await import('../src/models/alergias.js');
const { default: Atendimento } = await import('../src/models/atendimento.js');
const { criarUsuarioMaster } = await import('../src/config/masterUser.js');

test('API com PostgreSQL isolado e modelos reais', async t => {
    const errors = [];
    t.mock.method(console, 'error', (...args) => errors.push(args));
    const pg = new PGlite();
    await pg.waitReady;
    // Substitui somente o transporte pg. SQL, constraints e transações são reais.
    const convert = result => ({ ...result,
        rows: result.rows.map(row => Array.isArray(row.column_names)
            ? { ...row, column_names: '{' + row.column_names.map(JSON.stringify).join(',') + '}' } : row),
        rowCount: result.affectedRows ?? result.rows.length
    });
    const connection = { query(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = undefined; }
        const pending = params?.length ? pg.query(sql, params).then(convert)
            : pg.exec(sql).then(results => results.map(convert));
        pending.then(result => callback(null, result), error => callback(error));
    } };
    db.connectionManager.connect = async () => { throw new Error('Conexão externa bloqueada'); };
    db.connectionManager.getConnection = async () => connection;
    db.connectionManager.releaseConnection = async () => {};
    let server;
    const originalListen = express.application.listen;
    t.after(async () => {
        express.application.listen = originalListen;
        if (server) await new Promise(resolve => server.close(resolve));
        await db.close();
        await pg.close();
    });
    await db.sync();
    const senha = 'SenhaDeTeste123!';
    await Usuario.create({ email: 'teste@example.invalid', senha: await bcrypt.hash(senha, 4) });
    const listening = new Promise(resolve => {
        express.application.listen = function () {
            server = createServer(this).listen(0, '127.0.0.1', resolve);
            return server;
        };
    });
    await import('../server.js');
    await listening;
    const base = `http://127.0.0.1:${server.address().port}`;
    let cookie;
    async function request(path, { method = 'GET', body, raw, auth = true, headers = {} } = {}) {
        const res = await fetch(base + path, { method, headers: {
            ...(auth && cookie ? { Cookie: cookie } : {}),
            ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers
        }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined), signal: AbortSignal.timeout(15000) });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        return { status: res.status, data, headers: res.headers };
    }
    await t.test('login, segredo com espaços e cookies inválidos', async () => {
        const login = await request('/api/auth/login', { method: 'POST', body: { email: 'teste@example.invalid', senha } });
        assert.equal(login.status, 200);
        cookie = login.headers.get('set-cookie').split(';')[0];
        assert.equal((await request('/api/auth/verificar')).status, 200);
        for (const invalid of ['token', 'token=', 'token=invalido', 'token=' + jwt.sign({ id_usuario: 1 }, process.env.JWT_SECRET.trim(), {
            issuer: 'system-amb', audience: 'system-amb-web', expiresIn: -1
        })]) {
            assert.equal((await request('/api/auth/verificar', { headers: { Cookie: invalid } })).status, 401);
        }
        assert.equal((await request('/api/funcionarios', { auth: false })).status, 401);
        assert.equal((await request('/api/atendimentos/1/finalizar', { method: 'PATCH', auth: false })).status, 401);
    });
    await t.test('senhas acima de 72 bytes não são truncadas silenciosamente', async () => {
        for (const senha of ['a'.repeat(73), 'á'.repeat(37)]) {
            const res = await request('/api/auth/login', { method: 'POST', body: { email: 'teste@example.invalid', senha } });
            assert.equal(res.status, 400);
        }
    });
    await t.test('bootstrap valida bytes de novas senhas e preserva usuários existentes', async () => {
        process.env.BOOTSTRAP_ADMIN_EMAIL = 'novo@example.invalid';
        process.env.BOOTSTRAP_ADMIN_PASSWORD = 'á'.repeat(37);
        try {
            await assert.rejects(criarUsuarioMaster(), /72 bytes/);
            process.env.BOOTSTRAP_ADMIN_EMAIL = 'teste@example.invalid';
            const original = (await Usuario.unscoped().findByPk(1)).senha;
            await criarUsuarioMaster();
            assert.equal((await Usuario.unscoped().findByPk(1)).senha, original);
        } finally {
            process.env.BOOTSTRAP_ADMIN_EMAIL = '';
            process.env.BOOTSTRAP_ADMIN_PASSWORD = '';
        }
    });
    await t.test('páginas e CSS, JSON inválido e limite do corpo', async () => {
        for (const page of ['/login', '/dashboard', '/consultar-paciente', '/ficha-paciente']) {
            const res = await request(page);
            assert.equal(res.status, 200);
            assert.ok(res.data.includes('/styles/global.css'));
        }
        assert.equal((await request('/styles/global.css')).status, 200);
        assert.equal((await request('/api/auth/login', { method: 'POST', raw: '{' })).status, 400);
        assert.equal((await request('/api/auth/login', { method: 'POST', body: { data: 'x'.repeat(110000) } })).status, 413);
    });
    const employee = { matricula: 'TEST01', nome: 'Maria Teste', cpf: '52998224725', setor: 'Teste' };
    await t.test('cadastro, CPF, duplicidade e busca sem diferenciar maiúsculas', async () => {
        assert.equal((await request('/api/funcionarios', { method: 'POST', body: { ...employee, cpf: '00000000000' } })).status, 400);
        assert.equal((await request('/api/funcionarios', { method: 'POST', body: employee })).status, 201);
        assert.equal((await request('/api/funcionarios', { method: 'POST', body: employee })).status, 409);
        assert.equal((await request('/api/funcionarios?busca=maria')).data.length, 1);
        assert.equal((await request('/api/funcionarios?busca=MARIA')).data.length, 1);
        const malicious = await request('/api/funcionarios?busca=' + encodeURIComponent("' OR 1=1 --"));
        assert.equal(malicious.data.length, 0);
        assert.equal(await Funcionario.count(), 1);
        assert.equal((await request('/api/funcionarios/TEST01', { method: 'PATCH', body: { cpf: '52998224724' } })).status, 400);
    });
    let visit;
    await t.test('atendimento: registro, finalização e repetição preservando horário', async () => {
        const created = await request('/api/atendimentos', { method: 'POST', body: {
            funcionario_matricula: employee.matricula, queixa_principal: 'Queixa de teste',
            pressao_arterial: '120/80', temperatura: '36,5', gravidade: 'Baixa', acao_tomada: 'Liberado'
        } });
        assert.equal(created.status, 201);
        visit = created.data;
        assert.equal((await request('/api/funcionarios/TEST01')).data.resumo.totalAtendimentosAbertos, 1);
        const route = `/api/atendimentos/${visit.id_atendimento}/finalizar`;
        const finished = await request(route, { method: 'PATCH' });
        assert.equal(finished.status, 200);
        assert.ok(finished.data.data_hora_saida);
        assert.equal((await request(route, { method: 'PATCH' })).data.data_hora_saida, finished.data.data_hora_saida);
        const history = (await request('/api/funcionarios/TEST01')).data;
        assert.equal(history.resumo.totalAtendimentosAbertos, 0);
        assert.equal(history.atendimentos[0].status, 'finalizado');
        assert.equal((await request('/api/atendimentos/abc/finalizar', { method: 'PATCH' })).status, 400);
        assert.equal((await request('/api/atendimentos/999999/finalizar', { method: 'PATCH' })).status, 404);
    });
    const counts = async () => [await Funcionario.count(), await Alergia.count(), await Atendimento.count()];
    await t.test('falha durante exclusão reverte alergias e atendimentos', async () => {
        await Alergia.create({ funcionario_matricula: employee.matricula, descricao_alergia: 'Teste' });
        await pg.exec(`CREATE FUNCTION fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN RAISE EXCEPTION 'Falha de teste'; END $$;
            CREATE TRIGGER fail_delete BEFORE DELETE ON tb_atendimento FOR EACH ROW EXECUTE FUNCTION fail_delete();`);
        try {
            assert.equal((await request('/api/funcionarios/TEST01', { method: 'DELETE' })).status, 500);
            assert.deepEqual(await counts(), [1, 1, 1]);
        } finally { await pg.exec('DROP TRIGGER fail_delete ON tb_atendimento; DROP FUNCTION fail_delete();'); }
    });
    await t.test('conflito RESTRICT retorna 409 e preserva histórico', async () => {
        // Intercala uma inserção entre as etapas na mesma conexão descartável.
        Atendimento.addHook('afterBulkDestroy', 'conflito', async options => {
            await Alergia.create({ funcionario_matricula: employee.matricula, descricao_alergia: 'Novo vínculo' }, { transaction: options.transaction });
        });
        try {
            assert.equal((await request('/api/funcionarios/TEST01', { method: 'DELETE' })).status, 409);
            assert.deepEqual(await counts(), [1, 1, 1]);
        } finally { Atendimento.removeHook('afterBulkDestroy', 'conflito'); }
    });
    await t.test('exclusão completa e logout', async () => {
        assert.equal((await request('/api/funcionarios/TEST01', { method: 'DELETE' })).status, 200);
        assert.deepEqual(await counts(), [0, 0, 0]);
        const logout = await request('/api/auth/logout', { method: 'POST' });
        assert.equal(logout.status, 200);
        assert.match(logout.headers.get('set-cookie'), /token=;/);
    });
    await t.test('tentativas excessivas recebem 429', async () => {
        let response;
        for (let i = 0; i < 21; i++) {
            response = await request('/api/auth/login', { method: 'POST', body: { email: 'ausente@example.invalid', senha: 'Invalida123!' } });
        }
        assert.equal(response.status, 429);
        assert.ok(response.headers.get('retry-after'));
    });
});

test('falha de inicialização termina com código diferente de zero', () => {
    const code = `const { default: db } = await import('./src/config/database.js');
        db.authenticate = async () => { throw new Error('falha sintetica'); };
        await import('./server.js');`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
        cwd: new URL('../', import.meta.url), env: process.env, encoding: 'utf8', timeout: 15000
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /falha sintetica/);
});

test('TLS valida certificado mesmo com parâmetros antigos na URL e permite banco local', () => {
    const code = `const { default: db } = await import('./src/config/database.js');
        const ssl = db.options.dialectOptions.ssl;
        console.log(JSON.stringify({ enabled: ssl !== false, validates: ssl !== false && ssl.rejectUnauthorized !== false && !ssl.checkServerIdentity }));
        await db.close();`;
    for (const local of [false, true]) {
        const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
            cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 15000,
            env: { ...process.env, DATABASE_URL: 'postgres://test:test@127.0.0.1:1/test?sslmode=no-verify', DATABASE_SSL: String(!local) }
        });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout), { enabled: !local, validates: !local });
    }
});
