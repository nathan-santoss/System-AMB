import Atendimento from '../models/atendimento.js';
import { buscarFuncionarioPorMatricula } from '../services/funcionarioService.js';
import { buscarProntuarioFuncionario } from '../services/prontuarioService.js';
import {
    montarRelatorioPop,
    obterLiderancas,
    formatarDataRelatorio
} from '../services/relatorioPopService.js';
import { criarPlanilhaFuncionario } from '../services/relatorioExcelService.js';
import { normalizarMatricula } from '../utils/normalizadores.js';
import { matriculaEhValida } from '../utils/validadores.js';
import { responderErroInterno } from '../utils/respostas.js';

export async function exportarExcelFuncionario(req, res) {
    try {
        const matricula = normalizarMatricula(req.params.matricula);
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({ erro: 'A matrícula informada é inválida.' });
        }
        const prontuario = await buscarProntuarioFuncionario(matricula);
        if (!prontuario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        const workbook = criarPlanilhaFuncionario(montarRelatorioPop(prontuario));
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Cache-Control', 'no-store, private');
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-funcionario.xlsx"');
        return res.send(Buffer.from(buffer));
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao exportar Excel:', erro);
    }
}

export async function imprimirFichaAtendimento(req, res) {
    try {
        const matricula = normalizarMatricula(req.params.matricula);
        const id = Number(req.params.id);
        if (
            !matriculaEhValida(matricula) ||
            !/^\d+$/.test(req.params.id) ||
            !Number.isSafeInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({ erro: 'Funcionário ou atendimento inválido.' });
        }
        const funcionario = await buscarFuncionarioPorMatricula(matricula);
        if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        const registro = await Atendimento.findOne({
            where: { id_atendimento: id, funcionario_matricula: matricula }
        });
        if (!registro)
            return res
                .status(404)
                .json({ erro: 'Atendimento não encontrado para este funcionário.' });
        const atendimento = registro.toJSON();
        atendimento.liderancas = obterLiderancas(atendimento, '_na_epoca');
        res.setHeader('Cache-Control', 'no-store, private');
        res.setHeader('Referrer-Policy', 'no-referrer');
        return res.render('ficha-atendimento-impressao', {
            funcionario,
            atendimento,
            emitidoEm: new Date(),
            formatarData: formatarDataRelatorio
        });
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao gerar ficha de atendimento:', erro);
    }
}
