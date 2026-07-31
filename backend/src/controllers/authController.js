import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Usuario from '../models/usuarios.js';

const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000;
const DURACAO_SESSAO_JWT = '12h';
const CUSTO_BCRYPT = 12;

const EMISSOR_TOKEN = 'system-amb';
const PUBLICO_TOKEN = 'system-amb-web';

function corpoEhObjetoValido(corpo) {
    if (!corpo) {
        return false;
    }

    if (typeof corpo !== 'object') {
        return false;
    }

    if (Array.isArray(corpo)) {
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

function emailEhValido(email) {
    if (typeof email !== 'string') {
        return false;
    }

    if (email.length < 3) {
        return false;
    }

    if (email.length > 150) {
        return false;
    }

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}

function senhaLoginEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length === 0) {
        return false;
    }

    if (senha.length > 255) {
        return false;
    }

    return true;
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

function ambienteEhProducao() {
    return process.env.NODE_ENV === 'production';
}

export function obterOpcoesCookieToken() {
    return {
        httpOnly: true,
        secure: ambienteEhProducao(),
        sameSite: 'strict',
        path: '/',
        maxAge: DURACAO_SESSAO_MS
    };
}

function criarToken(usuario, jwtSecret) {
    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            email: usuario.email
        },
        jwtSecret,
        {
            algorithm: 'HS256',
            expiresIn: DURACAO_SESSAO_JWT,
            issuer: EMISSOR_TOKEN,
            audience: PUBLICO_TOKEN,
            subject: String(usuario.id_usuario)
        }
    );
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

async function atualizarHashSenhaSeNecessario(
    usuario,
    senha
) {
    try {
        const custoAtual = bcrypt.getRounds(
            usuario.senha
        );

        if (custoAtual >= CUSTO_BCRYPT) {
            return;
        }

        const novoHash = await bcrypt.hash(
            senha,
            CUSTO_BCRYPT
        );

        await usuario.update({
            senha: novoHash
        });
    } catch (erro) {
        console.error(
            'Não foi possível atualizar o hash da senha do usuário:',
            erro.message
        );
    }
}

export async function login(req, res) {
    impedirCache(res);

    try {
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                message: 'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        const email = normalizarEmail(
            req.body.email
        );

        const senha = req.body.senha;

        if (!emailEhValido(email)) {
            return res.status(400).json({
                message: 'Informe um e-mail válido.'
            });
        }

        if (!senhaLoginEhValida(senha)) {
            return res.status(400).json({
                message: 'A senha é obrigatória e deve possuir no máximo 255 caracteres.'
            });
        }

        const jwtSecret = obterJwtSecret();

        if (!jwtSecret) {
            console.error(
                'JWT_SECRET não está configurado ou possui menos de 32 caracteres.'
            );

            return res.status(500).json({
                message: 'O servidor de autenticação não está configurado corretamente.'
            });
        }

        const usuario = await Usuario.unscoped().findOne({
            where: {
                email
            },
            attributes: [
                'id_usuario',
                'email',
                'senha'
            ]
        });

        if (!usuario) {
            return res.status(401).json({
                message: 'E-mail ou senha inválidos.'
            });
        }

        if (typeof usuario.senha !== 'string') {
            return res.status(401).json({
                message: 'E-mail ou senha inválidos.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                message: 'E-mail ou senha inválidos.'
            });
        }

        await atualizarHashSenhaSeNecessario(
            usuario,
            senha
        );

        const token = criarToken(
            usuario,
            jwtSecret
        );

        res.cookie(
            'token',
            token,
            obterOpcoesCookieToken()
        );

        return res.status(200).json({
            message: 'Login realizado com sucesso.',
            usuario: {
                id_usuario: usuario.id_usuario,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error(
            'Erro ao realizar login:',
            erro
        );

        return res.status(500).json({
            message: 'Erro interno ao processar o login.'
        });
    }
}