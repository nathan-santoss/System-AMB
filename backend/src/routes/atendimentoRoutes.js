import express from 'express';

import {
    buscarAtendimentosPorFuncionario,
    registrarAtendimento,
    atualizarAtendimento,
    deletarAtendimento,
    obterDadosDashboard
} from '../controllers/atendimentoController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';


const router = express.Router();


// Dados utilizados pelo dashboard
// GET /api/atendimentos/dashboard-dados
//
// Esta rota precisa permanecer antes de "/:matricula",
// pois "dashboard-dados" poderia ser interpretado como uma matrícula.
router.get(
    '/dashboard-dados',
    verificarToken,
    obterDadosDashboard
);


// Buscar todos os atendimentos de um funcionário
// GET /api/atendimentos/:matricula
router.get(
    '/:matricula',
    verificarToken,
    buscarAtendimentosPorFuncionario
);


// Registrar um novo atendimento
// POST /api/atendimentos
router.post(
    '/',
    verificarToken,
    registrarAtendimento
);


// Atualizar completamente ou parcialmente um atendimento
// PUT /api/atendimentos/:id
router.put(
    '/:id',
    verificarToken,
    atualizarAtendimento
);


// Atualizar parcialmente um atendimento
// PATCH /api/atendimentos/:id
router.patch(
    '/:id',
    verificarToken,
    atualizarAtendimento
);


// Excluir um atendimento
// DELETE /api/atendimentos/:id
router.delete(
    '/:id',
    verificarToken,
    deletarAtendimento
);


export default router;