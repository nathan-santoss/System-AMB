import jwt from 'jsonwebtoken';


function extrairTokenAutorizacao(authorization) {

    if (typeof authorization !== 'string') {

        return null;

    }

    const authorizationNormalizado = authorization.trim();

    if (authorizationNormalizado.length === 0) {

        return null;

    }

    const partesAuthorization =
        authorizationNormalizado.split(/\s+/);

    if (partesAuthorization.length === 1) {

        return partesAuthorization[0].trim();

    }

    if (partesAuthorization.length !== 2) {

        return null;

    }

    const tipoAutorizacao = partesAuthorization[0];
    const token = partesAuthorization[1];

    if (tipoAutorizacao.toLowerCase() !== 'bearer') {

        return null;

    }

    if (token.trim().length === 0) {

        return null;

    }

    return token.trim();

}


function extrairCookies(cabecalhoCookie) {

    const cookies = {};

    if (typeof cabecalhoCookie !== 'string') {

        return cookies;

    }

    const cabecalhoNormalizado = cabecalhoCookie.trim();

    if (cabecalhoNormalizado.length === 0) {

        return cookies;

    }

    const partesCookies = cabecalhoNormalizado.split(';');

    partesCookies.forEach(parteCookie => {

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

    if (!req.headers) {

        return null;

    }

    const cookies = extrairCookies(
        req.headers.cookie
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


function obterTokenRequisicao(req) {

    const tokenAuthorization = extrairTokenAutorizacao(
        req.headers.authorization
    );

    if (tokenAuthorization) {

        return tokenAuthorization;

    }

    const tokenCookie = extrairTokenCookie(
        req
    );

    if (tokenCookie) {

        return tokenCookie;

    }

    return null;

}


function jwtEstaConfigurado() {

    if (typeof process.env.JWT_SECRET !== 'string') {

        return false;

    }

    if (process.env.JWT_SECRET.trim().length === 0) {

        return false;

    }

    return true;

}


function limparCookieToken(res) {

    res.clearCookie(
        'token',
        {
            httpOnly: true,
            sameSite: 'strict'
        }
    );

}


// Middleware responsável por validar a autenticação
export function verificarToken(req, res, next) {

    try {

        if (!jwtEstaConfigurado()) {

            console.error(
                'JWT_SECRET não está configurado no servidor.'
            );

            return res.status(500).json({
                message: 'O servidor de autenticação não está configurado corretamente.'
            });

        }

        const token = obterTokenRequisicao(
            req
        );

        if (!token) {

            return res.status(401).json({
                message: 'Token de autenticação não informado.'
            });

        }

        const usuarioDecodificado = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            !usuarioDecodificado ||
            typeof usuarioDecodificado !== 'object'
        ) {

            limparCookieToken(
                res
            );

            return res.status(401).json({
                message: 'Token de autenticação inválido.'
            });

        }

        if (!usuarioDecodificado.id_usuario) {

            limparCookieToken(
                res
            );

            return res.status(401).json({
                message: 'O token não possui a identificação do usuário.'
            });

        }

        if (
            typeof usuarioDecodificado.email !== 'string' ||
            usuarioDecodificado.email.trim().length === 0
        ) {

            limparCookieToken(
                res
            );

            return res.status(401).json({
                message: 'O token não possui o e-mail do usuário.'
            });

        }

        req.usuario = {
            id_usuario: usuarioDecodificado.id_usuario,
            email: usuarioDecodificado.email
        };

        req.tokenAutenticacao = token;

        return next();

    } catch (erro) {

        limparCookieToken(
            res
        );

        if (erro.name === 'TokenExpiredError') {

            return res.status(401).json({
                message: 'Token expirado. Faça login novamente.'
            });

        }

        if (erro.name === 'JsonWebTokenError') {

            return res.status(401).json({
                message: 'Token de autenticação inválido.'
            });

        }

        if (erro.name === 'NotBeforeError') {

            return res.status(401).json({
                message: 'O token ainda não está válido.'
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