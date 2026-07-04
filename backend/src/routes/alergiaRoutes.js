import express from 'express'

import {
    buscarAlergias,
    cadastrarAlergia,
    atualizarAlergia,
    deletarAlergia
} from '../controllers/alergiaController.js'
import { verificarToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/alergias', verificarToken, buscarAlergias);
router.post('/alergias', verificarToken, cadastrarAlergia)
router.put('/alergias/:id', verificarToken, atualizarAlergia)
router.patch('/alergias/:id', verificarToken, atualizarAlergia)

router.delete('/alergias/:id', verificarToken, deletarAlergia)

export default router