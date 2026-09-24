import express from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { login } from '../controllers/authController.js';
import {
    verificarToken,
    extrairTokenDoCookie,
    limparCookieSessao
} from '../middlewares/authMiddleware.js';
import { obterJwtSecret } from '../config/auth.js';
import { apresentarSessao, registrarAtividade, revogarSessao } from '../services/sessaoService.js';

const router = express.Router();
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' }
});

router.post('/login', limitarLogin, login);
router.get('/verificar', verificarToken, (req, res) => {
    res.json({ autenticado: true, usuario: req.usuario, sessao: apresentarSessao(req.sessao) });
});
router.post('/atividade', verificarToken, async (req, res, next) => {
    try {
        const inativoHa = req.body?.inativoHa ?? 0;
        if (!Number.isSafeInteger(inativoHa) || inativoHa < 0 || inativoHa > 60000) {
            return res.status(400).json({ erro: 'Horário de atividade inválido.' });
        }
        const sessao = await registrarAtividade(req.sessao.id, inativoHa);
        if (!sessao) {
            limparCookieSessao(res);
            return res.status(401).json({ codigo: 'SESSAO_EXPIRADA', erro: 'Sessão expirada.' });
        }
        return res.json({ sessao: apresentarSessao(sessao) });
    } catch (erro) {
        next(erro);
    }
});
router.post('/logout', async (req, res, next) => {
    try {
        const token = extrairTokenDoCookie(req.headers.cookie);
        let dados;
        if (token) {
            try {
                dados = jwt.verify(token, obterJwtSecret(), {
                    algorithms: ['HS256'],
                    issuer: 'system-amb',
                    audience: 'system-amb-web',
                    ignoreExpiration: true
                });
            } catch {
                dados = null;
            }
        }
        if (dados) await revogarSessao(dados.jti);
        limparCookieSessao(res);
        res.json({ message: 'Sessão encerrada.' });
    } catch (erro) {
        next(erro);
    }
});
export default router;
