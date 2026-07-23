const LOGIN_BASE_URL = '/api/auth';


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
        typeof window.AuthSession.verificarSessaoNaTelaLogin !== 'function'
    ) {

        return false;

    }

    if (
        typeof window.AuthSession.salvarToken !== 'function'
    ) {

        return false;

    }

    return true;

}


function emailEhValido(email) {

    if (typeof email !== 'string') {

        return false;

    }

    const emailNormalizado = email.trim();

    if (emailNormalizado.length === 0) {

        return false;

    }

    if (emailNormalizado.length > 150) {

        return false;

    }

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(
        emailNormalizado
    );

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

        if (typeof dados.message === 'string') {

            const mensagem = dados.message.trim();

            if (mensagem.length > 0) {

                return mensagem;

            }

        }

        if (typeof dados.erro === 'string') {

            const mensagem = dados.erro.trim();

            if (mensagem.length > 0) {

                return mensagem;

            }

        }

        if (Array.isArray(dados.detalhes)) {

            if (dados.detalhes.length > 0) {

                return dados.detalhes.join(
                    ' '
                );

            }

        }

    }

    return mensagemPadrao;

}


function obterElementoMensagem() {

    return document.getElementById(
        'mensagem-login'
    );

}


function esconderMensagemLogin() {

    const elemento = obterElementoMensagem();

    if (!elemento) {

        return;

    }

    elemento.classList.add(
        'hidden'
    );

    elemento.innerHTML = '';

}


function mostrarMensagemLogin(mensagem, tipo) {

    const elemento = obterElementoMensagem();

    if (!elemento) {

        window.alert(
            mensagem
        );

        return;

    }

    elemento.className =
        'mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-3';

    let classesTipo =
        'bg-blue-50 border-blue-200 text-blue-800';

    let nomeIcone = 'info';

    if (tipo === 'erro') {

        classesTipo =
            'bg-red-50 border-red-200 text-red-700';

        nomeIcone = 'circle-alert';

    }

    if (tipo === 'sucesso') {

        classesTipo =
            'bg-green-50 border-green-200 text-green-700';

        nomeIcone = 'circle-check-big';

    }

    if (tipo === 'aviso') {

        classesTipo =
            'bg-yellow-50 border-yellow-200 text-yellow-800';

        nomeIcone = 'triangle-alert';

    }

    elemento.className +=
        ' ' +
        classesTipo;

    elemento.innerHTML = '';

    const icone = document.createElement(
        'i'
    );

    icone.setAttribute(
        'data-lucide',
        nomeIcone
    );

    icone.className =
        'w-5 h-5 shrink-0 mt-0.5';

    const texto = document.createElement(
        'p'
    );

    texto.className =
        'font-medium leading-relaxed';

    texto.textContent = mensagem;

    elemento.appendChild(
        icone
    );

    elemento.appendChild(
        texto
    );

    elemento.classList.remove(
        'hidden'
    );

    atualizarIcones();

}


function obterBotaoEntrar() {

    let botao = document.getElementById(
        'botao-entrar'
    );

    if (botao) {

        return botao;

    }

    const formulario = document.getElementById(
        'loginForm'
    );

    if (!formulario) {

        return null;

    }

    botao = formulario.querySelector(
        'button[type="submit"]'
    );

    return botao;

}


function definirBotaoCarregando(carregando) {

    const botao = obterBotaoEntrar();

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

        botao.innerHTML = `
            <i
                data-lucide="loader-circle"
                class="w-5 h-5 animate-spin">
            </i>

            <span>
                Entrando...
            </span>
        `;

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

    } else {

        botao.innerHTML = `
            <span>
                Entrar no sistema
            </span>

            <i
                data-lucide="log-in"
                class="w-5 h-5">
            </i>
        `;

    }

    atualizarIcones();

}


function alternarVisibilidadeSenha() {

    const campoSenha = document.getElementById(
        'senha'
    );

    const botao = document.getElementById(
        'botao-alternar-senha'
    );

    if (
        !campoSenha ||
        !botao
    ) {

        return;

    }

    if (campoSenha.type === 'password') {

        campoSenha.type = 'text';

        botao.setAttribute(
            'aria-label',
            'Ocultar senha'
        );

        botao.setAttribute(
            'title',
            'Ocultar senha'
        );

        botao.innerHTML = `
            <i
                data-lucide="eye-off"
                class="h-5 w-5">
            </i>
        `;

        atualizarIcones();

        return;

    }

    campoSenha.type = 'password';

    botao.setAttribute(
        'aria-label',
        'Mostrar senha'
    );

    botao.setAttribute(
        'title',
        'Mostrar senha'
    );

    botao.innerHTML = `
        <i
            data-lucide="eye"
            class="h-5 w-5">
        </i>
    `;

    atualizarIcones();

}


