import jwt from 'jsonwebtoken';

import Usuario from '../models/usuarios.js';

const EMISSOR_TOKEN = 'system-amb';
const PUBLICO_TOKEN = 'system-amb-web';

function ambienteEhProducao() {
    return process.env.NODE_ENV === 'production';
}

function obterOpcoesLimpezaCookie() {
    return {
        httpOnly: true,
        secure: ambienteEhProducao(),
        sameSite: 'strict',
        path: '/'
    };
}

function impedirCache(res) {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader(
        'Pragma',
        'no-cache'
    );
}

function extrairCookies(cabecalhoCookie) {
    const cookies = {};

    if (typeof cabecalhoCookie !== 'string') {
        return cookies;
    }

    const partesCookie = cabecalhoCookie.split(';');

    for (const parteCookie of partesCookie) {
        const indiceSeparador = parteCookie.indexOf('=');

        if (indiceSeparador === -1) {
            continue;
        }

        const nome = parteCookie
            .slice(0, indiceSeparador)
            .trim();

        const valor = parteCookie
            .slice(indiceSeparador + 1)
            .trim();

        if (nome.length === 0) {
            continue;
        }

        try {
            cookies[nome] = decodeURIComponent(valor);
        } catch (erro) {
            cookies[nome] = valor;
        }
    }

    return cookies;
}

function extrairTokenCookie(req) {
    let cabecalhoCookie;

    if (req.headers) {
        cabecalhoCookie = req.headers.cookie;
    }

    const cookies = extrairCookies(
        cabecalhoCookie
    );

    if (typeof cookies.token !== 'string') {
        return null;
    }

    const token = cookies.token.trim();

    if (token.length === 0) {
        return null;
    }

    return token;
}

function obterJwtSecret() {
    if (typeof process.env.JWT_SECRET !== 'string') {
        return null;
    }

    const jwtSecret = process.env.JWT_SECRET.trim();

    if (jwtSecret.length < 32) {
        return null;
    }

    return jwtSecret;
}

function limparCookieToken(res) {
    res.clearCookie(
        'token',
        obterOpcoesLimpezaCookie()
    );
}

function identificadorUsuarioEhValido(valor) {
    const idUsuario = Number(valor);

    if (!Number.isSafeInteger(idUsuario)) {
        return false;
    }

    if (idUsuario <= 0) {
        return false;
    }

    return true;
}

function normalizarEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }

    return email
        .trim()
        .toLowerCase();
}

function dadosTokenSaoValidos(usuarioDecodificado) {
    if (!usuarioDecodificado) {
        return false;
    }

    if (typeof usuarioDecodificado !== 'object') {
        return false;
    }

    if (
        !identificadorUsuarioEhValido(
            usuarioDecodificado.id_usuario
        )
    ) {
        return false;
    }

    if (
        !identificadorUsuarioEhValido(
            usuarioDecodificado.sub
        )
    ) {
        return false;
    }

    if (
        Number(usuarioDecodificado.id_usuario) !==
        Number(usuarioDecodificado.sub)
    ) {
        return false;
    }

    const email = normalizarEmail(
        usuarioDecodificado.email
    );

    if (email.length === 0) {
        return false;
    }

    return true;
}

function responderSessaoInvalida(
    res,
    mensagem
) {
    limparCookieToken(res);

    return res.status(401).json({
        message: mensagem
    });
}

function obterMensagemErroToken(erro) {
    if (erro.name === 'TokenExpiredError') {
        return 'Sessão expirada. Faça login novamente.';
    }

    if (erro.name === 'NotBeforeError') {
        return 'A sessão ainda não está válida.';
    }

    return 'Sessão inválida. Faça login novamente.';
}

function erroEhDeToken(erro) {
    if (erro.name === 'TokenExpiredError') {
        return true;
    }

    if (erro.name === 'JsonWebTokenError') {
        return true;
    }

    if (erro.name === 'NotBeforeError') {
        return true;
    }

    return false;
}

export async function verificarToken(
    req,
    res,
    next
) {
    impedirCache(res);

    try {
        const jwtSecret = obterJwtSecret();

        if (!jwtSecret) {
            console.error(
                'JWT_SECRET não está configurado ou possui menos de 32 caracteres.'
            );

            return res.status(500).json({
                message: 'O servidor de autenticação não está configurado corretamente.'
            });
        }

        const token = extrairTokenCookie(req);

        if (!token) {
            return res.status(401).json({
                message: 'Sessão não autenticada.'
            });
        }

        const usuarioDecodificado = jwt.verify(
            token,
            jwtSecret,
            {
                algorithms: [
                    'HS256'
                ],
                issuer: EMISSOR_TOKEN,
                audience: PUBLICO_TOKEN
            }
        );

        if (
            !dadosTokenSaoValidos(
                usuarioDecodificado
            )
        ) {
            return responderSessaoInvalida(
                res,
                'Sessão inválida.'
            );
        }

        const idUsuario = Number(
            usuarioDecodificado.id_usuario
        );

        const usuario = await Usuario.findByPk(
            idUsuario,
            {
                attributes: [
                    'id_usuario',
                    'email'
                ]
            }
        );

        if (!usuario) {
            return responderSessaoInvalida(
                res,
                'O usuário da sessão não existe mais.'
            );
        }

        const emailUsuario = normalizarEmail(
            usuario.email
        );

        const emailToken = normalizarEmail(
            usuarioDecodificado.email
        );

        if (emailUsuario !== emailToken) {
            return responderSessaoInvalida(
                res,
                'Os dados da sessão não correspondem ao usuário atual.'
            );
        }

        req.usuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email
        };

        return next();
    } catch (erro) {
        if (erroEhDeToken(erro)) {
            const mensagem = obterMensagemErroToken(
                erro
            );

            return responderSessaoInvalida(
                res,
                mensagem
            );
        }

        console.error(
            'Erro inesperado na autenticação:',
            erro
        );

        return res.status(500).json({
            message: 'Erro interno ao validar a autenticação.'
        });
    }
}