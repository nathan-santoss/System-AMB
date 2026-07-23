const BASE_URL = '/api';

let matriculaAtual = null;


function atualizarIcones() {

    if (window.lucide) {

        window.lucide.createIcons();

    }

}


function authSessionEstaDisponivel() {

    if (!window.AuthSession) {

        return false;

    }

    if (
        typeof window.AuthSession.fetchAutenticado !== 'function'
    ) {

        return false;

    }

    if (
        typeof window.AuthSession.exigirSessao !== 'function'
    ) {

        return false;

    }

    return true;

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


async function respostaExigeNovoLogin(resposta) {

    if (!resposta) {

        return false;

    }

    if (
        resposta.status !== 401 &&
        resposta.status !== 403
    ) {

        return false;

    }

    if (authSessionEstaDisponivel()) {

        await window.AuthSession.fazerLogout();
        return true;

    }

    localStorage.removeItem('token');

    window.location.href = '/login';

    return true;

}


function obterTextoExibicao(valor, textoPadrao) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return textoPadrao;

    }

    const texto = String(valor).trim();

    if (texto.length === 0) {

        return textoPadrao;

    }

    return texto;

}


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


function definirTextoElemento(idElemento, texto) {

    const elemento = document.getElementById(idElemento);

    if (!elemento) {

        return;

    }

    elemento.textContent = texto;

}


function obterFormularioTriagem() {

    let formulario = document.getElementById('formTriagem');

    if (formulario) {

        return formulario;

    }

    formulario = document.getElementById('form-triagem');

    return formulario;

}


function obterModalAlergia() {

    let modal = document.getElementById('modal-backdrop');

    if (modal) {

        return modal;

    }

    modal = document.getElementById('modalAlergia');

    return modal;

}


function obterCampoDescricaoAlergia() {

    let campo = document.getElementById('descricao_alergia');

    if (campo) {

        return campo;

    }

    campo = document.getElementById('descricaoAlergia');

    return campo;

}


function definirBotaoCarregando(
    botao,
    carregando,
    textoCarregando
) {

    if (!botao) {

        return;

    }

    if (carregando) {

        if (!botao.dataset.conteudoOriginal) {

            botao.dataset.conteudoOriginal =
                botao.innerHTML;

        }

        botao.disabled = true;

        botao.classList.add(
            'opacity-70',
            'cursor-not-allowed'
        );

        botao.innerHTML = '';

        const icone = document.createElement('i');

        icone.setAttribute(
            'data-lucide',
            'loader-circle'
        );

        icone.className =
            'w-5 h-5 animate-spin inline-block mr-2';

        const texto = document.createElement('span');

        texto.textContent = textoCarregando;

        botao.appendChild(icone);
        botao.appendChild(texto);

        atualizarIcones();

        return;

    }

    botao.disabled = false;

    botao.classList.remove(
        'opacity-70',
        'cursor-not-allowed'
    );

    if (botao.dataset.conteudoOriginal) {

        botao.innerHTML =
            botao.dataset.conteudoOriginal;

    }

    atualizarIcones();

}


function formatarDataHora(valor) {

    if (!valor) {

        return 'Data não informada';

    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {

        return 'Data inválida';

    }

    return data.toLocaleString(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    );

}


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


async function carregarDadosPaciente(matricula) {

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL +
                '/funcionarios/' +
                encodeURIComponent(matricula),
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return false;

        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Funcionário não encontrado.'
            );

            throw new Error(mensagem);

        }

        definirTextoElemento(
            'info-nome',
            obterTextoExibicao(
                dados.nome,
                'Nome não informado'
            )
        );

        definirTextoElemento(
            'info-matricula',
            'Matrícula: ' +
            obterTextoExibicao(
                dados.matricula,
                matricula
            )
        );

        definirTextoElemento(
            'info-setor',
            obterTextoExibicao(
                dados.setor,
                'Não informado'
            )
        );

        definirTextoElemento(
            'info-cargo',
            obterTextoExibicao(
                dados.cargo,
                'Não informado'
            )
        );

        return true;

    } catch (erro) {

        console.error(
            'Erro ao carregar funcionário:',
            erro
        );

        alert(erro.message);

        window.location.href =
            '/consultar-paciente';

        return false;

    }

}


