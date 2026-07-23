const BASE_URL = '/api';


function obterToken() {

    return localStorage.getItem('token');

}


function fazerLogout() {

    localStorage.removeItem('token');
    window.location.href = '/login';

}


window.fazerLogout = fazerLogout;


function verificarAutenticacao() {

    const token = obterToken();

    if (!token) {

        fazerLogout();
        return false;

    }

    return true;

}


function respostaExigeNovoLogin(resposta) {

    if (resposta.status === 401) {

        fazerLogout();
        return true;

    }

    if (resposta.status === 403) {

        fazerLogout();
        return true;

    }

    return false;

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

            return dados.erro;

        }

        if (typeof dados.message === 'string') {

            return dados.message;

        }

        if (Array.isArray(dados.detalhes)) {

            if (dados.detalhes.length > 0) {

                return dados.detalhes.join(' ');

            }

        }

    }

    return mensagemPadrao;

}


function escapeHTML(valor) {

    if (valor === null || valor === undefined) {

        return '';

    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function atualizarIcones() {

    if (window.lucide) {

        window.lucide.createIcons();

    }

}


function obterMatriculaUrl() {

    const parametros = new URLSearchParams(
        window.location.search
    );

    const matricula = parametros.get('matricula');

    if (typeof matricula !== 'string') {

        return '';

    }

    return matricula.trim();

}


function obterTextoExibicao(valor) {

    if (valor === null || valor === undefined) {

        return 'Não informado';

    }

    const texto = String(valor).trim();

    if (texto.length === 0) {

        return 'Não informado';

    }

    return texto;

}


function formatarMatricula(matricula) {

    return 'Matrícula: ' + obterTextoExibicao(matricula);

}


function normalizarTemperatura(valor) {

    if (typeof valor !== 'string') {

        return valor;

    }

    const temperaturaNormalizada = valor
        .trim()
        .replace(',', '.');

    if (temperaturaNormalizada.length === 0) {

        return null;

    }

    return temperaturaNormalizada;

}


function abrirModalAlergia() {

    const modal = document.getElementById(
        'modal-backdrop'
    );

    if (!modal) {

        return;

    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const campoDescricao = document.getElementById(
        'descricao_alergia'
    );

    if (campoDescricao) {

        window.setTimeout(() => {

            campoDescricao.focus();

        }, 100);

    }

    atualizarIcones();

}


function fecharModalAlergia() {

    const modal = document.getElementById(
        'modal-backdrop'
    );

    const formulario = document.getElementById(
        'formAlergia'
    );

    if (modal) {

        modal.classList.add('hidden');
        modal.classList.remove('flex');

    }

    if (formulario) {

        formulario.reset();

    }

}


window.abrirModalAlergia = abrirModalAlergia;
window.fecharModalAlergia = fecharModalAlergia;


async function carregarDadosFuncionario(matricula) {

    try {

        const resposta = await fetch(
            BASE_URL +
            '/funcionarios/' +
            encodeURIComponent(matricula),
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + obterToken()
                }
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

            return;

        }

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Funcionário não encontrado.'
            );

            throw new Error(mensagem);

        }

        const elementoNome = document.getElementById(
            'info-nome'
        );

        const elementoMatricula = document.getElementById(
            'info-matricula'
        );

        const elementoSetor = document.getElementById(
            'info-setor'
        );

        const elementoCargo = document.getElementById(
            'info-cargo'
        );

        if (elementoNome) {

            elementoNome.textContent = obterTextoExibicao(
                dados.nome
            );

        }

        if (elementoMatricula) {

            elementoMatricula.textContent = formatarMatricula(
                dados.matricula
            );

        }

        if (elementoSetor) {

            elementoSetor.textContent = obterTextoExibicao(
                dados.setor
            );

        }

        if (elementoCargo) {

            elementoCargo.textContent = obterTextoExibicao(
                dados.cargo
            );

        }

    } catch (erro) {

        console.error(
            'Erro ao carregar funcionário:',
            erro
        );

        alert(
            erro.message
        );

        window.location.href = '/consultar-paciente';

    }

}


function mostrarAlergiasCarregando() {

    const lista = document.getElementById(
        'lista-alergias'
    );

    if (!lista) {

        return;

    }

    lista.innerHTML = `
        <li class="text-red-400 flex items-center justify-center gap-2 py-4">
            <i data-lucide="loader-circle" class="animate-spin w-5 h-5"></i>
            <span>Carregando alergias...</span>
        </li>
    `;

    atualizarIcones();

}


function mostrarAlergiasVazias() {

    const lista = document.getElementById(
        'lista-alergias'
    );

    if (!lista) {

        return;

    }

    lista.innerHTML = `
        <li class="text-sm text-red-500 bg-white/70 border border-red-100 rounded-xl p-4 text-center">
            Nenhuma alergia registrada.
        </li>
    `;

}


