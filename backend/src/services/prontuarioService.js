import Atendimento from '../models/atendimento.js';
import { buscarFuncionarioPorMatricula } from './funcionarioService.js';
import { buscarAlergiasPorFuncionario } from './alergiaService.js';

// A tela consulta uma página; exportações individuais podem solicitar o histórico completo.
export async function buscarProntuarioFuncionario(matricula, pagina) {
    const funcionario = await buscarFuncionarioPorMatricula(matricula);
    if (!funcionario) return null;

    const where = { funcionario_matricula: matricula };
    const consulta = {
        where,
        order: [
            ['data_hora_entrada', 'DESC'],
            ['id_atendimento', 'DESC']
        ]
    };
    if (pagina !== undefined) {
        consulta.limit = 25;
        consulta.offset = (pagina - 1) * 25;
    }
    const alergias = await buscarAlergiasPorFuncionario(matricula);
    const resultado = await Atendimento.findAndCountAll(consulta);
    const totalAtendimentosAbertos = await Atendimento.count({
        where: { ...where, data_hora_saida: null }
    });
    const ultimoAtendimento = await Atendimento.max('data_hora_entrada', { where });
    const atendimentos = resultado.rows.map((registro) => {
        const dados = registro.toJSON();
        let status = 'em_aberto';
        if (dados.data_hora_saida) status = 'finalizado';
        return { ...dados, status };
    });
    return {
        funcionario,
        resumo: {
            totalAlergias: alergias.length,
            totalAtendimentos: resultado.count,
            totalAtendimentosAbertos,
            ultimoAtendimento
        },
        alergias,
        atendimentos,
        pagina,
        totalPaginas: Math.max(1, Math.ceil(resultado.count / 25))
    };
}