function mostrarAlergiasCarregando() {

    const lista = document.getElementById(
        'lista-alergias'
    );

    if (!lista) {

        return;

    }

    lista.innerHTML = '';

    const item = document.createElement('li');

    item.className =
        'text-red-400 flex items-center justify-center gap-2 py-4';

    const icone = document.createElement('i');

    icone.setAttribute(
        'data-lucide',
        'loader-circle'
    );

    icone.className =
        'animate-spin w-5 h-5';

    const texto = document.createElement('span');

    texto.textContent = 'Carregando alergias...';

    item.appendChild(icone);
    item.appendChild(texto);

    lista.appendChild(item);

    atualizarIcones();

}


function mostrarMensagemAlergias(
    mensagem,
    classeTexto
) {

    const lista = document.getElementById(
        'lista-alergias'
    );

    if (!lista) {

        return;

    }

    lista.innerHTML = '';

    const item = document.createElement('li');

    item.className =
        'text-sm text-center py-4 ' +
        classeTexto;

    item.textContent = mensagem;

    lista.appendChild(item);

}


function criarItemAlergia(alergia) {

    const item = document.createElement('li');

    item.className =
        'bg-white text-red-800 border border-red-200 rounded-lg p-3 text-sm flex justify-between items-center gap-3';

    const descricao = document.createElement('span');

    descricao.className =
        'font-medium break-words';

    descricao.textContent = obterTextoExibicao(
        alergia.descricao_alergia,
        'Alergia não informada'
    );

    const botaoExcluir = document.createElement('button');

    botaoExcluir.type = 'button';

    botaoExcluir.className =
        'text-red-400 hover:text-red-700 transition-colors shrink-0';

    botaoExcluir.title = 'Remover alergia';

    botaoExcluir.setAttribute(
        'aria-label',
        'Remover alergia'
    );

    const icone = document.createElement('i');

    icone.setAttribute(
        'data-lucide',
        'trash-2'
    );

    icone.className = 'w-4 h-4';

    botaoExcluir.appendChild(icone);

    botaoExcluir.addEventListener(
        'click',
        function () {

            excluirAlergia(
                alergia.id_alergia
            );

        }
    );

    item.appendChild(descricao);
    item.appendChild(botaoExcluir);

    return item;

}


async function carregarAlergias(matricula) {

    const lista = document.getElementById(
        'lista-alergias'
    );

    if (!lista) {

        return;

    }

    mostrarAlergiasCarregando();

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL +
                '/alergias?funcionario_matricula=' +
                encodeURIComponent(matricula),
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return;

        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível carregar as alergias.'
            );

            throw new Error(mensagem);

        }

        if (!Array.isArray(dados)) {

            throw new Error(
                'O servidor retornou uma lista de alergias inválida.'
            );

        }

        if (dados.length === 0) {

            mostrarMensagemAlergias(
                'Nenhuma alergia registrada.',
                'text-gray-500'
            );

            return;

        }

        lista.innerHTML = '';

        dados.forEach(
            function (alergia) {

                if (!alergia) {

                    return;

                }

                lista.appendChild(
                    criarItemAlergia(alergia)
                );

            }
        );

        atualizarIcones();

    } catch (erro) {

        console.error(
            'Erro ao carregar alergias:',
            erro
        );

        mostrarMensagemAlergias(
            erro.message,
            'text-red-600'
        );

    }

}


