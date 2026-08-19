const DASHBOARD_BASE_URL = '/api';

// Aqui eu inicializo os ícones da interface caso a biblioteca esteja disponível.
function atualizarIcones() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Nesta parte eu crio uma função para evitar falhas de segurança com textos no HTML.
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

// Agora eu garanto que um texto padrão seja exibido caso o valor original seja inválido.
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

// Aqui eu transformo o valor recebido em um número seguro para exibição nos contadores.
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

// Neste ponto eu leio a resposta da API garantindo que não quebre a tela se o JSON for inválido.
async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

// Aqui eu extraio a melhor mensagem de erro possível dos dados retornados pelo backend.
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

// Em seguida eu formato a data e hora para o padrão brasileiro que será exibido na tabela.
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

// Nesta função eu defino as cores e estilos corretos para cada nível de gravidade.
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

// Aqui eu crio um utilitário simples para atualizar textos de elementos no HTML.
function definirTextoElemento(idElemento, valor) {
    const elemento = document.getElementById(idElemento);

    if (!elemento) {
        return;
    }

    elemento.textContent = String(valor);
}

// Antes de carregar os dados eu mostro um estado de carregamento visual nos contadores superiores.
function definirContadoresCarregando() {
    definirTextoElemento('contador-hoje', '...');
    definirTextoElemento('count-normal', '...');
    definirTextoElemento('count-medio', '...');
    definirTextoElemento('count-grave', '...');
}

// Caso ocorra algum erro eu atualizo os contadores para refletir a falha na obtenção dos dados.
function definirContadoresErro() {
    definirTextoElemento('contador-hoje', 'Erro');
    definirTextoElemento('count-normal', '-');
    definirTextoElemento('count-medio', '-');
    definirTextoElemento('count-grave', '-');
}

// Agora eu atualizo os contadores principais com as informações reais vindas da API.
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

// Aqui eu construo uma linha de tabela de ponta a ponta para exibir apenas mensagens textuais.
function criarLinhaMensagemTabela(mensagem, classeTexto) {
    const linha = document.createElement('tr');

    const coluna = document.createElement('td');
    // Para manter a tabela alinhada eu ocupo o espaço de todas as 4 colunas.
    coluna.colSpan = 4;
    coluna.className = 'py-8 text-center text-sm ' + classeTexto;
    coluna.textContent = mensagem;

    linha.appendChild(coluna);

    return linha;
}

// Neste momento eu aplico a mensagem de carregamento inicial na tabela de atendimentos.
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

// Nesta parte fundamental eu monto a linha da tabela separando cada dado na sua respectiva coluna.
function criarLinhaAtendimento(atendimento) {
    const linha = document.createElement('tr');
    linha.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

    // Primeiro eu crio a coluna 1 contendo o nome e a matrícula do paciente.
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

    // Agora eu crio a coluna 2 exclusiva para exibir a queixa do paciente.
    const colunaQueixa = document.createElement('td');
    colunaQueixa.className = 'px-6 py-4';

    const queixa = document.createElement('p');
    queixa.className = 'text-sm text-slate-600';
    queixa.textContent = obterTextoExibicao(atendimento.queixa_principal, 'Sem queixa registrada');

    colunaQueixa.appendChild(queixa);

    // Em seguida eu crio a coluna 3 que mostrará a tag visual do nível de gravidade.
    const colunaGravidade = document.createElement('td');
    colunaGravidade.className = 'px-6 py-4 text-center';

    const gravidade = obterTextoExibicao(atendimento.gravidade, 'Não informada');

    const badgeGravidade = document.createElement('span');
    badgeGravidade.className = 'inline-flex px-3 py-1 text-xs font-bold rounded-full border ' + obterClasseGravidade(gravidade);
    badgeGravidade.textContent = gravidade;

    colunaGravidade.appendChild(badgeGravidade);

    // Depois eu crio a coluna 4 contendo a data e a hora precisas do registro.
    const colunaData = document.createElement('td');
    colunaData.className = 'px-6 py-4 text-center text-slate-500 text-xs whitespace-nowrap';
    colunaData.textContent = formatarDataHora(atendimento.data_hora_entrada);

    // Por fim eu adiciono as quatro colunas organizadas dentro da linha.
    linha.appendChild(colunaPaciente);
    linha.appendChild(colunaQueixa);
    linha.appendChild(colunaGravidade);
    linha.appendChild(colunaData);

    return linha;
}

// Aqui eu processo a lista completa de atendimentos e os exibo estruturados na tabela.
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

    // Com isso eu navego pela lista gerando cada uma das linhas visuais.
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

    // Por segurança eu valido se sobrou alguma linha exibida para não mostrar uma tabela vazia.
    if (tabela.children.length === 0) {
        tabela.appendChild(
            criarLinhaMensagemTabela('Nenhum atendimento vinculado a um funcionário válido.', 'text-slate-400')
        );
    }
}

// Agora eu lido com a seção lateral do ranking, colocando uma mensagem de aviso inicial.
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

// Nesta parte eu monto um pequeno cartão listando o nome do setor e a quantidade somada.
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

// Em seguida eu exibo a lista processada do ranking de setores mais frequentes do mês.
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

    // Então eu populo a caixa lateral contendo as referências para todos os setores ativos.
    setores.forEach(function (setor) {
        if (!setor) {
            return;
        }

        container.appendChild(criarItemSetor(setor));
    });
}

// Caso algo dê errado eu injeto as mensagens de falha nas três frentes do painel.
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

// Este é o fluxo central encarregado de buscar os dados com o token de autorização.
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

        // Tendo os resultados em mãos eu executo as funções de preenchimento do HTML.
        renderizarContadores(dados);
        renderizarUltimosAtendimentos(dados.ultimosAtendimentos);
        renderizarRankingSetores(dados.atendimentosPorSetor);
        atualizarIcones();

    } catch (erro) {
        console.error('Erro ao carregar o dashboard:', erro);
        mostrarErroDashboard(erro.message);
    }
}

// Aqui eu valido a sessão e realizo a primeira chamada à API após a carga total da tela.
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

    // Com isso eu também conecto o botão de forçar atualização no cabeçalho do painel.
    const botaoAtualizar = document.getElementById('botao-atualizar-dashboard');

    if (botaoAtualizar) {
        botaoAtualizar.addEventListener('click', carregarDadosDashboard);
    }

    await carregarDadosDashboard();
}

// Para manter o projeto flexível eu possibilito o comando de logout em escopo global.
window.fazerLogout = async function () {
    if (!window.AuthSession) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    await window.AuthSession.fazerLogout();
};

// Por fim eu configuro o gatilho principal de injeção após a página ser totalmente interpretada.
document.addEventListener('DOMContentLoaded', inicializarDashboard);