function salvarTokenRecebido(token) {

    if (typeof token !== 'string') {

        return false;

    }

    const tokenNormalizado = token.trim();

    if (tokenNormalizado.length === 0) {

        return false;

    }

    if (authSessionEstaDisponivel()) {

        return window.AuthSession.salvarToken(
            tokenNormalizado
        );

    }

    localStorage.setItem(
        'token',
        tokenNormalizado
    );

    return true;

}


async function realizarLogin(evento) {

    evento.preventDefault();

    esconderMensagemLogin();

    const campoEmail = document.getElementById(
        'email'
    );

    const campoSenha = document.getElementById(
        'senha'
    );

    if (
        !campoEmail ||
        !campoSenha
    ) {

        mostrarMensagemLogin(
            'Não foi possível localizar os campos de acesso.',
            'erro'
        );

        return;

    }

    const email = campoEmail.value
        .trim()
        .toLowerCase();

    const senha = campoSenha.value;

    if (!emailEhValido(email)) {

        mostrarMensagemLogin(
            'Informe um endereço de e-mail válido.',
            'aviso'
        );

        campoEmail.focus();

        return;

    }

    if (
        typeof senha !== 'string' ||
        senha.length === 0
    ) {

        mostrarMensagemLogin(
            'Informe a senha.',
            'aviso'
        );

        campoSenha.focus();

        return;

    }

    if (senha.length < 8) {

        mostrarMensagemLogin(
            'A senha deve possuir pelo menos 8 caracteres.',
            'aviso'
        );

        campoSenha.focus();

        return;

    }

    definirBotaoCarregando(
        true
    );

    try {

        const resposta = await fetch(
            LOGIN_BASE_URL + '/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                credentials: 'same-origin',

                body: JSON.stringify({
                    email,
                    senha
                })
            }
        );

        const dados = await lerRespostaJson(
            resposta
        );

        if (!resposta.ok) {

            const mensagem = obterMensagemErro(
                dados,
                'E-mail ou senha inválidos.'
            );

            throw new Error(
                mensagem
            );

        }

        if (
            !dados ||
            typeof dados.token !== 'string' ||
            dados.token.trim().length === 0
        ) {

            throw new Error(
                'O servidor não forneceu um token de autenticação válido.'
            );

        }

        const tokenFoiSalvo = salvarTokenRecebido(
            dados.token
        );

        if (!tokenFoiSalvo) {

            throw new Error(
                'Não foi possível armazenar o token da sessão.'
            );

        }

        mostrarMensagemLogin(
            'Login realizado com sucesso. Redirecionando...',
            'sucesso'
        );

        window.setTimeout(
            function () {

                window.location.href =
                    '/dashboard';

            },
            500
        );

    } catch (erro) {

        console.error(
            'Erro ao realizar login:',
            erro
        );

        mostrarMensagemLogin(
            erro.message,
            'erro'
        );

    } finally {

        definirBotaoCarregando(
            false
        );

    }

}


function configurarEventos() {

    const formulario = document.getElementById(
        'loginForm'
    );

    const botaoAlternarSenha = document.getElementById(
        'botao-alternar-senha'
    );

    const campoEmail = document.getElementById(
        'email'
    );

    const campoSenha = document.getElementById(
        'senha'
    );

    if (formulario) {

        formulario.addEventListener(
            'submit',
            realizarLogin
        );

    }

    if (botaoAlternarSenha) {

        botaoAlternarSenha.addEventListener(
            'click',
            alternarVisibilidadeSenha
        );

    }

    if (campoEmail) {

        campoEmail.addEventListener(
            'input',
            esconderMensagemLogin
        );

    }

    if (campoSenha) {

        campoSenha.addEventListener(
            'input',
            esconderMensagemLogin
        );

    }

}


async function verificarSessaoExistente() {

    if (!authSessionEstaDisponivel()) {

        console.error(
            'O arquivo auth-session.js não foi carregado.'
        );

        return false;

    }

    mostrarMensagemLogin(
        'Verificando sessão...',
        'informacao'
    );

    const resultadoSessao =
        await window.AuthSession.verificarSessaoNaTelaLogin();

    if (resultadoSessao.autenticado) {

        return true;

    }

    esconderMensagemLogin();

    if (resultadoSessao.status === 0) {

        mostrarMensagemLogin(
            resultadoSessao.mensagem,
            'erro'
        );

    }

    return false;

}


async function inicializarLogin() {

    atualizarIcones();

    configurarEventos();

    definirBotaoCarregando(
        true
    );

    const sessaoExistente =
        await verificarSessaoExistente();

    if (sessaoExistente) {

        return;

    }

    definirBotaoCarregando(
        false
    );

    const campoEmail = document.getElementById(
        'email'
    );

    if (campoEmail) {

        campoEmail.focus();

    }

}


document.addEventListener(
    'DOMContentLoaded',
    inicializarLogin
);