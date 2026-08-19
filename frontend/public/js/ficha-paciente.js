const BASE_URL = '/api';
let matriculaAtual = null;

// Aqui eu inicio os ícones da biblioteca Lucide garantindo o aspecto gráfico do projeto.
function atualizarIcones() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Agora eu certifico que a instância global de autenticação existe antes de permitir requisições.
function authSessionEstaDisponivel() {
    if (!window.AuthSession) {
        return false;
    }

    if (typeof window.AuthSession.fetchAutenticado !== 'function') {
        return false;
    }

    if (typeof window.AuthSession.exigirSessao !== 'function') {
        return false;
    }

    return true;
}

// Nesta parte eu declaro um ajudante focado em converter respostas do Fetch sem risco de interrupção abrupta.
async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

// Aqui eu concentro a extração amigável do erro enviado pelo backend independente da sua estrutura.
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

// Neste ponto eu testo se o servidor recusa nossa sessão, e se for o caso orquestro a expulsão.
async function respostaExigeNovoLogin(resposta) {
    if (!resposta) {
        return false;
    }

    if (resposta.status !== 401) {
        if (resposta.status !== 403) {
            return false;
        }
    }

    if (authSessionEstaDisponivel()) {
        await window.AuthSession.fazerLogout();
        return true;
    }

    localStorage.removeItem('token');
    window.location.href = '/login';
    return true;
}

// Em seguida eu implemento um validador textual simples para evitar "null" espalhado no visual.
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

// Aqui eu busco valor seguro a partir de um campo input, sem margem para indefinições no formulário.
function obterValorCampo(idCampo) {
    const campo = document.getElementById(idCampo);

    if (!campo) {
        return '';
    }

    if (typeof campo.value !== 'string') {
        return '';
    }

    return campo.value.trim();
}

// Depois eu declaro um atalho para atribuir um texto duro num elemento específico da interface.
function definirTextoElemento(idElemento, texto) {
    const elemento = document.getElementById(idElemento);

    if (!elemento) {
        return;
    }

    elemento.textContent = texto;
}

// Com isso eu pesquiso o formulário de triagem respeitando possíveis divergências no HTML.
function obterFormularioTriagem() {
    let formulario = document.getElementById('formTriagem');

    if (formulario) {
        return formulario;
    }

    formulario = document.getElementById('form-triagem');
    return formulario;
}

// Para evitar problemas eu utilizo a mesma abordagem defensiva para obter o modal de alergias.
function obterModalAlergia() {
    let modal = document.getElementById('modal-backdrop');

    if (modal) {
        return modal;
    }

    modal = document.getElementById('modalAlergia');
    return modal;
}

// Agora eu garanto a busca pelo ID do campo de descrição de forma segura.
function obterCampoDescricaoAlergia() {
    let campo = document.getElementById('descricao_alergia');

    if (campo) {
        return campo;
    }

    campo = document.getElementById('descricaoAlergia');
    return campo;
}

// Nesta parte eu substituo o conteúdo nativo de um botão por um indicador rodando caso demore na requisição.
function definirBotaoCarregando(botao, carregando, textoCarregando) {
    if (!botao) {
        return;
    }

    if (carregando) {
        if (!botao.dataset.conteudoOriginal) {
            botao.dataset.conteudoOriginal = botao.innerHTML;
        }

        botao.disabled = true;
        botao.classList.add('opacity-70', 'cursor-not-allowed');
        botao.innerHTML = '';

        const icone = document.createElement('i');
        icone.setAttribute('data-lucide', 'loader-circle');
        icone.className = 'w-5 h-5 animate-spin inline-block mr-2';

        const texto = document.createElement('span');
        texto.textContent = textoCarregando;

        botao.appendChild(icone);
        botao.appendChild(texto);
        atualizarIcones();
        return;
    }

    botao.disabled = false;
    botao.classList.remove('opacity-70', 'cursor-not-allowed');

    if (botao.dataset.conteudoOriginal) {
        botao.innerHTML = botao.dataset.conteudoOriginal;
    }

    atualizarIcones();
}