function abrirModalAlergia() {

    const modal = obterModalAlergia();

    if (!modal) {

        return;

    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.body.classList.add(
        'overflow-hidden'
    );

    const campoDescricao =
        obterCampoDescricaoAlergia();

    if (campoDescricao) {

        window.setTimeout(
            function () {

                campoDescricao.focus();

            },
            100
        );

    }

    atualizarIcones();

}


function fecharModalAlergia() {

    const modal = obterModalAlergia();

    if (!modal) {

        return;

    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    document.body.classList.remove(
        'overflow-hidden'
    );

    const formulario = document.getElementById(
        'formAlergia'
    );

    if (formulario) {

        formulario.reset();

    }

}


window.abrirModalAlergia =
    abrirModalAlergia;

window.fecharModalAlergia =
    fecharModalAlergia;


async function cadastrarAlergia(evento) {

    evento.preventDefault();

    if (!matriculaAtual) {

        alert(
            'A matrícula do funcionário não foi encontrada.'
        );

        return;

    }

    const campoDescricao =
        obterCampoDescricaoAlergia();

    if (!campoDescricao) {

        alert(
            'O campo de descrição da alergia não foi encontrado.'
        );

        return;

    }

    const descricao = campoDescricao.value.trim();

    if (descricao.length < 2) {

        alert(
            'Informe uma alergia com pelo menos 2 caracteres.'
        );

        campoDescricao.focus();

        return;

    }

    if (descricao.length > 255) {

        alert(
            'A descrição da alergia deve possuir no máximo 255 caracteres.'
        );

        campoDescricao.focus();

        return;

    }

    const formulario = document.getElementById(
        'formAlergia'
    );

    let botaoSalvar = null;

    if (formulario) {

        botaoSalvar = formulario.querySelector(
            'button[type="submit"]'
        );

    }

    definirBotaoCarregando(
        botaoSalvar,
        true,
        'Salvando...'
    );

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL + '/alergias',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        funcionario_matricula:
                            matriculaAtual,

                        descricao_alergia:
                            descricao
                    })
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return;

        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível cadastrar a alergia.'
            );

            throw new Error(mensagem);

        }

        fecharModalAlergia();

        await carregarAlergias(
            matriculaAtual
        );

        alert(
            'Alergia cadastrada com sucesso.'
        );

    } catch (erro) {

        console.error(
            'Erro ao cadastrar alergia:',
            erro
        );

        alert(erro.message);

    } finally {

        definirBotaoCarregando(
            botaoSalvar,
            false,
            'Salvando...'
        );

    }

}


async function excluirAlergia(idAlergia) {

    const id = Number(idAlergia);

    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {

        alert(
            'O identificador da alergia é inválido.'
        );

        return;

    }

    const confirmado = window.confirm(
        'Deseja realmente remover esta alergia?'
    );

    if (!confirmado) {

        return;

    }

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL +
                '/alergias/' +
                encodeURIComponent(id),
                {
                    method: 'DELETE'
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return;

        }

        if (!resposta.ok) {

            const dados = await lerRespostaJson(
                resposta
            );

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível remover a alergia.'
            );

            throw new Error(mensagem);

        }

        await carregarAlergias(
            matriculaAtual
        );

        alert(
            'Alergia removida com sucesso.'
        );

    } catch (erro) {

        console.error(
            'Erro ao excluir alergia:',
            erro
        );

        alert(erro.message);

    }

}


window.excluirAlergia = excluirAlergia;


function normalizarTemperatura(valor) {

    if (typeof valor !== 'string') {

        return null;

    }

    const valorNormalizado = valor
        .trim()
        .replace(',', '.');

    if (valorNormalizado.length === 0) {

        return null;

    }

    const numero = Number(valorNormalizado);

    if (!Number.isFinite(numero)) {

        return null;

    }

    return numero;

}


