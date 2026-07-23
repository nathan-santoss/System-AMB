import express from 'express';

import {
    cadastrarFuncionario,
    buscarFuncionarios,
    atualizarFuncionario,
    deletarFuncionario,
    buscarFuncionarioPorMatricula
} from '../controllers/funcionarioController.js';

import { verificarToken } from '../middlewares/authMiddleware.js';


const router = express.Router();


// Cadastrar funcionário
// POST /api/funcionarios
router.post(
    '/',
    verificarToken,
    cadastrarFuncionario
);


// Buscar todos os funcionários
// GET /api/funcionarios
router.get(
    '/',
    verificarToken,
    buscarFuncionarios
);


// Buscar funcionário pela matrícula
// GET /api/funcionarios/:matricula
router.get(
    '/:matricula',
    verificarToken,
    buscarFuncionarioPorMatricula
);


// Atualizar todos ou vários campos do funcionário
// PUT /api/funcionarios/:matricula
router.put(
    '/:matricula',
    verificarToken,
    atualizarFuncionario
);


// Atualizar parcialmente o funcionário
// PATCH /api/funcionarios/:matricula
router.patch(
    '/:matricula',
    verificarToken,
    atualizarFuncionario
);


// Deletar funcionário
// DELETE /api/funcionarios/:matricula
router.delete(
    '/:matricula',
    verificarToken,
    deletarFuncionario
);


export default router;