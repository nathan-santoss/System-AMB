import express from 'express';

import {
    login,
    cadastrar
} from '../controllers/authController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';


const router = express.Router();


// Realizar login
// POST /api/auth/login
router.post(
    '/login',
    login
);


// Verificar se a sessão atual continua válida
// GET /api/auth/verificar
router.get(
    '/verificar',
    verificarToken,
    function (req, res) {

        return res.status(200).json({
            autenticado: true,
            usuario: {
                id_usuario: req.usuario.id_usuario,
                email: req.usuario.email
            }
        });

    }
);


// Cadastrar novo usuário
// POST /api/auth/cadastrar
router.post(
    '/cadastrar',
    verificarToken,
    cadastrar
);


// Encerrar a sessão e remover o cookie
// POST /api/auth/logout
router.post(
    '/logout',
    function (req, res) {

        let ambienteProducao = false;

        if (process.env.NODE_ENV === 'production') {

            ambienteProducao = true;

        }

        res.clearCookie(
            'token',
            {
                httpOnly: true,
                secure: ambienteProducao,
                sameSite: 'strict',
                path: '/'
            }
        );

        return res.status(200).json({
            message: 'Logout realizado com sucesso.'
        });

    }
);


export default router;