async function registrarAtendimento(evento) {

    evento.preventDefault();

    if (!matriculaAtual) {

        alert(
            'A matrícula do funcionário não foi encontrada.'
        );

        return;

    }

    const pressao = obterValorCampo('pressao');
    const temperaturaTexto =
        obterValorCampo('temperatura');
    const queixa = obterValorCampo('queixa');
    const gravidade = obterValorCampo('gravidade');
    const acaoTomada = obterValorCampo('acao');

    if (queixa.length === 0) {

        alert(
            'Informe a queixa principal.'
        );

        return;

    }

    if (gravidade.length === 0) {

        alert(
            'Selecione a gravidade do atendimento.'
        );

        return;

    }

    if (acaoTomada.length === 0) {

        alert(
            'Selecione a ação tomada.'
        );

        return;

    }

    let temperatura = null;

    if (temperaturaTexto.length > 0) {

        temperatura =
            normalizarTemperatura(
                temperaturaTexto
            );

        if (temperatura === null) {

            alert(
                'Informe uma temperatura válida.'
            );

            return;

        }

        if (
            temperatura < 0 ||
            temperatura > 100
        ) {

            alert(
                'A temperatura deve estar entre 0 e 100.'
            );

            return;

        }

    }

    const formulario = obterFormularioTriagem();

    let botaoSalvar = null;

    if (formulario) {

        botaoSalvar = formulario.querySelector(
            'button[type="submit"]'
        );

    }

    definirBotaoCarregando(
        botaoSalvar,
        true,
        'Salvando atendimento...'
    );

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL + '/atendimentos',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        funcionario_matricula:
                            matriculaAtual,

                        pressao_arterial:
                            pressao,

                        temperatura:
                            temperatura,

                        queixa_principal:
                            queixa,

                        gravidade:
                            gravidade,

                        acao_tomada:
                            acaoTomada
                    })
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return;

        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível registrar o atendimento.'
            );

            throw new Error(mensagem);

        }

        if (formulario) {

            formulario.reset();

        }

        await carregarHistoricoAtendimentos(
            matriculaAtual
        );

        alert(
            'Atendimento registrado com sucesso.'
        );

    } catch (erro) {

        console.error(
            'Erro ao registrar atendimento:',
            erro
        );

        alert(
            'Erro: ' + erro.message
        );

    } finally {

        definirBotaoCarregando(
            botaoSalvar,
            false,
            'Salvando atendimento...'
        );

    }

}


function mostrarHistoricoCarregando() {

    const container = document.getElementById(
        'historico-atendimentos'
    );

    if (!container) {

        return;

    }

    container.innerHTML = '';

    const mensagem = document.createElement('p');

    mensagem.className =
        'text-sm text-gray-500';

    mensagem.textContent =
        'Carregando histórico...';

    container.appendChild(mensagem);

}


function mostrarMensagemHistorico(
    mensagem,
    classeTexto
) {

    const container = document.getElementById(
        'historico-atendimentos'
    );

    if (!container) {

        return;

    }

    container.innerHTML = '';

    const elemento = document.createElement('p');

    elemento.className =
        'text-sm ' +
        classeTexto;

    elemento.textContent = mensagem;

    container.appendChild(elemento);

}


function criarItemHistorico(atendimento) {

    const item = document.createElement('article');

    item.className =
        'border-l-4 border-azulEscuro bg-gray-50 rounded-r-xl p-4 mb-4';

    const cabecalho = document.createElement('div');

    cabecalho.className =
        'flex flex-wrap items-center justify-between gap-2 mb-2';

    const data = document.createElement('p');

    data.className =
        'text-xs text-gray-500 font-medium';

    data.textContent =
        formatarDataHora(
            atendimento.data_hora_entrada
        );

    const gravidade = document.createElement('span');

    gravidade.className =
        'text-xs font-bold px-2.5 py-1 rounded-full ' +
        obterClasseGravidade(
            atendimento.gravidade
        );

    gravidade.textContent = obterTextoExibicao(
        atendimento.gravidade,
        'Não informada'
    );

    cabecalho.appendChild(data);
    cabecalho.appendChild(gravidade);

    const queixa = document.createElement('p');

    queixa.className =
        'text-sm text-gray-800 font-medium';

    queixa.textContent = obterTextoExibicao(
        atendimento.queixa_principal,
        'Queixa não informada'
    );

    const acao = document.createElement('p');

    acao.className =
        'text-xs text-gray-500 mt-2';

    acao.textContent =
        'Ação tomada: ' +
        obterTextoExibicao(
            atendimento.acao_tomada,
            'Não informada'
        );

    item.appendChild(cabecalho);
    item.appendChild(queixa);
    item.appendChild(acao);

    return item;

}


