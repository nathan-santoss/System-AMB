import express from 'express';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { obterRelatorio, obterOpcoes } from '../controllers/centralRelatoriosController.js';

const router = express.Router();
router.use(verificarToken);
router.get('/opcoes', obterOpcoes);
router.get('/', obterRelatorio);
router.get('/:formato', (req, res, next) => {
    if (!['excel', 'imprimir'].includes(req.params.formato)) return res.sendStatus(404);
    return obterRelatorio(req, res, next);
});
export default router;
