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


function extrairCookies(cabecalhoCookie) {
    const cookies = {};

    if (typeof cabecalhoCookie !== 'string') {
        return cookies;
    }

    cabecalhoCookie.split(';').forEach(parteCookie => {
        const indiceSeparador = parteCookie.indexOf('=');

        if (indiceSeparador === -1) {
            return;
        }

        const nome = parteCookie
            .slice(0, indiceSeparador)
            .trim();

        const valor = parteCookie
            .slice(indiceSeparador + 1)
            .trim();

        if (nome.length === 0) {
            return;
        }

        try {
            cookies[nome] = decodeURIComponent(valor);
        } catch (erro) {
            cookies[nome] = valor;
        }
    });

    return cookies;
}


function extrairTokenCookie(req) {
    const cookies = extrairCookies(
        req.headers?.cookie
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


export async function verificarToken(req, res, next) {
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
            !usuarioDecodificado ||
            typeof usuarioDecodificado !== 'object'
        ) {
            limparCookieToken(res);

            return res.status(401).json({
                message: 'Sessão inválida.'
            });
        }

        if (!identificadorUsuarioEhValido(usuarioDecodificado.id_usuario)) {
            limparCookieToken(res);

            return res.status(401).json({
                message: 'A sessão não possui um usuário válido.'
            });
        }

        if (
            typeof usuarioDecodificado.email !== 'string' ||
            usuarioDecodificado.email.trim().length === 0
        ) {
            limparCookieToken(res);

            return res.status(401).json({
                message: 'A sessão não possui um e-mail válido.'
            });
        }

        const usuario = await Usuario.findByPk(
            Number(usuarioDecodificado.id_usuario),
            {
                attributes: [
                    'id_usuario',
                    'email'
                ]
            }
        );

        if (!usuario) {
            limparCookieToken(res);

            return res.status(401).json({
                message: 'O usuário da sessão não existe mais.'
            });
        }

        if (
            usuario.email.toLowerCase() !==
            usuarioDecodificado.email.trim().toLowerCase()
        ) {
            limparCookieToken(res);

            return res.status(401).json({
                message: 'Os dados da sessão não correspondem ao usuário atual.'
            });
        }

        req.usuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email
        };

        return next();
    } catch (erro) {
        if (
            erro.name === 'TokenExpiredError' ||
            erro.name === 'JsonWebTokenError' ||
            erro.name === 'NotBeforeError'
        ) {
            limparCookieToken(res);

            let mensagem = 'Sessão inválida. Faça login novamente.';

            if (erro.name === 'TokenExpiredError') {
                mensagem = 'Sessão expirada. Faça login novamente.';
            }

            if (erro.name === 'NotBeforeError') {
                mensagem = 'A sessão ainda não está válida.';
            }

            return res.status(401).json({
                message: mensagem
            });
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