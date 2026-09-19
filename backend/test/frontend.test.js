import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ejs from 'ejs';
import { JSDOM } from 'jsdom';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
async function openPage(page) {
    const html = await ejs.renderFile(fileURLToPath(new URL(`frontend/views/${page}.ejs`, root)), {});
    const dom = new JSDOM(html, { url: 'http://localhost/' + page, runScripts: 'outside-only' });
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    const run = code => vm.runInContext(code, dom.getInternalVMContext());
    const sidebar = [...dom.window.document.scripts].find(script => script.textContent.includes('function abrirSidebar()'));
    if (sidebar) run(sidebar.textContent);
    run(read(`frontend/public/js/${page}.js`));
    return { dom, window: dom.window, run };
}

test('sidebar e modal preservam classes e rolagem durante redimensionamento', async t => {
    const { dom, window } = await openPage('consultar-paciente');
    t.after(() => dom.window.close());
    window.configurarEventosSidebar();
    window.configurarEventos();
    const resize = width => { window.innerWidth = width; window.dispatchEvent(new window.Event('resize')); };
    resize(375);
    window.abrirSidebar();
    resize(1024);
    resize(375);
    const doc = window.document;
    assert.ok(doc.getElementById('sidebar-principal').classList.contains('-translate-x-full'));
    assert.ok(!doc.getElementById('sidebar-principal').classList.contains('translate-x-0'));
    assert.equal(doc.getElementById('botao-abrir-sidebar').getAttribute('aria-expanded'), 'false');
    assert.ok(doc.getElementById('sidebar-backdrop').classList.contains('hidden'));
    window.abrirModalCadastro();
    resize(1024);
    assert.ok(doc.body.classList.contains('overflow-hidden'));
    window.fecharModalCadastro();
    assert.ok(!doc.body.classList.contains('overflow-hidden'));
    resize(375);
    window.abrirSidebar();
    window.abrirModalCadastro();
    window.fecharModalCadastro();
    assert.ok(doc.body.classList.contains('overflow-hidden'));
    window.fecharSidebar();
    assert.ok(!doc.body.classList.contains('overflow-hidden'));
});

test('busca mantém a resposta da última consulta, inclusive quando a anterior falha', async t => {
    const { dom, window } = await openPage('consultar-paciente');
    t.after(() => dom.window.close());
    const pending = [];
    window.AuthSession = { fetchAutenticado: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) };
    const response = nome => ({ ok: true, status: 200, json: async () => [{ matricula: nome, nome, cpf: '52998224725' }] });
    const first = window.buscarFuncionarios('Maria');
    const last = window.buscarFuncionarios('Joao');
    pending[1].resolve(response('Joao'));
    await last;
    pending[0].resolve(response('Maria'));
    await first;
    assert.match(window.document.getElementById('tabela-pacientes').textContent, /Joao/);
    assert.doesNotMatch(window.document.getElementById('tabela-pacientes').textContent, /Maria/);
    const failed = window.buscarFuncionarios('antiga');
    const latest = window.buscarFuncionarios('atual');
    pending[3].resolve(response('atual'));
    await latest;
    pending[2].reject(new Error('Falha atrasada'));
    await failed;
    assert.match(window.document.getElementById('tabela-pacientes').textContent, /atual/);
});

test('logout informa falha, permite repetir e só redireciona após sucesso', async () => {
    const redirects = [], alerts = [];
    let status = 500, calls = 0;
    const context = vm.createContext({ Headers, console: { error() {} },
        fetch: async () => { calls++; return { ok: status === 200, status }; },
        window: { location: { replace: value => redirects.push(value) }, alert: value => alerts.push(value) }
    });
    vm.runInContext(read('frontend/public/js/auth-session.js'), context);
    assert.equal(await context.window.AuthSession.fazerLogout(), false);
    assert.equal(redirects.length, 0);
    assert.equal(alerts.length, 1);
    status = 200;
    assert.equal(await context.window.AuthSession.fazerLogout(), true);
    assert.deepEqual(redirects, ['/login']);
    assert.equal(calls, 2);
});

test('login inclui o módulo de autenticação apenas uma vez', async t => {
    const { dom, window } = await openPage('login');
    t.after(() => dom.window.close());
    const scripts = [...window.document.scripts].filter(script => script.getAttribute('src') === '/js/auth-session.js');
    assert.equal(scripts.length, 1);
});

test('erro 500 na verificação de sessão é apresentado nas três telas protegidas', async t => {
    for (const [page, initialize] of [
        ['dashboard', 'inicializarDashboard'],
        ['consultar-paciente', 'inicializarPaginaFuncionarios'],
        ['ficha-paciente', 'inicializarFichaPaciente']
    ]) {
        await t.test(page, async t => {
            const { dom, window } = await openPage(page);
            t.after(() => dom.window.close());
            const alerts = [];
            window.alert = message => alerts.push(message);
            window.AuthSession = {
                fetchAutenticado: async () => assert.fail('Não deve carregar dados sem validar a sessão'),
                exigirSessao: async () => ({ autenticado: false, status: 500, mensagem: 'Falha de sessão de teste' })
            };
            await window[initialize]();
            assert.ok(window.document.body.textContent.includes('Falha de sessão de teste') || alerts.includes('Falha de sessão de teste'));
        });
    }
});

test('histórico finaliza pela API e oculta a ação em atendimentos encerrados', async t => {
    const { dom, window, run } = await openPage('ficha-paciente');
    t.after(() => dom.window.close());
    const calls = [];
    window.confirm = () => true;
    window.alert = () => assert.fail('Não deveria apresentar erro');
    window.AuthSession = { fetchAutenticado: async (url, options) => {
        calls.push({ url, method: options.method });
        return { ok: true, status: 200, json: async () => ({}) };
    } };
    run('carregarDadosPaciente = async () => {};');
    const visit = { id_atendimento: 7, data_hora_entrada: new Date().toISOString(), gravidade: 'Baixa',
        queixa_principal: '<img src=x onerror=alert(1)>', acao_tomada: 'Liberado' };
    const item = window.criarItemHistorico(visit);
    assert.equal(item.querySelector('img'), null);
    item.querySelector('button').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(calls, [{ url: '/api/atendimentos/7/finalizar', method: 'PATCH' }]);
    const closed = window.criarItemHistorico({ ...visit, data_hora_saida: new Date().toISOString() });
    assert.equal(closed.querySelector('button'), null);
    assert.match(closed.textContent, /Finalizado em/);
});

test('validação de CPF do formulário rejeita números inválidos', async t => {
    const { dom, window } = await openPage('consultar-paciente');
    t.after(() => dom.window.close());
    assert.equal(window.cpfEhValido('52998224725'), true);
    assert.equal(window.cpfEhValido('00000000000'), false);
    assert.equal(window.cpfEhValido('52998224724'), false);
});
