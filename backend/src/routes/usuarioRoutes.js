import express from 'express';
import { verificarToken, exigirAdmin } from '../middlewares/authMiddleware.js';
import {
    listarUsuarios,
    criarUsuario,
    atualizarUsuario
} from '../controllers/usuarioController.js';

const router = express.Router();
router.use(verificarToken, exigirAdmin);
router.get('/', listarUsuarios);
router.post('/', criarUsuario);
router.patch('/:id', atualizarUsuario);
export default router;