function criarItemAlergia(alergia) {

    const item = document.createElement('li');

    item.className =
        'bg-white border border-red-100 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm';

    const descricao = document.createElement('span');

    descricao.className =
        'text-sm font-semibold text-red-800 break-words';

    descricao.textContent = obterTextoExibicao(
        alergia.descricao_alergia
    );

    const botaoExcluir = document.createElement('button');

    botaoExcluir.type = 'button';
    botaoExcluir.className =
        'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-red-400 hover:text-red-700 hover:bg-red-100 transition-all';

    botaoExcluir.title = 'Remover alergia';

    botaoExcluir.innerHTML = `
        <i data-lucide="trash-2" class="w-4 h-4"></i>
    `;

    botaoExcluir.addEventListener(
        'click',
        () => {

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

        const resposta = await fetch(
            BASE_URL +
            '/alergias?funcionario_matricula=' +
            encodeURIComponent(matricula),
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + obterToken()
                }
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

            return;

        }

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível carregar as alergias.'
            );

            throw new Error(mensagem);

        }

        if (!Array.isArray(dados)) {

            throw new Error(
                'A resposta das alergias possui um formato inválido.'
            );

        }

        lista.innerHTML = '';

        if (dados.length === 0) {

            mostrarAlergiasVazias();
            return;

        }

        dados.forEach(alergia => {

            const item = criarItemAlergia(
                alergia
            );

            lista.appendChild(item);

        });

        atualizarIcones();

    } catch (erro) {

        console.error(
            'Erro ao carregar alergias:',
            erro
        );

        lista.innerHTML = `
            <li class="text-sm text-red-600 bg-white border border-red-200 rounded-xl p-4 text-center">
                ${escapeHTML(erro.message)}
            </li>
        `;

    }

}


async function cadastrarAlergia(evento) {

    evento.preventDefault();

    if (!verificarAutenticacao()) {

        return;

    }

    const matricula = obterMatriculaUrl();

    const campoDescricao = document.getElementById(
        'descricao_alergia'
    );

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

    try {

        const resposta = await fetch(
            BASE_URL + '/alergias',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + obterToken()
                },
                body: JSON.stringify({
                    funcionario_matricula: matricula,
                    descricao_alergia: descricao
                })
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

            return;

        }

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível cadastrar a alergia.'
            );

            throw new Error(mensagem);

        }

        fecharModalAlergia();

        await carregarAlergias(
            matricula
        );

        alert(
            'Alergia cadastrada com sucesso.'
        );

    } catch (erro) {

        console.error(
            'Erro ao cadastrar alergia:',
            erro
        );

        alert(
            erro.message
        );

    }

}


async function excluirAlergia(idAlergia) {

    if (!verificarAutenticacao()) {

        return;

    }

    const confirmado = window.confirm(
        'Deseja realmente remover esta alergia?'
    );

    if (!confirmado) {

        return;

    }

    try {

        const resposta = await fetch(
            BASE_URL +
            '/alergias/' +
            encodeURIComponent(idAlergia),
            {
                method: 'DELETE',
                headers: {
                    Authorization: 'Bearer ' + obterToken()
                }
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

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

        const matricula = obterMatriculaUrl();

        await carregarAlergias(
            matricula
        );

    } catch (erro) {

        console.error(
            'Erro ao excluir alergia:',
            erro
        );

        alert(
            erro.message
        );

    }

}


window.excluirAlergia = excluirAlergia;


async function registrarAtendimento(evento) {

    evento.preventDefault();

    if (!verificarAutenticacao()) {

        return;

    }

    const matricula = obterMatriculaUrl();

    const campoPressao = document.getElementById(
        'pressao'
    );

    const campoTemperatura = document.getElementById(
        'temperatura'
    );

    const campoQueixa = document.getElementById(
        'queixa'
    );

    const campoGravidade = document.getElementById(
        'gravidade'
    );

    const campoAcao = document.getElementById(
        'acao'
    );

    if (
        !campoPressao ||
        !campoTemperatura ||
        !campoQueixa ||
        !campoGravidade ||
        !campoAcao
    ) {

        alert(
            'Não foi possível localizar todos os campos da triagem.'
        );

        return;

    }

    const pressao = campoPressao.value.trim();

    const temperatura = normalizarTemperatura(
        campoTemperatura.value
    );

    const queixa = campoQueixa.value.trim();

    const gravidade = campoGravidade.value.trim();

    const acao = campoAcao.value.trim();

    if (pressao.length === 0) {

        alert(
            'Informe a pressão arterial.'
        );

        campoPressao.focus();
        return;

    }

    if (temperatura === null) {

        alert(
            'Informe a temperatura.'
        );

        campoTemperatura.focus();
        return;

    }

    const temperaturaNumerica = Number(
        temperatura
    );

    if (!Number.isFinite(temperaturaNumerica)) {

        alert(
            'Informe uma temperatura válida.'
        );

        campoTemperatura.focus();
        return;

    }

    if (
        temperaturaNumerica < 0 ||
        temperaturaNumerica > 100
    ) {

        alert(
            'A temperatura deve estar entre 0 e 100.'
        );

        campoTemperatura.focus();
        return;

    }

    if (queixa.length === 0) {

        alert(
            'Informe a queixa principal.'
        );

        campoQueixa.focus();
        return;

    }

    if (gravidade.length === 0) {

        alert(
            'Selecione a gravidade.'
        );

        campoGravidade.focus();
        return;

    }

    if (acao.length === 0) {

        alert(
            'Selecione a ação tomada.'
        );

        campoAcao.focus();
        return;

    }

    try {

        const resposta = await fetch(
            BASE_URL + '/atendimentos',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + obterToken()
                },
                body: JSON.stringify({
                    funcionario_matricula: matricula,
                    pressao_arterial: pressao,
                    temperatura: temperaturaNumerica,
                    queixa_principal: queixa,
                    gravidade,
                    acao_tomada: acao
                })
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

            return;

        }

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível registrar o atendimento.'
            );

            throw new Error(mensagem);

        }

        const formulario = document.getElementById(
            'formTriagem'
        );

        if (formulario) {

            formulario.reset();

        }

        alert(
            'Atendimento registrado com sucesso.'
        );

        await carregarHistoricoAtendimentos(
            matricula
        );

    } catch (erro) {

        console.error(
            'Erro ao registrar atendimento:',
            erro
        );

        alert(
            erro.message
        );

    }

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
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );

}


