import { buscarProntuarioFuncionario } from '../services/prontuarioService.js';
import { montarRelatorioPop, formatarDataRelatorio } from '../services/relatorioPopService.js';
import { normalizarMatricula } from '../utils/normalizadores.js';
import { matriculaEhValida } from '../utils/validadores.js';
import { responderErroInterno } from '../utils/respostas.js';

export async function gerarRelatorioPop(req, res) {
    try {
        const matricula = normalizarMatricula(req.params.matricula);
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({ erro: 'A matrícula informada é inválida.' });
        }
        const prontuario = await buscarProntuarioFuncionario(matricula);
        if (!prontuario) {
            return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        }
        res.setHeader('Cache-Control', 'no-store, private');
        res.setHeader('Referrer-Policy', 'no-referrer');
        return res.render('relatorio-pop', {
            relatorio: montarRelatorioPop(prontuario),
            formatarData: formatarDataRelatorio
        });
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao gerar relatório POP:', erro);
    }
}
