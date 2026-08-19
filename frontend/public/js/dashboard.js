const DASHBOARD_BASE_URL = '/api';

// Primeiro eu inicializo os ícones da interface, caso a biblioteca esteja carregada no navegador.
function atualizarIcones() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Aqui eu crio uma função de segurança para evitar que códigos maliciosos sejam injetados no HTML.
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

// Agora eu garanto que o sistema exiba um texto amigável caso a informação solicitada não exista.
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

// Nesta parte eu asseguro que o valor seja tratado como um número válido e não negativo para os contadores.
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

// Aqui eu leio a resposta da API de forma isolada, evitando que o sistema quebre se o JSON for inválido.
async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

// Com isso eu analiso os dados retornados para extrair a melhor mensagem de erro disponível.
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

// Depois eu formato a data fornecida pelo banco para o padrão local brasileiro.
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

// Em seguida eu mapeio a gravidade do atendimento para aplicar as cores corretas no crachá visual.
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

// Aqui eu padronizo a forma como o texto é atualizado em qualquer elemento da página.
function definirTextoElemento(idElemento, valor) {
    const elemento = document.getElementById(idElemento);

    if (!elemento) {
        return;
    }

    elemento.textContent = String(valor);
}

// Antes de carregar os dados reais, eu aplico reticências nos contadores indicando o carregamento da API.
function definirContadoresCarregando() {
    definirTextoElemento('contador-hoje', '...');
    definirTextoElemento('count-normal', '...');
    definirTextoElemento('count-medio', '...');
    definirTextoElemento('count-grave', '...');
}

// Caso aconteça uma falha de rede, eu exibo traços para mostrar que a contagem está indisponível.
function definirContadoresErro() {
    definirTextoElemento('contador-hoje', 'Erro');
    definirTextoElemento('count-normal', '-');
    definirTextoElemento('count-medio', '-');
    definirTextoElemento('count-grave', '-');
}

// Agora eu atualizo os blocos de contagem na tela com os números precisos extraídos da API.
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

// Nesta parte eu crio uma linha inteira e genérica para exibir mensagens de aviso dentro da tabela.
function criarLinhaMensagemTabela(mensagem, classeTexto) {
    const linha = document.createElement('tr');
    const coluna = document.createElement('td');

    coluna.colSpan = 4;
    coluna.className = 'py-8 text-center text-sm ' + classeTexto;
    coluna.textContent = mensagem;

    linha.appendChild(coluna);

    return linha;
}

// Aqui eu injeto a mensagem de carregamento inicial no corpo da tabela de últimos atendimentos.
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

// Neste momento eu construo a linha completa com os dados isolados de cada atendimento.
function criarLinhaAtendimento(atendimento) {
    const linha = document.createElement('tr');
    linha.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

    // Primeiro eu configuro a coluna encarregada de exibir os dados pessoais do funcionário.
    const colunaPaciente = document.createElement('td');
    colunaPaciente.className = 'px-6 py-4';

    const nomeFuncionario = document.createElement('p');
    // Adiciono a restrição "whitespace-nowrap" aqui para impedir que o nome seja comprimido e cortado.
    nomeFuncionario.className = 'font-semibold text-azulEscuro whitespace-nowrap';
    nomeFuncionario.textContent = obterTextoExibicao(atendimento.nome, 'Funcionário sem nome');

    const dadosFuncionario = document.createElement('p');
    dadosFuncionario.className = 'text-xs text-slate-500 mt-1';

    const matricula = obterTextoExibicao(atendimento.funcionario_matricula, 'Matrícula não informada');
    dadosFuncionario.textContent = 'Matrícula: ' + matricula;

    colunaPaciente.appendChild(nomeFuncionario);
    colunaPaciente.appendChild(dadosFuncionario);

    // Agora eu preparo a coluna limpa exclusiva para a queixa principal.
    const colunaQueixa = document.createElement('td');
    colunaQueixa.className = 'px-6 py-4';

    const queixa = document.createElement('p');
    queixa.className = 'text-sm text-slate-600';
    queixa.textContent = obterTextoExibicao(atendimento.queixa_principal, 'Sem queixa registrada');

    colunaQueixa.appendChild(queixa);

    // Em seguida eu configuro a coluna para exibir a gravidade colorida como um pequeno cartão.
    const colunaGravidade = document.createElement('td');
    colunaGravidade.className = 'px-6 py-4 text-center';

    const gravidade = obterTextoExibicao(atendimento.gravidade, 'Não informada');
    const badgeGravidade = document.createElement('span');
    badgeGravidade.className = 'inline-flex px-3 py-1 text-xs font-bold rounded-full border ' + obterClasseGravidade(gravidade);
    badgeGravidade.textContent = gravidade;

    colunaGravidade.appendChild(badgeGravidade);

    // Depois eu formato a coluna de data e hora. 
    // Faço o uso imperativo da classe "whitespace-nowrap" aqui. Isso impede que a quebra de linha aconteça, garantindo que a hora não seja jogada para baixo e cortada visualmente.
    const colunaData = document.createElement('td');
    colunaData.className = 'px-6 py-4 text-center text-slate-500 text-xs whitespace-nowrap';
    colunaData.textContent = formatarDataHora(atendimento.data_hora_entrada);

    // Por fim eu anexo as colunas perfeitamente alinhadas na linha gerada.
    linha.appendChild(colunaPaciente);
    linha.appendChild(colunaQueixa);
    linha.appendChild(colunaGravidade);
    linha.appendChild(colunaData);

    return linha;
}

// Aqui eu listo todos os atendimentos retornados iterando sobre a estrutura JSON entregue pela API.
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

    // Por segurança, se os itens forem filtrados por falha nos blocos if acima, eu exibo a mensagem vazia.
    if (tabela.children.length === 0) {
        tabela.appendChild(
            criarLinhaMensagemTabela('Nenhum atendimento vinculado a um funcionário válido.', 'text-slate-400')
        );
    }
}

// Agora eu exibo a indicação temporal de que o ranking de setores está sendo processado.
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

// Com isso eu modelo a linha interativa de ranking para cada setor e a sua quantidade respectiva de idas ao ambulatório.
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

// Aqui eu injeto a lista final dos setores classificados na lateral da tela.
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

// Se ocorrer uma falha grave na conexão com o sistema, eu espalho a mensagem vermelha de erro.
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

// Este é o motor da tela onde eu disparo o gatilho para buscar todo o resumo gerencial no backend.
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

        // Em seguida eu distribuo o JSON extraído para as suas respectivas áreas de montagem na interface.
        renderizarContadores(dados);
        renderizarUltimosAtendimentos(dados.ultimosAtendimentos);
        renderizarRankingSetores(dados.atendimentosPorSetor);
        atualizarIcones();

    } catch (erro) {
        console.error('Erro ao carregar o dashboard:', erro);
        mostrarErroDashboard(erro.message);
    }
}

// Por fim eu orquestro a inicialização da dashboard validando primeiro a sessão ativa do usuário.
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

// Eu libero o comando de desconexão diretamente no escopo global para o botão da Sidebar funcionar perfeitamente.
window.fazerLogout = async function () {
    if (!window.AuthSession) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    await window.AuthSession.fazerLogout();
};

// Quando o navegador terminar de montar o esqueleto HTML, esse ouvinte entra em ação e inicia a busca de dados.
document.addEventListener('DOMContentLoaded', inicializarDashboard);