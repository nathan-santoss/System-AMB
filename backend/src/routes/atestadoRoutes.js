import express from 'express';

import {
    emitirAtestado,
    buscarAtestadosPorFuncionario,
    atualizarAtestado,
    deletarAtestado
} from '../controllers/atestadoController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';


const router = express.Router();


// Emitir um novo atestado
// POST /api/atestados
router.post(
    '/',
    verificarToken,
    emitirAtestado
);


// Buscar atestados de um funcionário
// GET /api/atestados/funcionario/:matricula
router.get(
    '/funcionario/:matricula',
    verificarToken,
    buscarAtestadosPorFuncionario
);


// Atualizar completamente um atestado
// PUT /api/atestados/:id
router.put(
    '/:id',
    verificarToken,
    atualizarAtestado
);


// Atualizar parcialmente um atestado
// PATCH /api/atestados/:id
router.patch(
    '/:id',
    verificarToken,
    atualizarAtestado
);


// Excluir um atestado
// DELETE /api/atestados/:id
router.delete(
    '/:id',
    verificarToken,
    deletarAtestado
);


export default router;