import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Importar app não inicia o servidor nem sincroniza o banco.
process.env.DATABASE_URL = 'postgres://teste:teste@127.0.0.1:1/amb_teste';
process.env.DATABASE_SSL = 'false';
process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes-com-mais-de-32-caracteres';
const { default: app } = await import('../app.js');
const { default: Usuario } = await import('../src/models/usuarios.js');
const { default: Sessao } = await import('../src/models/sessoes.js');
const { default: database } = await import('../src/config/database.js');

test('gestão de usuários e autorização por HTTP', async (t) => {
    let usuarios = [];
    const sessoes = new Map();
    const hash = await bcrypt.hash('senha-inicial-segura', 4);
    function conta(id, perfil, email) {
        return {
            id_usuario: id,
            perfil,
            email,
            senha: hash,
            ativo: true,
            async update(dados) {
                Object.assign(this, dados);
                return this;
            }
        };
    }
    const admin = conta(1, 'admin', 'admin@exemplo.com');
    const comum = conta(2, 'usuario', 'comum@exemplo.com');
    usuarios = [admin, comum];

    t.mock.method(Usuario, 'findByPk', async (id) =>
        usuarios.find((u) => u.id_usuario === Number(id))
    );
    t.mock.method(Usuario, 'unscoped', () => ({
        findOne: async ({ where }) => usuarios.find((u) => u.email === where.email)
    }));
    t.mock.method(Usuario, 'findAndCountAll', async ({ limit, offset }) => ({
        rows: usuarios.slice(offset, offset + limit),
        count: usuarios.length
    }));
    t.mock.method(Usuario, 'create', async (dados) => {
        if (usuarios.some((u) => u.email === dados.email)) {
            const erro = new Error('Duplicado');
            erro.name = 'SequelizeUniqueConstraintError';
            throw erro;
        }
        const usuario = conta(usuarios.length + 1, dados.perfil, dados.email);
        await usuario.update(dados);
        usuarios.push(usuario);
        return usuario;
    });
    t.mock.method(Sessao, 'findByPk', async (id) => sessoes.get(id));
    t.mock.method(Sessao, 'create', async (dados) => {
        const sessao = { ...dados, revogada: false };
        sessoes.set(sessao.id, sessao);
        return sessao;
    });
    t.mock.method(Sessao, 'update', async (dados, { where }) => {
        for (const sessao of sessoes.values()) {
            if (sessao.usuario_id === where.usuario_id || sessao.id === where.id)
                Object.assign(sessao, dados);
        }
        return [1];
    });
    t.mock.method(database, 'transaction', async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }));

    function cookie(usuario, perfilToken = usuario.perfil) {
        const id = randomUUID();
        sessoes.set(id, {
            id,
            usuario_id: usuario.id_usuario,
            revogada: false,
            ultima_atividade: new Date(),
            expira_em: new Date(Date.now() + 600000)
        });
        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, perfil: perfilToken },
            process.env.JWT_SECRET,
            {
                algorithm: 'HS256',
                issuer: 'system-amb',
                audience: 'system-amb-web',
                subject: String(usuario.id_usuario),
                jwtid: id,
                expiresIn: '10m'
            }
        );
        return 'token=' + token;
    }
    const adminCookie = cookie(admin);
    const comumCookie = cookie(comum, 'admin');
    const servidor = app.listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    t.after(() => new Promise((resolve) => servidor.close(resolve)));
    const base = 'http://127.0.0.1:' + servidor.address().port;
    function requisitar(path, credencial, method = 'GET', dados) {
        const headers = {};
        if (credencial) headers.Cookie = credencial;
        const opcoes = { method, headers, redirect: 'manual' };
        if (dados !== undefined) {
            headers['Content-Type'] = 'application/json';
            opcoes.body = JSON.stringify(dados);
        }
        return fetch(base + path, opcoes);
    }

    await t.test('visitante não abre páginas ou API protegidas', async () => {
        const pagina = await requisitar('/usuarios');
        assert.equal(pagina.status, 302);
        assert.equal(pagina.headers.get('location'), '/login');
        assert.equal((await requisitar('/dashboard')).status, 302);
        for (const method of ['GET', 'POST', 'PATCH']) {
            let path = '/api/usuarios';
            if (method === 'PATCH') path += '/2';
            assert.equal((await requisitar(path, null, method)).status, 401);
        }
    });
    await t.test(
        'usuário comum não vê a aba e não acessa API mesmo com perfil admin no token',
        async () => {
            const dashboard = await requisitar('/dashboard', comumCookie);
            assert.equal(dashboard.status, 200);
            assert.doesNotMatch(await dashboard.text(), /href="\/usuarios"/);
            const pagina = await requisitar('/usuarios', comumCookie);
            assert.equal(pagina.status, 403);
            assert.match(await pagina.text(), /Acesso restrito/);
            for (const method of ['GET', 'POST', 'PATCH']) {
                let path = '/api/usuarios';
                if (method === 'PATCH') path += '/2';
                assert.equal((await requisitar(path, comumCookie, method)).status, 403);
            }
        }
    );
    await t.test('admin vê a aba, a página e a listagem sem hashes', async () => {
        const pagina = await requisitar('/usuarios', adminCookie);
        assert.equal(pagina.status, 200);
        assert.match(await pagina.text(), /href="\/usuarios"/);
        const lista = await requisitar('/api/usuarios', adminCookie);
        assert.equal(lista.status, 200);
        const dados = await lista.json();
        assert.equal(dados.total, 2);
        assert.ok(dados.usuarios.every((u) => !Object.hasOwn(u, 'senha')));
        assert.equal((await requisitar('/api/usuarios?pagina=0', adminCookie)).status, 400);
    });
    await t.test('cadastro valida dados e impede promoção de privilégios', async () => {
        for (const dados of [
            { email: 'inválido', senha: 'senha-segura-teste' },
            { email: 'nova@exemplo.com', senha: 'curta' },
            { email: 'nova@exemplo.com', senha: 'á'.repeat(37) },
            { email: 'nova@exemplo.com', senha: 'senha-segura-teste', perfil: 'admin' },
            []
        ]) {
            assert.equal(
                (await requisitar('/api/usuarios', adminCookie, 'POST', dados)).status,
                400
            );
        }
        const resposta = await requisitar('/api/usuarios', adminCookie, 'POST', {
            email: '  NOVA@exemplo.com  ',
            senha: 'senha-segura-teste'
        });
        assert.equal(resposta.status, 201);
        const dados = await resposta.json();
        assert.equal(dados.usuario.email, 'nova@exemplo.com');
        assert.equal(dados.usuario.perfil, 'usuario');
        assert.equal(dados.usuario.ativo, true);
        assert.equal(dados.usuario.senha, undefined);
        assert.ok(await bcrypt.compare('senha-segura-teste', usuarios[2].senha));
        assert.equal(
            (
                await requisitar('/api/usuarios', adminCookie, 'POST', {
                    email: 'nova@exemplo.com',
                    senha: 'senha-segura-teste'
                })
            ).status,
            409
        );
    });
    await t.test('admin não pode desativar a própria conta ou promover outro usuário', async () => {
        assert.equal(
            (await requisitar('/api/usuarios/1', adminCookie, 'PATCH', { ativo: false })).status,
            403
        );
        assert.equal(
            (await requisitar('/api/usuarios/2', adminCookie, 'PATCH', { perfil: 'admin' })).status,
            400
        );
        assert.equal(
            (await requisitar('/api/usuarios/999', adminCookie, 'PATCH', { ativo: false })).status,
            404
        );
        assert.equal(admin.ativo, true);
    });
    await t.test(
        'desativação revoga sessão e bloqueia novo login; reativação não restaura sessão antiga',
        async () => {
            assert.equal(
                (await requisitar('/api/usuarios/2', adminCookie, 'PATCH', { ativo: false }))
                    .status,
                200
            );
            assert.equal((await requisitar('/api/auth/verificar', comumCookie)).status, 401);
            assert.equal(
                (
                    await requisitar('/api/auth/login', null, 'POST', {
                        email: comum.email,
                        senha: 'senha-inicial-segura'
                    })
                ).status,
                401
            );
            assert.equal(
                (await requisitar('/api/usuarios/2', adminCookie, 'PATCH', { ativo: true })).status,
                200
            );
            assert.equal((await requisitar('/api/auth/verificar', comumCookie)).status, 401);
            assert.equal(
                (
                    await requisitar('/api/auth/login', null, 'POST', {
                        email: comum.email,
                        senha: 'senha-inicial-segura'
                    })
                ).status,
                200
            );
        }
    );
    await t.test('nova senha invalida a anterior e as sessões existentes', async () => {
        const sessaoAnterior = cookie(comum);
        assert.equal(
            (
                await requisitar('/api/usuarios/2', adminCookie, 'PATCH', {
                    email: 'atualizado@exemplo.com',
                    senha: 'nova-senha-segura'
                })
            ).status,
            200
        );
        assert.equal((await requisitar('/api/auth/verificar', sessaoAnterior)).status, 401);
        assert.equal(
            (
                await requisitar('/api/auth/login', null, 'POST', {
                    email: comum.email,
                    senha: 'senha-inicial-segura'
                })
            ).status,
            401
        );
        const login = await requisitar('/api/auth/login', null, 'POST', {
            email: comum.email,
            senha: 'nova-senha-segura'
        });
        assert.equal(login.status, 200);
        const dados = await login.json();
        assert.equal(dados.usuario.perfil, 'usuario');
        assert.equal(dados.usuario.senha, undefined);
    });
    await t.test('usuário inativo é recusado mesmo com sessão não revogada', async () => {
        const acesso = cookie(comum);
        comum.ativo = false;
        assert.equal((await requisitar('/api/auth/verificar', acesso)).status, 401);
        comum.ativo = true;
    });
    await t.test('permissão é relida no banco em cada requisição', async () => {
        admin.perfil = 'usuario';
        assert.equal((await requisitar('/api/usuarios', adminCookie)).status, 403);
        admin.perfil = 'admin';
    });
});
