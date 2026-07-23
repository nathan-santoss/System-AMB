import express from 'express';

import {
    buscarAlergias,
    cadastrarAlergia,
    atualizarAlergia,
    deletarAlergia
} from '../controllers/alergiaController.js';

import {
    verificarToken
} from '../middlewares/authMiddleware.js';


const router = express.Router();


// Buscar alergias utilizando matrícula pela query:
// GET /api/alergias?funcionario_matricula=123
router.get(
    '/',
    verificarToken,
    buscarAlergias
);


// Buscar alergias utilizando matrícula pela URL:
// GET /api/alergias/funcionario/123
router.get(
    '/funcionario/:matricula',
    verificarToken,
    buscarAlergias
);


// Cadastrar uma nova alergia:
// POST /api/alergias
router.post(
    '/',
    verificarToken,
    cadastrarAlergia
);


// Atualizar completamente uma alergia:
// PUT /api/alergias/:id
router.put(
    '/:id',
    verificarToken,
    atualizarAlergia
);


// Atualizar parcialmente uma alergia:
// PATCH /api/alergias/:id
router.patch(
    '/:id',
    verificarToken,
    atualizarAlergia
);


// Excluir uma alergia:
// DELETE /api/alergias/:id
router.delete(
    '/:id',
    verificarToken,
    deletarAlergia
);


export default router;