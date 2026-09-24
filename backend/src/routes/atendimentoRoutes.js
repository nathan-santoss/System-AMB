import express from 'express';

import {
    buscarAtendimentosPorFuncionario,
    registrarAtendimento,
    finalizarAtendimento,
    obterDadosDashboard
} from '../controllers/atendimentoController.js';

import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.patch('/:id/finalizar', verificarToken, finalizarAtendimento);

router.get('/dashboard-dados', verificarToken, obterDadosDashboard);

router.get('/:matricula', verificarToken, buscarAtendimentosPorFuncionario);

router.post('/', verificarToken, registrarAtendimento);

export default router;
