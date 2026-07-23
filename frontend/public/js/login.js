const BASE_URL = '/api';


function obterToken() {

    return localStorage.getItem(
        'token'
    );

}


function removerToken() {

    localStorage.removeItem(
        'token'
    );

}


function atualizarIcones() {

    if (window.lucide) {

        window.lucide.createIcons();

    }

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


function mostrarMensagemLogin(mensagem, tipo) {

    const elemento = document.getElementById(
        'mensagem-login'
    );

    if (!elemento) {

        return;

    }

    elemento.className =
        'mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-3';

    let classesTipo =
        'bg-blue-50 border-blue-200 text-blue-800';

    let icone = 'info';

    if (tipo === 'erro') {

        classesTipo =
            'bg-red-50 border-red-200 text-red-700';

        icone = 'circle-alert';

    }

    if (tipo === 'sucesso') {

        classesTipo =
            'bg-green-50 border-green-200 text-green-700';

        icone = 'circle-check-big';

    }

    if (tipo === 'aviso') {

        classesTipo =
            'bg-yellow-50 border-yellow-200 text-yellow-800';

        icone = 'triangle-alert';

    }

    elemento.className +=
        ' ' +
        classesTipo;

    elemento.innerHTML = '';

    const elementoIcone = document.createElement(
        'i'
    );

    elementoIcone.setAttribute(
        'data-lucide',
        icone
    );

    elementoIcone.className =
        'w-5 h-5 shrink-0 mt-0.5';

    const elementoTexto = document.createElement(
        'p'
    );

    elementoTexto.className =
        'font-medium leading-relaxed';

    elementoTexto.textContent = mensagem;

    elemento.appendChild(
        elementoIcone
    );

    elemento.appendChild(
        elementoTexto
    );

    elemento.classList.remove(
        'hidden'
    );

    atualizarIcones();

}


function esconderMensagemLogin() {

    const elemento = document.getElementById(
        'mensagem-login'
    );

    if (!elemento) {

        return;

    }

    elemento.classList.add(
        'hidden'
    );

    elemento.innerHTML = '';

}


function definirBotaoCarregando(carregando) {

    const botao = document.getElementById(
        'botao-entrar'
    );

    if (!botao) {

        return;

    }

    if (carregando) {

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

    botao.innerHTML = `
        <span>
            Entrar no sistema
        </span>

        <i
            data-lucide="log-in"
            class="w-5 h-5">
        </i>
    `;

    atualizarIcones();

}


function alternarVisibilidadeSenha() {

    const campoSenha = document.getElementById(
        'senha'
    );

    const botao = document.getElementById(
        'botao-alternar-senha'
    );

    if (!campoSenha || !botao) {

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


async function realizarLogin(evento) {

    evento.preventDefault();

    esconderMensagemLogin();

    const campoEmail = document.getElementById(
        'email'
    );

    const campoSenha = document.getElementById(
        'senha'
    );

    if (!campoEmail || !campoSenha) {

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

    if (typeof senha !== 'string') {

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
            BASE_URL + '/auth/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

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

            removerToken();

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

            removerToken();

            throw new Error(
                'O servidor não forneceu um token de autenticação válido.'
            );

        }

        localStorage.setItem(
            'token',
            dados.token
        );

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


document.addEventListener(
    'DOMContentLoaded',
    function () {

        removerToken();

        configurarEventos();

        atualizarIcones();

        const campoEmail = document.getElementById(
            'email'
        );

        if (campoEmail) {

            campoEmail.focus();

        }

    }
);