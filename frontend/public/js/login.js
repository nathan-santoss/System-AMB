const LOGIN_BASE_URL = '/api/auth';

let loginEmAndamento = false;

function atualizarIcones() {
    if (!window.lucide) {
        return;
    }

    window.lucide.createIcons();
}

function authSessionEstaDisponivel() {
    if (!window.AuthSession) {
        return false;
    }

    if (
        typeof window.AuthSession
            .verificarSessaoNaTelaLogin !==
        'function'
    ) {
        return false;
    }

    return true;
}

function emailEhValido(email) {
    if (typeof email !== 'string') {
        return false;
    }

    const emailNormalizado =
        email.trim();

    if (emailNormalizado.length < 3) {
        return false;
    }

    if (emailNormalizado.length > 150) {
        return false;
    }

    const formatoEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(
        emailNormalizado
    );
}

function senhaEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length < 8) {
        return false;
    }

    if (senha.length > 255) {
        return false;
    }

    return true;
}

async function lerRespostaJson(
    resposta
) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

function obterMensagemErro(
    dados,
    mensagemPadrao
) {
    if (dados) {
        if (
            typeof dados.message ===
            'string'
        ) {
            const mensagem =
                dados.message.trim();

            if (mensagem.length > 0) {
                return mensagem;
            }
        }

        if (
            typeof dados.erro ===
            'string'
        ) {
            const mensagem =
                dados.erro.trim();

            if (mensagem.length > 0) {
                return mensagem;
            }
        }

        if (
            Array.isArray(
                dados.detalhes
            )
        ) {
            if (
                dados.detalhes.length >
                0
            ) {
                return dados.detalhes.join(
                    ' '
                );
            }
        }
    }

    return mensagemPadrao;
}

function obterMensagemExcecao(
    erro,
    mensagemPadrao
) {
    if (!erro) {
        return mensagemPadrao;
    }

    if (typeof erro !== 'object') {
        return mensagemPadrao;
    }

    if (
        typeof erro.message !==
        'string'
    ) {
        return mensagemPadrao;
    }

    const mensagem =
        erro.message.trim();

    if (mensagem.length === 0) {
        return mensagemPadrao;
    }

    return mensagem;
}

function obterElementoMensagem() {
    return document.getElementById(
        'mensagem-login'
    );
}

function esconderMensagemLogin() {
    const elemento =
        obterElementoMensagem();

    if (!elemento) {
        return;
    }

    elemento.classList.add(
        'hidden'
    );

    elemento.innerHTML = '';
}

function obterConfiguracaoMensagem(
    tipo
) {
    const configuracao = {
        classes:
            'bg-blue-50 border-blue-200 text-blue-800',

        icone:
            'info'
    };

    if (tipo === 'erro') {
        configuracao.classes =
            'bg-red-50 border-red-200 text-red-700';

        configuracao.icone =
            'circle-alert';

        return configuracao;
    }

    if (tipo === 'sucesso') {
        configuracao.classes =
            'bg-green-50 border-green-200 text-green-700';

        configuracao.icone =
            'circle-check-big';

        return configuracao;
    }

    if (tipo === 'aviso') {
        configuracao.classes =
            'bg-yellow-50 border-yellow-200 text-yellow-800';

        configuracao.icone =
            'triangle-alert';

        return configuracao;
    }

    return configuracao;
}

function mostrarMensagemLogin(
    mensagem,
    tipo
) {
    const elemento =
        obterElementoMensagem();

    if (!elemento) {
        window.alert(
            mensagem
        );

        return;
    }

    const configuracao =
        obterConfiguracaoMensagem(
            tipo
        );

    elemento.className =
        'mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-3';

    elemento.className +=
        ' ' +
        configuracao.classes;

    elemento.innerHTML = '';

    const icone =
        document.createElement(
            'i'
        );

    icone.setAttribute(
        'data-lucide',
        configuracao.icone
    );

    icone.className =
        'w-5 h-5 shrink-0 mt-0.5';

    const texto =
        document.createElement(
            'p'
        );

    texto.className =
        'font-medium leading-relaxed';

    texto.textContent =
        mensagem;

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
    const botao =
        document.getElementById(
            'botao-entrar'
        );

    if (botao) {
        return botao;
    }

    const formulario =
        document.getElementById(
            'loginForm'
        );

    if (!formulario) {
        return null;
    }

    return formulario.querySelector(
        'button[type="submit"]'
    );
}

