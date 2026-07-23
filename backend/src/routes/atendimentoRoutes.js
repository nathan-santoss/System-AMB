import express from 'express';

import {
    buscarAlergias,
    cadastrarAlergia,
    atualizarAlergia,
    deletarAlergia
} from '../controllers/alergiaController.js';

import { verificarToken } from '../middlewares/authMiddleware.js';


const router = express.Router();


// GET /api/alergias?funcionario_matricula=123
router.get(
    '/',
    verificarToken,
    buscarAlergias
);


// GET /api/alergias/funcionario/123
router.get(
    '/funcionario/:matricula',
    verificarToken,
    buscarAlergias
);


// POST /api/alergias
router.post(
    '/',
    verificarToken,
    cadastrarAlergia
);


// PUT /api/alergias/:id
router.put(
    '/:id',
    verificarToken,
    atualizarAlergia
);


// PATCH /api/alergias/:id
router.patch(
    '/:id',
    verificarToken,
    atualizarAlergia
);


// DELETE /api/alergias/:id
router.delete(
    '/:id',
    verificarToken,
    deletarAlergia
);


export default router;