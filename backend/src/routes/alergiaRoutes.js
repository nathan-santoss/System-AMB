import express from 'express';

import {
    cadastrarAlergia,
    buscarAlergiasFuncionario,
    deletarAlergia
} from '../controllers/alergiaController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
    '/',
    verificarToken,
    cadastrarAlergia
);

router.get(
    '/funcionario/:matricula',
    verificarToken,
    buscarAlergiasFuncionario
);

router.delete(
    '/:id',
    verificarToken,
    deletarAlergia
);

export default router;