// Aqui eu padronizo a conversão do timestamp da API para um texto legível em português.
function formatarDataHora(valor) {
    if (!valor) {
        return 'Data não informada';
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

// Em seguida eu amarro as lógicas de estilos utilitários às métricas textuais de gravidade registradas no banco.
function obterClasseGravidade(gravidade) {
    if (gravidade === 'Alta') {
        return 'text-red-700 bg-red-100';
    }

    if (gravidade === 'Média') {
        return 'text-yellow-700 bg-yellow-100';
    }

    if (gravidade === 'Baixa') {
        return 'text-green-700 bg-green-100';
    }

    return 'text-slate-700 bg-slate-100';
}

// Agora eu crio a indicação visual de que a lista de alergias está sendo carregada do servidor.
function mostrarAlergiasCarregando() {
    const lista = document.getElementById('lista-alergias');

    if (!lista) {
        return;
    }

    lista.innerHTML = '';

    const item = document.createElement('li');
    item.className = 'text-red-400 flex items-center justify-center gap-2 py-4';

    const icone = document.createElement('i');
    icone.setAttribute('data-lucide', 'loader-circle');
    icone.className = 'animate-spin w-5 h-5';

    const texto = document.createElement('span');
    texto.textContent = 'Carregando alergias...';

    item.appendChild(icone);
    item.appendChild(texto);
    lista.appendChild(item);

    atualizarIcones();
}

// Depois eu abro espaço para exibir mensagens literais na área de alergias, como sucesso ou erro.
function mostrarMensagemAlergias(mensagem, classeTexto) {
    const lista = document.getElementById('lista-alergias');

    if (!lista) {
        return;
    }

    lista.innerHTML = '';

    const item = document.createElement('li');
    item.className = 'text-sm text-center py-4 ' + classeTexto;
    item.textContent = mensagem;

    lista.appendChild(item);
}

// Aqui eu renderizo uma pílula informativa individual conectada diretamente ao ícone de lixeira.
function criarItemAlergia(alergia) {
    const item = document.createElement('li');
    item.className = 'bg-white text-red-800 border border-red-200 rounded-lg p-3 text-sm flex justify-between items-center gap-3';

    const descricao = document.createElement('span');
    descricao.className = 'font-medium break-words';
    descricao.textContent = obterTextoExibicao(alergia.descricao_alergia, 'Alergia não informada');

    const botaoExcluir = document.createElement('button');
    botaoExcluir.type = 'button';
    botaoExcluir.className = 'text-red-400 hover:text-red-700 transition-colors shrink-0';
    botaoExcluir.title = 'Remover alergia';
    botaoExcluir.setAttribute('aria-label', 'Remover alergia');

    const icone = document.createElement('i');
    icone.setAttribute('data-lucide', 'trash-2');
    icone.className = 'w-4 h-4';

    botaoExcluir.appendChild(icone);

    botaoExcluir.addEventListener('click', function () {
        excluirAlergia(alergia.id_alergia);
    });

    item.appendChild(descricao);
    item.appendChild(botaoExcluir);

    return item;
}

// Neste ponto eu leio a lista de alergias extraída do molde do prontuário e injeto no HTML.
function renderizarAlergias(alergias) {
    const lista = document.getElementById('lista-alergias');

    if (!lista) {
        return;
    }

    if (!Array.isArray(alergias)) {
        mostrarMensagemAlergias('Lista de alergias inválida.', 'text-red-600');
        return;
    }

    if (alergias.length === 0) {
        mostrarMensagemAlergias('Nenhuma alergia registrada.', 'text-gray-500');
        return;
    }

    lista.innerHTML = '';

    alergias.forEach(function (alergia) {
        if (!alergia) {
            return;
        }

        lista.appendChild(criarItemAlergia(alergia));
    });

    atualizarIcones();
}

// Aqui eu exibo na sessão correspondente da tela que o histórico de consultas está sendo recuperado.
function mostrarHistoricoCarregando() {
    const container = document.getElementById('historico-atendimentos');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const mensagem = document.createElement('p');
    mensagem.className = 'text-sm text-gray-500';
    mensagem.textContent = 'Carregando histórico...';

    container.appendChild(mensagem);
}

// Em seguida eu defino a impressão textual caso ocorra um impedimento na exibição do histórico.
function mostrarMensagemHistorico(mensagem, classeTexto) {
    const container = document.getElementById('historico-atendimentos');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const elemento = document.createElement('p');
    elemento.className = 'text-sm ' + classeTexto;
    elemento.textContent = mensagem;

    container.appendChild(elemento);
}

// Depois eu injeto e renderizo de forma visual cada item do histórico, formatando a queixa e a ação.
function criarItemHistorico(atendimento) {
    const item = document.createElement('article');
    item.className = 'border-l-4 border-azulEscuro bg-gray-50 rounded-r-xl p-4 mb-4';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'flex flex-wrap items-center justify-between gap-2 mb-2';

    const data = document.createElement('p');
    data.className = 'text-xs text-gray-500 font-medium';
    data.textContent = formatarDataHora(atendimento.data_hora_entrada);

    const gravidade = document.createElement('span');
    gravidade.className = 'text-xs font-bold px-2.5 py-1 rounded-full ' + obterClasseGravidade(atendimento.gravidade);
    gravidade.textContent = obterTextoExibicao(atendimento.gravidade, 'Não informada');

    cabecalho.appendChild(data);
    cabecalho.appendChild(gravidade);

    const queixa = document.createElement('p');
    queixa.className = 'text-sm text-gray-800 font-medium';
    queixa.textContent = obterTextoExibicao(atendimento.queixa_principal, 'Queixa não informada');

    const acao = document.createElement('p');
    acao.className = 'text-xs text-gray-500 mt-2';
    acao.textContent = 'Ação tomada: ' + obterTextoExibicao(atendimento.acao_tomada, 'Não informada');

    item.appendChild(cabecalho);
    item.appendChild(queixa);
    item.appendChild(acao);

    return item;
}

// Com isso eu leio os atendimentos do molde e os ordeno para exibição imediata no painel.
function renderizarHistoricoAtendimentos(atendimentos) {
    const container = document.getElementById('historico-atendimentos');

    if (!container) {
        return;
    }

    if (!Array.isArray(atendimentos)) {
        mostrarMensagemHistorico('Histórico inválido.', 'text-red-600');
        return;
    }

    if (atendimentos.length === 0) {
        mostrarMensagemHistorico('Nenhum atendimento anterior.', 'text-gray-500');
        return;
    }

    // Por organização, eu ordeno o array garantindo que as datas mais recentes fiquem no topo.
    atendimentos.sort(function (primeiro, segundo) {
        const dataPrimeiro = new Date(primeiro.data_hora_entrada);
        const dataSegundo = new Date(segundo.data_hora_entrada);
        return dataSegundo.getTime() - dataPrimeiro.getTime();
    });

    container.innerHTML = '';

    atendimentos.forEach(function (atendimento) {
        if (!atendimento) {
            return;
        }

        container.appendChild(criarItemHistorico(atendimento));
    });
}

// Neste momento eu resgato o MOLDE completo do paciente, centralizando todas as informações em uma única rota.
async function carregarDadosPaciente(matricula) {
    mostrarAlergiasCarregando();
    mostrarHistoricoCarregando();

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            BASE_URL + '/funcionarios/' + encodeURIComponent(matricula),
            {
                method: 'GET',
                cache: 'no-store'
            }
        );

        const invalido = await respostaExigeNovoLogin(resposta);

        if (invalido) {
            return false;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Funcionário não encontrado.');
            throw new Error(mensagem);
        }

        // Aqui eu verifico a estrutura da resposta para extrair o funcionário, alergias e atendimentos de forma robusta.
        let funcionario = dados;
        let alergias = [];
        let atendimentos = [];

        if (dados.funcionario) {
            funcionario = dados.funcionario;

            if (Array.isArray(dados.alergias)) {
                alergias = dados.alergias;
            }

            if (Array.isArray(dados.atendimentos)) {
                atendimentos = dados.atendimentos;
            }
        }

        // Em seguida eu preencho os blocos do cabeçalho da ficha com os dados pessoais do funcionário.
        definirTextoElemento(
            'info-nome',
            obterTextoExibicao(funcionario.nome, 'Nome não informado')
        );

        definirTextoElemento(
            'info-matricula',
            'Matrícula: ' + obterTextoExibicao(funcionario.matricula, matricula)
        );

        definirTextoElemento(
            'info-setor',
            obterTextoExibicao(funcionario.setor, 'Não informado')
        );

        definirTextoElemento(
            'info-cargo',
            obterTextoExibicao(funcionario.cargo, 'Não informado')
        );

        // Depois eu chamo as funções responsáveis por renderizar as listas baseadas nos dados do pacote único recebido.
        renderizarAlergias(alergias);
        renderizarHistoricoAtendimentos(atendimentos);

        return true;

    } catch (erro) {
        console.error('Erro ao carregar prontuário completo:', erro);
        alert(erro.message);
        window.location.href = '/consultar-paciente';
        return false;
    }
}