function definirBotaoCarregando(
    carregando
) {
    const botao =
        obterBotaoEntrar();

    if (!botao) {
        return;
    }

    if (carregando) {
        if (
            !botao.dataset
                .conteudoOriginal
        ) {
            botao.dataset
                .conteudoOriginal =
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

    if (
        botao.dataset
            .conteudoOriginal
    ) {
        botao.innerHTML =
            botao.dataset
                .conteudoOriginal;
    }

    atualizarIcones();
}

function obterConfiguracaoSenha(
    senhaEstaVisivel
) {
    if (senhaEstaVisivel) {
        return {
            tipoCampo:
                'password',

            rotulo:
                'Mostrar senha',

            icone:
                'eye'
        };
    }

    return {
        tipoCampo:
            'text',

        rotulo:
            'Ocultar senha',

        icone:
            'eye-off'
    };
}

function alternarVisibilidadeSenha() {
    const campoSenha =
        document.getElementById(
            'senha'
        );

    const botao =
        document.getElementById(
            'botao-alternar-senha'
        );

    if (!campoSenha) {
        return;
    }

    if (!botao) {
        return;
    }

    const senhaEstaVisivel =
        campoSenha.type ===
        'text';

    const configuracao =
        obterConfiguracaoSenha(
            senhaEstaVisivel
        );

    campoSenha.type =
        configuracao.tipoCampo;

    botao.setAttribute(
        'aria-label',
        configuracao.rotulo
    );

    botao.setAttribute(
        'title',
        configuracao.rotulo
    );

    botao.innerHTML = `
        <i
            data-lucide="${configuracao.icone}"
            class="h-5 w-5">
        </i>
    `;

    atualizarIcones();
}

function obterDadosFormulario() {
    const campoEmail =
        document.getElementById(
            'email'
        );

    const campoSenha =
        document.getElementById(
            'senha'
        );

    if (!campoEmail) {
        return {
            erro:
                'Não foi possível localizar o campo de e-mail.'
        };
    }

    if (!campoSenha) {
        return {
            erro:
                'Não foi possível localizar o campo de senha.'
        };
    }

    const email =
        campoEmail.value
            .trim()
            .toLowerCase();

    const senha =
        campoSenha.value;

    if (!emailEhValido(email)) {
        return {
            erro:
                'Informe um endereço de e-mail válido.',

            campo:
                campoEmail
        };
    }

    if (!senhaEhValida(senha)) {
        return {
            erro:
                'A senha deve possuir entre 8 e 255 caracteres.',

            campo:
                campoSenha
        };
    }

    return {
        email,
        senha
    };
}

async function enviarLogin(
    email,
    senha
) {
    const resposta =
        await fetch(
            LOGIN_BASE_URL +
            '/login',
            {
                method: 'POST',

                headers: {
                    Accept:
                        'application/json',

                    'Content-Type':
                        'application/json'
                },

                credentials:
                    'same-origin',

                cache:
                    'no-store',

                body:
                    JSON.stringify({
                        email,
                        senha
                    })
            }
        );

    const dados =
        await lerRespostaJson(
            resposta
        );

    if (!resposta.ok) {
        throw new Error(
            obterMensagemErro(
                dados,
                'E-mail ou senha inválidos.'
            )
        );
    }

    if (!dados.usuario) {
        throw new Error(
            'O servidor não retornou os dados da sessão.'
        );
    }

    if (
        !dados.usuario
            .id_usuario
    ) {
        throw new Error(
            'O servidor não retornou o identificador do usuário.'
        );
    }

    return dados;
}

async function realizarLogin(
    evento
) {
    evento.preventDefault();

    if (loginEmAndamento) {
        return;
    }

    esconderMensagemLogin();

    const dadosFormulario =
        obterDadosFormulario();

    if (dadosFormulario.erro) {
        mostrarMensagemLogin(
            dadosFormulario.erro,
            'aviso'
        );

        if (dadosFormulario.campo) {
            dadosFormulario.campo.focus();
        }

        return;
    }

    loginEmAndamento = true;

    definirBotaoCarregando(
        true
    );

    try {
        await enviarLogin(
            dadosFormulario.email,
            dadosFormulario.senha
        );

        mostrarMensagemLogin(
            'Login realizado com sucesso. Redirecionando...',
            'sucesso'
        );

        window.setTimeout(
            function () {
                window.location.replace(
                    '/dashboard'
                );
            },
            400
        );
    } catch (erro) {
        console.error(
            'Erro ao realizar login:',
            erro
        );

        mostrarMensagemLogin(
            obterMensagemExcecao(
                erro,
                'Não foi possível realizar o login.'
            ),
            'erro'
        );

        loginEmAndamento = false;

        definirBotaoCarregando(
            false
        );
    }
}

function configurarEventos() {
    const formulario =
        document.getElementById(
            'loginForm'
        );

    const botaoAlternarSenha =
        document.getElementById(
            'botao-alternar-senha'
        );

    const campoEmail =
        document.getElementById(
            'email'
        );

    const campoSenha =
        document.getElementById(
            'senha'
        );

    if (formulario) {
        formulario.addEventListener(
            'submit',
            realizarLogin
        );
    }

    if (botaoAlternarSenha) {
        botaoAlternarSenha
            .addEventListener(
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
    if (
        !authSessionEstaDisponivel()
    ) {
        console.error(
            'O arquivo auth-session.js não foi carregado.'
        );

        mostrarMensagemLogin(
            'Não foi possível inicializar a verificação de sessão.',
            'erro'
        );

        return false;
    }

    mostrarMensagemLogin(
        'Verificando sessão...',
        'informacao'
    );

    const resultadoSessao =
        await window.AuthSession
            .verificarSessaoNaTelaLogin();

    if (
        resultadoSessao
            .autenticado
    ) {
        return true;
    }

    esconderMensagemLogin();

    if (
        resultadoSessao.status ===
        0
    ) {
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

    const campoEmail =
        document.getElementById(
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