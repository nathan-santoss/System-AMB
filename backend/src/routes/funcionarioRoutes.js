import express from 'express';

import {
    cadastrarFuncionario,
    buscarFuncionarios,
    buscarFuncionarioPorMatricula,
    atualizarFuncionario,
    deletarFuncionario
} from '../controllers/funcionarioController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
    '/',
    verificarToken,
    cadastrarFuncionario
);

router.get(
    '/',
    verificarToken,
    buscarFuncionarios
);

router.get(
    '/:matricula',
    verificarToken,
    buscarFuncionarioPorMatricula
);

router.put(
    '/:matricula',
    verificarToken,
    atualizarFuncionario
);

router.patch(
    '/:matricula',
    verificarToken,
    atualizarFuncionario
);

router.delete(
    '/:matricula',
    verificarToken,
    deletarFuncionario
);

export default router;