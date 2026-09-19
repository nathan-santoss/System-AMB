import express from 'express';
import { gerarRelatorioPop } from '../controllers/relatorioPopController.js';
import { exportarExcelFuncionario, imprimirFichaAtendimento } from '../controllers/relatorioController.js';

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

router.get('/:matricula/relatorio-pop', verificarToken, gerarRelatorioPop);
router.get('/:matricula/relatorio-excel', verificarToken, exportarExcelFuncionario);
router.get('/:matricula/atendimentos/:id/ficha', verificarToken, imprimirFichaAtendimento);

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
