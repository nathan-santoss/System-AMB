const AUTH_BASE_URL = '/api/auth';


function obterTokenLocalStorage() {

    const token = localStorage.getItem(
        'token'
    );

    if (typeof token !== 'string') {

        return null;

    }

    const tokenNormalizado = token.trim();

    if (tokenNormalizado.length === 0) {

        return null;

    }

    return tokenNormalizado;

}


function removerTokenLocalStorage() {

    localStorage.removeItem(
        'token'
    );

}


function salvarTokenLocalStorage(token) {

    if (typeof token !== 'string') {

        return false;

    }

    const tokenNormalizado = token.trim();

    if (tokenNormalizado.length === 0) {

        return false;

    }

    localStorage.setItem(
        'token',
        tokenNormalizado
    );

    return true;

}


async function lerRespostaJson(resposta) {

    try {

        return await resposta.json();

    } catch (erro) {

        return {};

    }

}


function obterMensagemResposta(dados, mensagemPadrao) {

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


function criarHeadersAutenticacao(
    headersIniciais,
    usarTokenLocal
) {

    const headers = new Headers();

    if (headersIniciais) {

        const headersRecebidos = new Headers(
            headersIniciais
        );

        headersRecebidos.forEach(
            function (valor, nome) {

                headers.set(
                    nome,
                    valor
                );

            }
        );

    }

    if (usarTokenLocal) {

        const token = obterTokenLocalStorage();

        if (token) {

            headers.set(
                'Authorization',
                'Bearer ' + token
            );

        }

    } else {

        headers.delete(
            'Authorization'
        );

    }

    return headers;

}


function prepararOpcoesFetch(
    opcoes,
    usarTokenLocal
) {

    const configuracao = {};

    if (
        opcoes &&
        typeof opcoes === 'object'
    ) {

        Object.assign(
            configuracao,
            opcoes
        );

    }

    configuracao.headers = criarHeadersAutenticacao(
        configuracao.headers,
        usarTokenLocal
    );

    configuracao.credentials = 'same-origin';

    return configuracao;

}


function respostaNaoAutorizada(resposta) {

    if (!resposta) {

        return false;

    }

    if (resposta.status === 401) {

        return true;

    }

    if (resposta.status === 403) {

        return true;

    }

    return false;

}


async function fetchAutenticado(url, opcoes) {

    const tokenLocalAntesDaRequisicao =
        obterTokenLocalStorage();

    let configuracao = prepararOpcoesFetch(
        opcoes,
        true
    );

    let resposta = await fetch(
        url,
        configuracao
    );

    /*
     * Caso exista um token inválido no localStorage,
     * ele pode impedir que o servidor utilize o cookie.
     *
     * Nesse caso, removemos o token local e repetimos
     * a requisição utilizando somente o cookie.
     */
    if (
        respostaNaoAutorizada(resposta) &&
        tokenLocalAntesDaRequisicao
    ) {

        removerTokenLocalStorage();

        configuracao = prepararOpcoesFetch(
            opcoes,
            false
        );

        resposta = await fetch(
            url,
            configuracao
        );

    }

    return resposta;

}


function redirecionarParaLogin() {

    const caminhoAtual = window.location.pathname;

    if (caminhoAtual === '/login') {

        return;

    }

    window.location.href = '/login';

}


function redirecionarParaDashboard() {

    const caminhoAtual = window.location.pathname;

    if (caminhoAtual === '/dashboard') {

        return;

    }

    window.location.href = '/dashboard';

}


async function verificarSessao() {

    try {

        const resposta = await fetchAutenticado(
            AUTH_BASE_URL + '/verificar',
            {
                method: 'GET',
                cache: 'no-store'
            }
        );

        const dados = await lerRespostaJson(
            resposta
        );

        if (respostaNaoAutorizada(resposta)) {

            removerTokenLocalStorage();

            return {
                autenticado: false,
                status: resposta.status,
                mensagem: obterMensagemResposta(
                    dados,
                    'Sua sessão não está autenticada.'
                )
            };

        }

        if (!resposta.ok) {

            return {
                autenticado: false,
                status: resposta.status,
                mensagem: obterMensagemResposta(
                    dados,
                    'Não foi possível verificar a sessão.'
                )
            };

        }

        if (!dados.autenticado) {

            removerTokenLocalStorage();

            return {
                autenticado: false,
                status: resposta.status,
                mensagem: 'A sessão não está autenticada.'
            };

        }

        return {
            autenticado: true,
            status: resposta.status,
            usuario: dados.usuario
        };

    } catch (erro) {

        console.error(
            'Erro ao verificar sessão:',
            erro
        );

        return {
            autenticado: false,
            status: 0,
            mensagem: 'Não foi possível comunicar com o servidor.'
        };

    }

}


async function exigirSessao() {

    const resultado = await verificarSessao();

    if (!resultado.autenticado) {

        if (
            resultado.status === 401 ||
            resultado.status === 403
        ) {

            redirecionarParaLogin();

        }

        return resultado;

    }

    return resultado;

}


async function verificarSessaoNaTelaLogin() {

    const resultado = await verificarSessao();

    if (resultado.autenticado) {

        redirecionarParaDashboard();

    }

    return resultado;

}


async function fazerLogout() {

    try {

        await fetchAutenticado(
            AUTH_BASE_URL + '/logout',
            {
                method: 'POST'
            }
        );

    } catch (erro) {

        console.error(
            'Erro ao comunicar logout com o servidor:',
            erro
        );

    } finally {

        removerTokenLocalStorage();

        window.location.href = '/login';

    }

}


window.AuthSession = {
    obterToken: obterTokenLocalStorage,
    salvarToken: salvarTokenLocalStorage,
    removerToken: removerTokenLocalStorage,
    criarHeaders: criarHeadersAutenticacao,
    fetchAutenticado,
    verificarSessao,
    exigirSessao,
    verificarSessaoNaTelaLogin,
    fazerLogout
};


window.fazerLogout = fazerLogout;