// Em seguida eu exibo a janela flutuante modal para criar um novo registro no alerta médico.
function abrirModalAlergia() {
    const modal = obterModalAlergia();

    if (!modal) {
        return;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');

    const campoDescricao = obterCampoDescricaoAlergia();

    if (campoDescricao) {
        window.setTimeout(function () {
            campoDescricao.focus();
        }, 100);
    }

    atualizarIcones();
}

// Para evitar travamentos eu trato o fechamento devolvendo a capacidade de rolar a página da ficha.
function fecharModalAlergia() {
    const modal = obterModalAlergia();

    if (!modal) {
        return;
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');

    const formulario = document.getElementById('formAlergia');

    if (formulario) {
        formulario.reset();
    }
}

// Exponho tais funções explicitamente no objeto window para garantir acesso aos eventos inline do HTML.
window.abrirModalAlergia = abrirModalAlergia;
window.fecharModalAlergia = fecharModalAlergia;

// Nesta etapa eu capturo o evento original de envio e cadastro no banco a string descrevendo o alerta de saúde.
async function cadastrarAlergia(evento) {
    evento.preventDefault();

    if (!matriculaAtual) {
        alert('A matrícula do funcionário não foi encontrada.');
        return;
    }

    const campoDescricao = obterCampoDescricaoAlergia();

    if (!campoDescricao) {
        alert('O campo de descrição da alergia não foi encontrado.');
        return;
    }

    const descricao = campoDescricao.value.trim();

    if (descricao.length < 2) {
        alert('Informe uma alergia com pelo menos 2 caracteres.');
        campoDescricao.focus();
        return;
    }

    if (descricao.length > 255) {
        alert('A descrição da alergia deve possuir no máximo 255 caracteres.');
        campoDescricao.focus();
        return;
    }

    const formulario = document.getElementById('formAlergia');
    let botaoSalvar = null;

    if (formulario) {
        botaoSalvar = formulario.querySelector('button[type="submit"]');
    }

    definirBotaoCarregando(botaoSalvar, true, 'Salvando...');

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            BASE_URL + '/alergias',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    funcionario_matricula: matriculaAtual,
                    descricao_alergia: descricao
                })
            }
        );

        const invalido = await respostaExigeNovoLogin(resposta);

        if (invalido) {
            return;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível cadastrar a alergia.');
            throw new Error(mensagem);
        }

        fecharModalAlergia();

        // Após o cadastro da alergia, eu carrego a ficha inteira novamente usando o molde centralizado.
        await carregarDadosPaciente(matriculaAtual);
        alert('Alergia cadastrada com sucesso.');

    } catch (erro) {
        console.error('Erro ao cadastrar alergia:', erro);
        alert(erro.message);
    } finally {
        definirBotaoCarregando(botaoSalvar, false, 'Salvando...');
    }
}