async function carregarHistoricoAtendimentos(
    matricula
) {

    const container = document.getElementById(
        'historico-atendimentos'
    );

    if (!container) {

        return;

    }

    mostrarHistoricoCarregando();

    try {

        const resposta =
            await window.AuthSession.fetchAutenticado(
                BASE_URL +
                '/atendimentos/' +
                encodeURIComponent(matricula),
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

        if (
            await respostaExigeNovoLogin(resposta)
        ) {

            return;

        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível carregar o histórico.'
            );

            throw new Error(mensagem);

        }

        if (!Array.isArray(dados)) {

            throw new Error(
                'O servidor retornou um histórico inválido.'
            );

        }

        if (dados.length === 0) {

            mostrarMensagemHistorico(
                'Nenhum atendimento anterior.',
                'text-gray-500'
            );

            return;

        }

        dados.sort(
            function (primeiro, segundo) {

                const dataPrimeiro = new Date(
                    primeiro.data_hora_entrada
                );

                const dataSegundo = new Date(
                    segundo.data_hora_entrada
                );

                return (
                    dataSegundo.getTime() -
                    dataPrimeiro.getTime()
                );

            }
        );

        container.innerHTML = '';

        dados.forEach(
            function (atendimento) {

                if (!atendimento) {

                    return;

                }

                container.appendChild(
                    criarItemHistorico(
                        atendimento
                    )
                );

            }
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar histórico:',
            erro
        );

        mostrarMensagemHistorico(
            erro.message,
            'text-red-600'
        );

    }

}


function configurarEventos() {

    const formularioAlergia =
        document.getElementById(
            'formAlergia'
        );

    const formularioTriagem =
        obterFormularioTriagem();

    const modalAlergia =
        obterModalAlergia();

    if (formularioAlergia) {

        formularioAlergia.addEventListener(
            'submit',
            cadastrarAlergia
        );

    }

    if (formularioTriagem) {

        formularioTriagem.addEventListener(
            'submit',
            registrarAtendimento
        );

    }

    if (modalAlergia) {

        modalAlergia.addEventListener(
            'click',
            function (evento) {

                if (evento.target === modalAlergia) {

                    fecharModalAlergia();

                }

            }
        );

    }

    document.addEventListener(
        'keydown',
        function (evento) {

            if (evento.key === 'Escape') {

                fecharModalAlergia();

            }

        }
    );

}


async function inicializarFichaPaciente() {

    atualizarIcones();

    if (!authSessionEstaDisponivel()) {

        console.error(
            'O arquivo auth-session.js não foi carregado.'
        );

        localStorage.removeItem('token');

        window.location.href = '/login';

        return;

    }

    const resultadoSessao =
        await window.AuthSession.exigirSessao();

    if (!resultadoSessao.autenticado) {

        if (resultadoSessao.status === 0) {

            alert(
                resultadoSessao.mensagem
            );

        }

        return;

    }

    const parametros = new URLSearchParams(
        window.location.search
    );

    const matriculaParametro =
        parametros.get('matricula');

    if (
        typeof matriculaParametro !== 'string' ||
        matriculaParametro.trim().length === 0
    ) {

        alert(
            'A matrícula do funcionário não foi informada.'
        );

        window.location.href =
            '/consultar-paciente';

        return;

    }

    matriculaAtual =
        matriculaParametro.trim();

    configurarEventos();

    const funcionarioValido =
        await carregarDadosPaciente(
            matriculaAtual
        );

    if (!funcionarioValido) {

        return;

    }

    await Promise.all([
        carregarAlergias(
            matriculaAtual
        ),

        carregarHistoricoAtendimentos(
            matriculaAtual
        )
    ]);

    atualizarIcones();

}


document.addEventListener(
    'DOMContentLoaded',
    inicializarFichaPaciente
);