function criarItemHistorico(atendimento) {

    const item = document.createElement('div');

    item.className =
        'border-l-4 border-azulEscuro bg-slate-50 rounded-r-xl p-4';

    item.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <p class="text-xs font-semibold text-slate-500">
                ${escapeHTML(formatarDataHora(atendimento.data_hora_entrada))}
            </p>
            <span class="text-xs font-bold text-azulEscuro">
                ${escapeHTML(obterTextoExibicao(atendimento.gravidade))}
            </span>
        </div>

        <p class="text-sm text-slate-700 font-medium">
            ${escapeHTML(obterTextoExibicao(atendimento.queixa_principal))}
        </p>

        <p class="text-xs text-slate-500 mt-2">
            Ação: ${escapeHTML(obterTextoExibicao(atendimento.acao_tomada))}
        </p>
    `;

    return item;

}


async function carregarHistoricoAtendimentos(matricula) {

    const container = document.getElementById(
        'historico-atendimentos'
    );

    if (!container) {

        return;

    }

    container.innerHTML = `
        <div class="text-sm text-slate-400 flex items-center justify-center gap-2 py-4">
            <i data-lucide="loader-circle" class="w-5 h-5 animate-spin"></i>
            Carregando histórico...
        </div>
    `;

    atualizarIcones();

    try {

        const resposta = await fetch(
            BASE_URL +
            '/atendimentos/' +
            encodeURIComponent(matricula),
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + obterToken()
                }
            }
        );

        if (respostaExigeNovoLogin(resposta)) {

            return;

        }

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'Não foi possível carregar o histórico.'
            );

            throw new Error(mensagem);

        }

        container.innerHTML = '';

        if (!Array.isArray(dados)) {

            throw new Error(
                'O histórico possui um formato inválido.'
            );

        }

        if (dados.length === 0) {

            container.innerHTML = `
                <p class="text-sm text-slate-500 text-center py-4">
                    Nenhum atendimento anterior.
                </p>
            `;

            return;

        }

        dados.forEach(atendimento => {

            const item = criarItemHistorico(
                atendimento
            );

            container.appendChild(item);

        });

    } catch (erro) {

        console.error(
            'Erro ao carregar histórico:',
            erro
        );

        container.innerHTML = `
            <p class="text-sm text-red-600 text-center py-4">
                ${escapeHTML(erro.message)}
            </p>
        `;

    }

}


function configurarEventos() {

    const formularioTriagem = document.getElementById(
        'formTriagem'
    );

    const formularioAlergia = document.getElementById(
        'formAlergia'
    );

    const modalAlergia = document.getElementById(
        'modal-backdrop'
    );

    if (formularioTriagem) {

        formularioTriagem.addEventListener(
            'submit',
            registrarAtendimento
        );

    }

    if (formularioAlergia) {

        formularioAlergia.addEventListener(
            'submit',
            cadastrarAlergia
        );

    }

    if (modalAlergia) {

        modalAlergia.addEventListener(
            'click',
            evento => {

                if (evento.target === modalAlergia) {

                    fecharModalAlergia();

                }

            }
        );

    }

    document.addEventListener(
        'keydown',
        evento => {

            if (evento.key === 'Escape') {

                fecharModalAlergia();

            }

        }
    );

}


document.addEventListener(
    'DOMContentLoaded',
    async () => {

        if (!verificarAutenticacao()) {

            return;

        }

        const matricula = obterMatriculaUrl();

        if (matricula.length === 0) {

            alert(
                'A matrícula do funcionário não foi informada.'
            );

            window.location.href = '/consultar-paciente';
            return;

        }

        configurarEventos();
        atualizarIcones();

        await carregarDadosFuncionario(
            matricula
        );

        await carregarAlergias(
            matricula
        );

        await carregarHistoricoAtendimentos(
            matricula
        );

    }
);