// Aqui eu crio o fluxo responsável por contatar a API e varrer do banco de dados o registro da alergia em questão.
async function excluirAlergia(idAlergia) {
    const id = Number(idAlergia);

    if (!Number.isSafeInteger(id)) {
        alert('O identificador da alergia é inválido.');
        return;
    }

    if (id <= 0) {
        alert('O identificador da alergia é inválido.');
        return;
    }

    const confirmado = window.confirm('Deseja realmente remover esta alergia?');

    if (!confirmado) {
        return;
    }

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            BASE_URL + '/alergias/' + encodeURIComponent(id),
            {
                method: 'DELETE'
            }
        );

        const invalido = await respostaExigeNovoLogin(resposta);

        if (invalido) {
            return;
        }

        if (!resposta.ok) {
            const dados = await lerRespostaJson(resposta);
            const mensagem = obterMensagemErro(dados, 'Não foi possível remover a alergia.');
            throw new Error(mensagem);
        }

        // Da mesma forma, eu reabasteço todo o prontuário pela rota mestra para manter a consistência da tela.
        await carregarDadosPaciente(matriculaAtual);
        alert('Alergia removida com sucesso.');

    } catch (erro) {
        console.error('Erro ao excluir alergia:', erro);
        alert(erro.message);
    }
}

// Por segurança eu amarro também essa ação de exclusão no contexto raiz.
window.excluirAlergia = excluirAlergia;

// Neste momento eu troco qualquer forma mal digitada de separador decimal permitindo que o sistema interprete.
function normalizarTemperatura(valor) {
    if (typeof valor !== 'string') {
        return null;
    }

    const valorNormalizado = valor.trim().replace(',', '.');

    if (valorNormalizado.length === 0) {
        return null;
    }

    const numero = Number(valorNormalizado);

    if (!Number.isFinite(numero)) {
        return null;
    }

    return numero;
}

