import jwt from 'jsonwebtoken';


function extrairTokenAutorizacao(authorization) {

    if (typeof authorization !== 'string') {

        return null;

    }

    const authorizationNormalizado = authorization.trim();

    if (authorizationNormalizado.length === 0) {

        return null;

    }

    const partesAuthorization = authorizationNormalizado.split(/\s+/);

    if (partesAuthorization.length === 1) {

        return partesAuthorization[0];

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


function jwtEstaConfigurado() {

    if (typeof process.env.JWT_SECRET !== 'string') {

        return false;

    }

    if (process.env.JWT_SECRET.trim().length === 0) {

        return false;

    }

    return true;

}


// Middleware responsável por validar a autenticação das rotas protegidas
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

        const token = extrairTokenAutorizacao(
            req.headers.authorization
        );

        if (!token) {

            return res.status(401).json({
                message: 'Token de autenticação não informado ou malformado.'
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

            return res.status(401).json({
                message: 'Token de autenticação inválido.'
            });

        }

        if (!usuarioDecodificado.id_usuario) {

            return res.status(401).json({
                message: 'O token não possui a identificação do usuário.'
            });

        }

        if (!usuarioDecodificado.email) {

            return res.status(401).json({
                message: 'O token não possui o email do usuário.'
            });

        }

        req.usuario = {
            id_usuario: usuarioDecodificado.id_usuario,
            email: usuarioDecodificado.email
        };

        return next();

    } catch (erro) {

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