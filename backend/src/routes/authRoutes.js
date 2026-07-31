import express from 'express';

import {
    login
} from '../controllers/authController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';

const router = express.Router();

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