// Agora eu unifico todas as checagens preventivas do formulário vital de ocorrências do paciente.
async function registrarAtendimento(evento) {
    evento.preventDefault();

    if (!matriculaAtual) {
        alert('A matrícula do funcionário não foi encontrada.');
        return;
    }

    const pressao = obterValorCampo('pressao');
    const temperaturaTexto = obterValorCampo('temperatura');
    const queixa = obterValorCampo('queixa');
    const gravidade = obterValorCampo('gravidade');
    const acaoTomada = obterValorCampo('acao');

    if (queixa.length === 0) {
        alert('Informe a queixa principal.');
        return;
    }

    if (gravidade.length === 0) {
        alert('Selecione a gravidade do atendimento.');
        return;
    }

    if (acaoTomada.length === 0) {
        alert('Selecione a ação tomada.');
        return;
    }

    let temperatura = null;

    if (temperaturaTexto.length > 0) {
        temperatura = normalizarTemperatura(temperaturaTexto);

        if (temperatura === null) {
            alert('Informe uma temperatura válida.');
            return;
        }

        if (temperatura < 0) {
            alert('A temperatura deve estar entre 0 e 100.');
            return;
        }

        if (temperatura > 100) {
            alert('A temperatura deve estar entre 0 e 100.');
            return;
        }
    }

    const formulario = obterFormularioTriagem();
    let botaoSalvar = null;

    if (formulario) {
        botaoSalvar = formulario.querySelector('button[type="submit"]');
    }

    definirBotaoCarregando(botaoSalvar, true, 'Salvando atendimento...');

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            BASE_URL + '/atendimentos',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    funcionario_matricula: matriculaAtual,
                    pressao_arterial: pressao,
                    temperatura: temperatura,
                    queixa_principal: queixa,
                    gravidade: gravidade,
                    acao_tomada: acaoTomada
                })
            }
        );

        const invalido = await respostaExigeNovoLogin(resposta);

        if (invalido) {
            return;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível registrar o atendimento.');
            throw new Error(mensagem);
        }

        if (formulario) {
            formulario.reset();
        }

        // Ao invés de buscar só os atendimentos, eu atualizo a ficha do paciente toda com o molde unificado.
        await carregarDadosPaciente(matriculaAtual);
        alert('Atendimento registrado com sucesso.');

    } catch (erro) {
        console.error('Erro ao registrar atendimento:', erro);
        alert('Erro: ' + erro.message);
    } finally {
        definirBotaoCarregando(botaoSalvar, false, 'Salvando atendimento...');
    }
}

// Nesta parte eu articulo todos os engates das funções com suas respectivas reações oriundas da interface do usuário.
function configurarEventos() {
    const formularioAlergia = document.getElementById('formAlergia');
    const formularioTriagem = obterFormularioTriagem();
    const modalAlergia = obterModalAlergia();

    if (formularioAlergia) {
        formularioAlergia.addEventListener('submit', cadastrarAlergia);
    }

    if (formularioTriagem) {
        formularioTriagem.addEventListener('submit', registrarAtendimento);
    }

    if (modalAlergia) {
        modalAlergia.addEventListener('click', function (evento) {
            if (evento.target === modalAlergia) {
                fecharModalAlergia();
            }
        });
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharModalAlergia();
        }
    });
}

// Por fim eu gerencio o momento de inicialização e extração de chaves da URL no momento em que a DOM está engatilhada.
async function inicializarFichaPaciente() {
    atualizarIcones();

    if (!authSessionEstaDisponivel()) {
        console.error('O arquivo auth-session.js não foi carregado.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    const resultadoSessao = await window.AuthSession.exigirSessao();

    if (!resultadoSessao.autenticado) {
        if (resultadoSessao.status === 0) {
            alert(resultadoSessao.mensagem);
        }
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const matriculaParametro = parametros.get('matricula');

    if (typeof matriculaParametro !== 'string') {
        alert('A matrícula do funcionário não foi informada.');
        window.location.href = '/consultar-paciente';
        return;
    }

    if (matriculaParametro.trim().length === 0) {
        alert('A matrícula do funcionário não foi informada.');
        window.location.href = '/consultar-paciente';
        return;
    }

    matriculaAtual = matriculaParametro.trim();

    configurarEventos();

    // Aqui eu engatilho a chamada principal que agora resgata e plota todo o molde do paciente de uma só vez.
    await carregarDadosPaciente(matriculaAtual);

    atualizarIcones();
}

// Aqui eu confirmo o gatilho da renderização completa e encadeio o processo central.
document.addEventListener('DOMContentLoaded', inicializarFichaPaciente);