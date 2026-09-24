import { apresentarUsuario } from '../utils/credenciais.js';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarios.js';
import { obterJwtSecret } from '../config/auth.js';
import Sessao from '../models/sessoes.js';
import { sessaoEstaValida } from '../services/sessaoService.js';

const EMISSOR_TOKEN = 'system-amb';
const PUBLICO_TOKEN = 'system-amb-web';

export function limparCookieSessao(res) {
    const ambienteEhProducao = process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
        httpOnly: true,
        secure: ambienteEhProducao,
        sameSite: 'strict',
        path: '/'
    });
}

export function extrairTokenDoCookie(cabecalhoCookie) {
    if (typeof cabecalhoCookie !== 'string') {
        return null;
    }

    const cookies = cabecalhoCookie.split(';');

    for (const cookie of cookies) {
        const partes = cookie.split('=');
        const nome = partes[0].trim();

        if (nome === 'token') {
            return partes.slice(1).join('=').trim() || null;
        }
    }

    return null;
}

function bloquearAcesso(res, mensagem, codigo = 'SESSAO_INVALIDA') {
    limparCookieSessao(res);

    if (res.locals.paginaProtegida) return res.redirect('/login');
    return res.status(401).json({
        erro: mensagem,
        codigo
    });
}

export async function verificarToken(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    try {
        const jwtSecret = obterJwtSecret();

        if (!jwtSecret) {
            return res.status(500).json({
                erro: 'O servidor não possui uma chave de segurança configurada.'
            });
        }

        const token = extrairTokenDoCookie(req.headers.cookie);

        if (!token) {
            return bloquearAcesso(res, 'Sessão não autenticada.');
        }

        const usuarioDecodificado = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
            issuer: EMISSOR_TOKEN,
            audience: PUBLICO_TOKEN
        });

        const idUsuario = Number(usuarioDecodificado.id_usuario);

        if (
            !Number.isSafeInteger(idUsuario) ||
            idUsuario < 1 ||
            typeof usuarioDecodificado.jti !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                usuarioDecodificado.jti
            )
        ) {
            return bloquearAcesso(res, 'Entre novamente para iniciar uma sessão segura.');
        }
        const sessao = await Sessao.findByPk(usuarioDecodificado.jti);
        if (!sessaoEstaValida(sessao) || sessao.usuario_id !== idUsuario) {
            return bloquearAcesso(
                res,
                'Sua sessão expirou. Faça login novamente.',
                'SESSAO_EXPIRADA'
            );
        }
        req.sessao = sessao;

        const usuario = await Usuario.findByPk(idUsuario, {
            attributes: ['id_usuario', 'email', 'perfil', 'ativo']
        });

        if (!usuario || !usuario.ativo) {
            return bloquearAcesso(res, 'O usuário da sessão não existe mais.');
        }

        req.usuario = apresentarUsuario(usuario);
        res.locals.usuario = req.usuario;

        return next();
    } catch (erro) {
        if (erro.name === 'TokenExpiredError') {
            return bloquearAcesso(res, 'Sessão expirada. Faça login novamente.');
        }

        if (erro.name === 'JsonWebTokenError') {
            return bloquearAcesso(res, 'Sessão inválida. Faça login novamente.');
        }

        if (erro.name === 'NotBeforeError') {
            return bloquearAcesso(res, 'A sessão ainda não é válida.');
        }

        console.error('Erro inesperado na autenticação:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao validar a autenticação.'
        });
    }
}

export function verificarPagina(req, res, next) {
    res.locals.paginaProtegida = true;
    return verificarToken(req, res, next);
}

export function exigirAdmin(req, res, next) {
    if (req.usuario?.perfil === 'admin' && req.usuario.ativo) return next();
    if (res.locals.paginaProtegida) return res.status(403).render('acesso-negado');
    return res.status(403).json({ erro: 'Acesso exclusivo do administrador.' });
}
