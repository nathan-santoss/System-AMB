import { buscarFuncionarioPorMatricula } from '../services/funcionarioService.js';
import { buscarAlergiasPorFuncionario } from '../services/alergiaService.js';
import { matriculaEhValida } from '../utils/validadores.js';

export async function identificarFuncionario(req, res, next) {
    if (!matriculaEhValida(req.params.matricula))
        return res.status(400).json({ erro: 'Matrícula inválida.' });
    try {
        const funcionario = await buscarFuncionarioPorMatricula(req.params.matricula);
        if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        res.json({
            funcionario,
            alergias: await buscarAlergiasPorFuncionario(funcionario.matricula)
        });
    } catch (erro) {
        next(erro);
    }
}
