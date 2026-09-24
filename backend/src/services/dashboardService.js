import { Op, fn, col } from 'sequelize';
import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';
import { prepararFiltros } from '../utils/filtrosRelatorio.js';

export async function consultarDashboard() {
    const mes = prepararFiltros({});
    const dia = prepararFiltros({ inicio: mes.fim, fim: mes.fim });
    const hoje = { data_hora_entrada: { [Op.gte]: dia.inicioUtc, [Op.lt]: dia.fimUtc } };

    // Cada consulta retorna somente o resumo ou as linhas exibidas na página.
    const [gravidades, ultimos, setores] = await Promise.all([
        Atendimento.findAll({
            attributes: ['gravidade', [fn('COUNT', col('id_atendimento')), 'total']],
            where: hoje,
            group: ['gravidade'],
            raw: true
        }),
        Atendimento.findAll({
            include: [{ model: Funcionario, as: 'funcionario', attributes: ['nome'] }],
            order: [
                ['data_hora_entrada', 'DESC'],
                ['id_atendimento', 'DESC']
            ],
            limit: 5
        }),
        Atendimento.findAll({
            attributes: [
                [col('funcionario.setor'), 'setor'],
                [fn('COUNT', col('Atendimento.id_atendimento')), 'quantidade']
            ],
            include: [{ model: Funcionario, as: 'funcionario', attributes: [] }],
            where: { data_hora_entrada: { [Op.gte]: mes.inicioUtc, [Op.lt]: mes.fimUtc } },
            group: [col('funcionario.setor')],
            order: [[fn('COUNT', col('Atendimento.id_atendimento')), 'DESC']],
            raw: true
        })
    ]);

    const totais = { baixa: 0, media: 0, alta: 0 };
    const chaves = { Baixa: 'baixa', Média: 'media', Alta: 'alta' };
    let totalHoje = 0;
    for (const item of gravidades) {
        totalHoje += Number(item.total);
        if (chaves[item.gravidade]) totais[chaves[item.gravidade]] = Number(item.total);
    }
    return {
        totalHoje,
        gravidadeHoje: totais,
        ultimosAtendimentos: ultimos.map((registro) => {
            const dados = registro.toJSON();
            dados.nome = dados.funcionario.nome;
            delete dados.funcionario;
            return dados;
        }),
        atendimentosPorSetor: setores.map((item) => ({
            setor: item.setor || 'Não informado',
            quantidade: Number(item.quantidade)
        }))
    };
}
