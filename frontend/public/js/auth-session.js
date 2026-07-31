const AUTH_BASE_URL = '/api/auth';

let logoutEmAndamento = false;

async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

function obterMensagemResposta(
    dados,
    mensagemPadrao
) {
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

        if (
            Array.isArray(dados.detalhes) &&
            dados.detalhes.length > 0
        ) {
            return dados.detalhes.join(' ');
        }
    }

    return mensagemPadrao;
}

function prepararOpcoesFetch(opcoes) {
    const configuracao = {};

    if (
        opcoes &&
        typeof opcoes === 'object' &&
        !Array.isArray(opcoes)
    ) {
        Object.assign(
            configuracao,
            opcoes
        );
    }

    let cabecalhosRecebidos = {};

    if (configuracao.headers) {
        cabecalhosRecebidos =
            configuracao.headers;
    }

    configuracao.headers = new Headers(
        cabecalhosRecebidos
    );

    if (
        !configuracao.headers.has(
            'Accept'
        )
    ) {
        configuracao.headers.set(
            'Accept',
            'application/json'
        );
    }

    configuracao.credentials =
        'same-origin';

    return configuracao;
}

function respostaNaoAutorizada(
    resposta
) {
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

async function fetchAutenticado(
    url,
    opcoes
) {
    return fetch(
        url,
        prepararOpcoesFetch(opcoes)
    );
}

function redirecionarParaLogin() {
    if (
        window.location.pathname ===
        '/login'
    ) {
        return;
    }

    window.location.replace(
        '/login'
    );
}

function redirecionarParaDashboard() {
    if (
        window.location.pathname ===
        '/dashboard'
    ) {
        return;
    }

    window.location.replace(
        '/dashboard'
    );
}

async function verificarSessao() {
    try {
        const resposta =
            await fetchAutenticado(
                AUTH_BASE_URL +
                '/verificar',
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

        const dados =
            await lerRespostaJson(
                resposta
            );

        if (
            respostaNaoAutorizada(
                resposta
            )
        ) {
            return {
                autenticado: false,
                status: resposta.status,
                mensagem:
                    obterMensagemResposta(
                        dados,
                        'Sua sessão não está autenticada.'
                    )
            };
        }

        if (!resposta.ok) {
            return {
                autenticado: false,
                status: resposta.status,
                mensagem:
                    obterMensagemResposta(
                        dados,
                        'Não foi possível verificar a sessão.'
                    )
            };
        }

        if (
            dados.autenticado !== true
        ) {
            return {
                autenticado: false,
                status: resposta.status,
                mensagem:
                    'A sessão não está autenticada.'
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
            mensagem:
                'Não foi possível comunicar com o servidor.'
        };
    }
}

async function exigirSessao() {
    const resultado =
        await verificarSessao();

    if (!resultado.autenticado) {
        if (
            resultado.status === 401 ||
            resultado.status === 403
        ) {
            redirecionarParaLogin();
        }
    }

    return resultado;
}

async function verificarSessaoNaTelaLogin() {
    const resultado =
        await verificarSessao();

    if (resultado.autenticado) {
        redirecionarParaDashboard();
    }

    return resultado;
}

async function fazerLogout() {
    if (logoutEmAndamento) {
        return;
    }

    logoutEmAndamento = true;

    try {
        await fetchAutenticado(
            AUTH_BASE_URL +
            '/logout',
            {
                method: 'POST',
                cache: 'no-store'
            }
        );
    } catch (erro) {
        console.error(
            'Erro ao comunicar logout com o servidor:',
            erro
        );
    } finally {
        window.location.replace(
            '/login'
        );
    }
}

window.AuthSession = {
    fetchAutenticado,
    verificarSessao,
    exigirSessao,
    verificarSessaoNaTelaLogin,
    fazerLogout
};