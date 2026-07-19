import express from 'express';
import {
    registrarAtendimento,
    buscarAtendimentosPorFuncionario,
    atualizarAtendimento,
    deletarAtendimento,
    obterDadosDashboard 
} from '../controllers/atendimentoController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verificarToken, registrarAtendimento);
router.get('/:matricula', verificarToken, buscarAtendimentosPorFuncionario);
router.put('/:id', verificarToken, atualizarAtendimento);
router.patch('/:id', verificarToken, atualizarAtendimento);
router.delete('/:id', verificarToken, deletarAtendimento);

router.get('/dashboard-dados', verificarToken, obterDadosDashboard);

export default router;