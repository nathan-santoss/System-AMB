import test from 'node:test';
import assert from 'node:assert/strict';
import { migrarUsuarios } from '../src/config/migracaoUsuarios.js';

function banco(usuarios = [], concluida = false) {
    const adicionadas = [];
    const registro = {
        concluida,
        async reload() {},
        async update(dados) {
            Object.assign(this, dados);
        }
    };
    const contas = usuarios.map((u) => ({
        ...u,
        async update(dados) {
            Object.assign(this, dados);
        }
    }));
    return {
        adicionadas,
        contas,
        registro,
        models: {
            Migracao: {
                async findOrCreate() {
                    return [registro];
                }
            },
            Usuario: {
                async findOne({ where }) {
                    return contas.find((u) => Object.entries(where).every(([k, v]) => u[k] === v));
                },
                async findAll() {
                    return contas.slice(0, 2);
                }
            }
        },
        getQueryInterface() {
            return {
                async describeTable() {
                    return {};
                },
                async addColumn(tabela, nome) {
                    adicionadas.push(nome);
                }
            };
        },
        async transaction(fn) {
            return fn({ LOCK: { UPDATE: 'UPDATE' } });
        }
    };
}

test('migração preserva contas e seleciona o administrador com critério explícito', async (t) => {
    const original = process.env.BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    t.after(() => {
        if (original === undefined) delete process.env.BOOTSTRAP_ADMIN_EMAIL;
        else process.env.BOOTSTRAP_ADMIN_EMAIL = original;
    });
    const unico = banco([
        { email: 'inicial@exemplo.com', senha: 'hash-existente', perfil: 'usuario', ativo: true }
    ]);
    await migrarUsuarios(unico);
    assert.deepEqual(unico.adicionadas, ['perfil', 'ativo']);
    assert.equal(unico.contas[0].perfil, 'admin');
    assert.equal(unico.contas[0].senha, 'hash-existente');
    assert.equal(unico.registro.concluida, true);
    await migrarUsuarios(unico);
    assert.equal(unico.adicionadas.length, 2);

    const multiplos = banco([{ email: 'um@exemplo.com' }, { email: 'dois@exemplo.com' }]);
    await assert.rejects(migrarUsuarios(multiplos), /BOOTSTRAP_ADMIN_EMAIL/);
    assert.equal(multiplos.registro.concluida, false);
    process.env.BOOTSTRAP_ADMIN_EMAIL = '  DOIS@exemplo.com ';
    await migrarUsuarios(multiplos);
    assert.equal(multiplos.contas[0].perfil, undefined);
    assert.equal(multiplos.contas[1].perfil, 'admin');
    assert.equal(multiplos.contas[1].ativo, true);

    const vazio = banco();
    await migrarUsuarios(vazio);
    assert.equal(vazio.contas.length, 0);
    assert.equal(vazio.registro.concluida, true);
});
