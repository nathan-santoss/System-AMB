import express from 'express';
import { login, cadastrar } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);

// Rota de cadastro protegida. Só administradores logados podem usar
router.post('/cadastrar', verificarToken, cadastrar);

export default router;