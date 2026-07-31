import express from 'express';

import {
    buscarAtendimentosPorFuncionario,
    registrarAtendimento,
    obterDadosDashboard
} from '../controllers/atendimentoController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
    '/dashboard-dados',
    verificarToken,
    obterDadosDashboard
);

router.get(
    '/:matricula',
    verificarToken,
    buscarAtendimentosPorFuncionario
);

router.post(
    '/',
    verificarToken,
    registrarAtendimento
);

export default router;