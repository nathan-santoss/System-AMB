import express from 'express';
import { rateLimit } from 'express-rate-limit';

import {
    login
} from '../controllers/authController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';

const router = express.Router();

// Contagem por IP e por processo. Implantações com réplicas precisam de armazenamento compartilhado.
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' }
});

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

function responderVerificacao(req, res) {
    return res.status(200).json({
        autenticado: true,
        usuario: {
            id_usuario: req.usuario.id_usuario,
            email: req.usuario.email
        }
    });
}

function realizarLogout(req, res) {
    res.clearCookie(
        'token',
        obterOpcoesLimpezaCookie()
    );

    return res.status(200).json({
        message: 'Logout realizado com sucesso.'
    });
}

router.post(
    '/login',
    limitarLogin,
    login
);

router.get(
    '/verificar',
    verificarToken,
    responderVerificacao
);

router.post(
    '/logout',
    realizarLogout
);

export default router;
