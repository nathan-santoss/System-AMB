const DASHBOARD_BASE_URL = '/api';

function atualizarIcones() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function escapeHTML(valor) {
    if (valor === null) {
        return '';
    }

    if (valor === undefined) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function obterTextoExibicao(valor, textoPadrao) {
    if (valor === null) {
        return textoPadrao;
    }

    if (valor === undefined) {
        return textoPadrao;
    }

    const texto = String(valor).trim();

    if (texto.length === 0) {
        return textoPadrao;
    }

    return texto;
}

function obterNumeroExibicao(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return 0;
    }

    if (numero < 0) {
        return 0;
    }

    return Math.trunc(numero);
}

async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

function obterMensagemErro(dados, mensagemPadrao) {
    if (dados) {
        if (typeof dados.erro === 'string') {
            const mensagemErro = dados.erro.trim();

            if (mensagemErro.length > 0) {
                return mensagemErro;
            }
        }

        if (typeof dados.message === 'string') {
            const mensagem = dados.message.trim();

            if (mensagem.length > 0) {
                return mensagem;
            }
        }

        if (Array.isArray(dados.detalhes)) {
            if (dados.detalhes.length > 0) {
                return dados.detalhes.join(' ');
            }
        }
    }

    return mensagemPadrao;
}

function formatarDataHora(valor) {
    if (!valor) {
        return 'Não informado';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return 'Data inválida';
    }

    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function obterClasseGravidade(gravidade) {
    if (gravidade === 'Alta') {
        return 'bg-red-50 text-red-700 border-red-200';
    }

    if (gravidade === 'Média') {
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }

    if (gravidade === 'Baixa') {
        return 'bg-green-50 text-green-700 border-green-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
}

function definirTextoElemento(idElemento, valor) {
    const elemento = document.getElementById(idElemento);

    if (!elemento) {
        return;
    }

    elemento.textContent = String(valor);
}

function definirContadoresCarregando() {
    definirTextoElemento('contador-hoje', '...');
    definirTextoElemento('count-normal', '...');
    definirTextoElemento('count-medio', '...');
    definirTextoElemento('count-grave', '...');
}

function definirContadoresErro() {
    definirTextoElemento('contador-hoje', 'Erro');
    definirTextoElemento('count-normal', '-');
    definirTextoElemento('count-medio', '-');
    definirTextoElemento('count-grave', '-');
}

function renderizarContadores(dados) {
    const totalHoje = obterNumeroExibicao(dados.totalHoje);

    let quantidadeBaixa = 0;
    let quantidadeMedia = 0;
    let quantidadeAlta = 0;

    if (dados.gravidadeHoje) {
        if (typeof dados.gravidadeHoje === 'object') {
            quantidadeBaixa = obterNumeroExibicao(dados.gravidadeHoje.baixa);
            quantidadeMedia = obterNumeroExibicao(dados.gravidadeHoje.media);
            quantidadeAlta = obterNumeroExibicao(dados.gravidadeHoje.alta);
        }
    }

    definirTextoElemento('contador-hoje', totalHoje);
    definirTextoElemento('count-normal', quantidadeBaixa);
    definirTextoElemento('count-medio', quantidadeMedia);
    definirTextoElemento('count-grave', quantidadeAlta);
}

function criarLinhaMensagemTabela(mensagem, classeTexto) {
    const linha = document.createElement('tr');
    const coluna = document.createElement('td');

    coluna.colSpan = 4;
    coluna.className = 'py-8 text-center text-sm ' + classeTexto;
    coluna.textContent = mensagem;

    linha.appendChild(coluna);

    return linha;
}

function renderizarAtendimentosCarregando() {
    const tabela = document.getElementById('lista-ultimos-atendimentos');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = '';
    tabela.appendChild(
        criarLinhaMensagemTabela('Carregando atendimentos...', 'text-slate-400')
    );
}

function criarLinhaAtendimento(atendimento) {
    const linha = document.createElement('tr');
    linha.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

    const colunaPaciente = document.createElement('td');
    colunaPaciente.className = 'px-6 py-4';

    const nomeFuncionario = document.createElement('p');
    nomeFuncionario.className = 'font-semibold text-azulEscuro';
    nomeFuncionario.textContent = obterTextoExibicao(atendimento.nome, 'Funcionário sem nome');

    const dadosFuncionario = document.createElement('p');
    dadosFuncionario.className = 'text-xs text-slate-500 mt-1';

    const matricula = obterTextoExibicao(atendimento.funcionario_matricula, 'Matrícula não informada');
    dadosFuncionario.textContent = 'Matrícula: ' + matricula;

    colunaPaciente.appendChild(nomeFuncionario);
    colunaPaciente.appendChild(dadosFuncionario);

    const colunaQueixa = document.createElement('td');
    colunaQueixa.className = 'px-6 py-4';

    const queixa = document.createElement('p');
    queixa.className = 'text-sm text-slate-600';
    queixa.textContent = obterTextoExibicao(atendimento.queixa_principal, 'Sem queixa registrada');

    colunaQueixa.appendChild(queixa);

    const colunaGravidade = document.createElement('td');
    colunaGravidade.className = 'px-6 py-4 text-center';

    const gravidade = obterTextoExibicao(atendimento.gravidade, 'Não informada');
    const badgeGravidade = document.createElement('span');
    badgeGravidade.className = 'inline-flex px-3 py-1 text-xs font-bold rounded-full border ' + obterClasseGravidade(gravidade);
    badgeGravidade.textContent = gravidade;

    colunaGravidade.appendChild(badgeGravidade);

    const colunaData = document.createElement('td');
    colunaData.className = 'px-6 py-4 text-center text-slate-500 text-xs whitespace-nowrap';
    colunaData.textContent = formatarDataHora(atendimento.data_hora_entrada);

    linha.appendChild(colunaPaciente);
    linha.appendChild(colunaQueixa);
    linha.appendChild(colunaGravidade);
    linha.appendChild(colunaData);

    return linha;
}

function renderizarUltimosAtendimentos(atendimentos) {
    const tabela = document.getElementById('lista-ultimos-atendimentos');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = '';

    if (!Array.isArray(atendimentos)) {
        tabela.appendChild(
            criarLinhaMensagemTabela('Não foi possível interpretar os atendimentos.', 'text-red-500')
        );
        return;
    }

    if (atendimentos.length === 0) {
        tabela.appendChild(
            criarLinhaMensagemTabela('Nenhum atendimento recente.', 'text-slate-400')
        );
        return;
    }

    atendimentos.forEach(function (atendimento) {
        if (!atendimento) {
            return;
        }

        if (atendimento.funcionario_matricula === null) {
            return;
        }

        if (atendimento.funcionario_matricula === undefined) {
            return;
        }

        const matricula = String(atendimento.funcionario_matricula).trim();

        if (matricula.length === 0) {
            return;
        }

        tabela.appendChild(criarLinhaAtendimento(atendimento));
    });

    if (tabela.children.length === 0) {
        tabela.appendChild(
            criarLinhaMensagemTabela('Nenhum atendimento vinculado a um funcionário válido.', 'text-slate-400')
        );
    }
}

function renderizarSetoresCarregando() {
    const container = document.getElementById('lista-setores');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const mensagem = document.createElement('div');
    mensagem.className = 'text-slate-400 text-center py-6 text-sm';
    mensagem.textContent = 'Carregando setores...';

    container.appendChild(mensagem);
}

function criarItemSetor(setor) {
    const item = document.createElement('div');
    item.className = 'flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100';

    const nomeSetor = document.createElement('span');
    nomeSetor.className = 'font-medium text-slate-700';
    nomeSetor.textContent = obterTextoExibicao(setor.setor, 'Não informado');

    const quantidade = document.createElement('span');
    quantidade.className = 'font-bold text-azulEscuro bg-blue-100 px-3 py-1 rounded-full text-xs';
    quantidade.textContent = String(obterNumeroExibicao(setor.quantidade));

    item.appendChild(nomeSetor);
    item.appendChild(quantidade);

    return item;
}

function renderizarRankingSetores(setores) {
    const container = document.getElementById('lista-setores');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!Array.isArray(setores)) {
        const mensagemErro = document.createElement('div');
        mensagemErro.className = 'text-red-500 text-center py-6 text-sm';
        mensagemErro.textContent = 'Não foi possível interpretar os setores.';

        container.appendChild(mensagemErro);
        return;
    }

    if (setores.length === 0) {
        const mensagemVazia = document.createElement('div');
        mensagemVazia.className = 'text-slate-400 text-center py-6 text-sm';
        mensagemVazia.textContent = 'Sem atendimentos por setor neste mês.';

        container.appendChild(mensagemVazia);
        return;
    }

    setores.forEach(function (setor) {
        if (!setor) {
            return;
        }

        container.appendChild(criarItemSetor(setor));
    });
}

function mostrarErroDashboard(mensagem) {
    definirContadoresErro();

    const tabela = document.getElementById('lista-ultimos-atendimentos');

    if (tabela) {
        tabela.innerHTML = '';
        tabela.appendChild(criarLinhaMensagemTabela(mensagem, 'text-red-500'));
    }

    const setores = document.getElementById('lista-setores');

    if (setores) {
        setores.innerHTML = '';

        const mensagemErro = document.createElement('p');
        mensagemErro.className = 'text-center text-sm text-red-500 py-6';
        mensagemErro.textContent = mensagem;

        setores.appendChild(mensagemErro);
    }
}

async function carregarDadosDashboard() {
    definirContadoresCarregando();
    renderizarAtendimentosCarregando();
    renderizarSetoresCarregando();

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            DASHBOARD_BASE_URL + '/atendimentos/dashboard-dados',
            {
                method: 'GET',
                cache: 'no-store'
            }
        );

        const dados = await lerRespostaJson(resposta);

        if (resposta.status === 401) {
            await window.AuthSession.fazerLogout();
            return;
        }

        if (resposta.status === 403) {
            await window.AuthSession.fazerLogout();
            return;
        }

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível carregar os dados do dashboard.');
            throw new Error(mensagem);
        }

        renderizarContadores(dados);
        renderizarUltimosAtendimentos(dados.ultimosAtendimentos);
        renderizarRankingSetores(dados.atendimentosPorSetor);
        atualizarIcones();

    } catch (erro) {
        console.error('Erro ao carregar o dashboard:', erro);
        mostrarErroDashboard(erro.message);
    }
}

async function inicializarDashboard() {
    if (!window.AuthSession) {
        console.error('O arquivo auth-session.js não foi carregado.');
        window.location.href = '/login';
        return;
    }

    const resultadoSessao = await window.AuthSession.exigirSessao();

    if (!resultadoSessao.autenticado) {
        if (resultadoSessao.status === 0) {
            mostrarErroDashboard(resultadoSessao.mensagem);
        }
        return;
    }

    atualizarIcones();

    const botaoAtualizar = document.getElementById('botao-atualizar-dashboard');

    if (botaoAtualizar) {
        botaoAtualizar.addEventListener('click', carregarDadosDashboard);
    }

    await carregarDadosDashboard();
}

window.fazerLogout = async function () {
    if (!window.AuthSession) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    await window.AuthSession.fazerLogout();
};

document.addEventListener('DOMContentLoaded', inicializarDashboard);