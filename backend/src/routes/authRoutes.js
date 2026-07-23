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


// Cadastrar novo usuário
// POST /api/auth/cadastrar
router.post(
    '/cadastrar',
    verificarToken,
    cadastrar
);


export default router;