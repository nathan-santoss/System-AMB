import { Op, fn, col, where, Transaction } from 'sequelize';
import database from '../config/database.js';
import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';

function prepararConsulta(filtros, transaction) {
    const condicoes = {
        data_hora_entrada: { [Op.lt]: filtros.fimUtc }
    };

    // Pendências antigas continuam visíveis mesmo fora do início selecionado.
    if (filtros.tipo === 'pendencias') {
        condicoes.data_hora_saida = null;
    } else {
        condicoes.data_hora_entrada[Op.gte] = filtros.inicioUtc;
    }
    if (filtros.tipo === 'encaminhamentos') condicoes.acao_tomada = 'Encaminhado UPA';
    if (filtros.situacao === 'aberto') condicoes.data_hora_saida = null;
    if (filtros.situacao === 'finalizado') condicoes.data_hora_saida = { [Op.ne]: null };
    if (filtros.gravidade) condicoes.gravidade = filtros.gravidade;
    if (filtros.matricula) condicoes.funcionario_matricula = filtros.matricula;

    const cadastro = {};
    if (filtros.setor) cadastro.setor = filtros.setor;
    if (filtros.nucleo) cadastro.nucleo = filtros.nucleo;

    // O campo vem de uma lista validada, nunca de um identificador livre.
    let colunaLideranca = 'Atendimento.' + filtros.grupo + '_na_epoca';
    if (filtros.vinculo === 'atual') colunaLideranca = 'funcionario.' + filtros.grupo;
    const lideranca = fn('NULLIF', fn('BTRIM', col(colunaLideranca)), '');
    if (filtros.lideranca) condicoes[Op.and] = [where(lideranca, filtros.lideranca)];

    return {
        lideranca,
        opcoes: {
            where: condicoes,
            include: [
                {
                    model: Funcionario,
                    as: 'funcionario',
                    attributes: [],
                    where: cadastro,
                    required: true
                }
            ],
            transaction,
            raw: true,
            subQuery: false
        }
    };
}

function acrescentarCondicao(opcoes, condicao) {
    return { ...opcoes, where: { [Op.and]: [opcoes.where, condicao] } };
}

export async function consultarRelatorio(filtros, exportar = false) {
    // Indicadores e linhas usam a mesma versão dos dados durante a emissão.
    return database.transaction(
        {
            isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
            readOnly: true
        },
        async (transaction) => {
            const { opcoes, lideranca } = prepararConsulta(filtros, transaction);
            const total = await Atendimento.count(opcoes);
            if (exportar && total > 10000) {
                const erro = new Error(
                    'Há mais de 10.000 registros. Reduza o período ou selecione uma equipe.'
                );
                erro.status = 400;
                throw erro;
            }

            const pessoas = await Atendimento.count({
                ...opcoes,
                distinct: true,
                col: 'funcionario_matricula'
            });
            const abertos = await Atendimento.count(
                acrescentarCondicao(opcoes, { data_hora_saida: null })
            );
            const encaminhamentos = await Atendimento.count(
                acrescentarCondicao(opcoes, { acao_tomada: 'Encaminhado UPA' })
            );

            // Calcula as médias no banco. A subtração final trabalha apenas com dois números.
            const encerrados = acrescentarCondicao(opcoes, {
                data_hora_saida: { [Op.gte]: col('Atendimento.data_hora_entrada') }
            });
            const medias = await Atendimento.findAll({
                ...encerrados,
                attributes: [
                    [
                        fn('AVG', fn('date_part', 'epoch', col('Atendimento.data_hora_entrada'))),
                        'entrada'
                    ],
                    [
                        fn('AVG', fn('date_part', 'epoch', col('Atendimento.data_hora_saida'))),
                        'saida'
                    ]
                ]
            });
            let minutos = null;
            if (medias[0].entrada !== null && medias[0].saida !== null) {
                minutos =
                    Math.round((Number(medias[0].saida) - Number(medias[0].entrada)) / 6) / 10;
            }

            const grupos = await Atendimento.findAll({
                ...opcoes,
                attributes: [
                    [lideranca, 'lideranca'],
                    [fn('COUNT', col('Atendimento.id_atendimento')), 'idas'],
                    [
                        fn('COUNT', fn('DISTINCT', col('Atendimento.funcionario_matricula'))),
                        'pessoas'
                    ]
                ],
                group: [lideranca],
                order: [[fn('COUNT', col('Atendimento.id_atendimento')), 'DESC']]
            });

            // O banco devolve grupos pequenos; a posição preserva empates e separa ausências.
            const ranking = grupos.map((item) => ({
                lideranca: item.lideranca,
                idas: Number(item.idas),
                pessoas: Number(item.pessoas),
                posicao: null
            }));
            ranking.sort((a, b) => {
                if (!a.lideranca && b.lideranca) return 1;
                if (a.lideranca && !b.lideranca) return -1;
                if (a.idas !== b.idas) return b.idas - a.idas;
                return String(a.lideranca).localeCompare(String(b.lideranca), 'pt-BR');
            });
            let posicao = 0;
            let quantidadeAnterior = null;
            for (let indice = 0; indice < ranking.length; indice++) {
                const item = ranking[indice];
                if (!item.lideranca) continue;
                if (item.idas !== quantidadeAnterior) posicao = indice + 1;
                item.posicao = posicao;
                quantidadeAnterior = item.idas;
            }

            const dia = fn(
                'to_char',
                fn('timezone', 'America/Sao_Paulo', col('Atendimento.data_hora_entrada')),
                'YYYY-MM-DD'
            );
            const movimento = await Atendimento.findAll({
                ...opcoes,
                attributes: [
                    [dia, 'dia'],
                    [fn('COUNT', col('Atendimento.id_atendimento')), 'total']
                ],
                group: [dia],
                order: [[dia, 'ASC']]
            });
            const evolucao = movimento.map((item) => ({
                dia: item.dia,
                total: Number(item.total)
            }));

            const consultaRegistros = {
                ...opcoes,
                attributes: [
                    ['id_atendimento', 'id'],
                    ['funcionario_matricula', 'matricula'],
                    [col('funcionario.nome'), 'nome'],
                    [col('funcionario.setor'), 'setor'],
                    ['data_hora_entrada', 'entrada'],
                    ['data_hora_saida', 'saida'],
                    'gravidade',
                    ['acao_tomada', 'acao'],
                    ['local_encaminhamento', 'destino'],
                    [lideranca, 'lideranca']
                ],
                order: [
                    ['data_hora_entrada', 'DESC'],
                    ['id_atendimento', 'DESC']
                ]
            };
            if (!exportar) {
                consultaRegistros.limit = 25;
                consultaRegistros.offset = (filtros.pagina - 1) * 25;
            }
            const registros = await Atendimento.findAll(consultaRegistros);
            return {
                filtros,
                resumo: { total, pessoas, abertos, encaminhamentos, minutos },
                ranking,
                evolucao,
                registros,
                totalPaginas: Math.max(1, Math.ceil(total / 25)),
                emitidoEm: new Date()
            };
        }
    );
}

export async function consultarOpcoes() {
    const opcoes = [];
    for (const campo of ['supervisor', 'coordenador', 'gerente', 'setor', 'nucleo']) {
        const cadastros = await Funcionario.findAll({
            attributes: [[fn('DISTINCT', col(campo)), 'valor']],
            where: { [campo]: { [Op.ne]: null } },
            raw: true
        });
        let historicos = [];
        if (['supervisor', 'coordenador', 'gerente'].includes(campo)) {
            historicos = await Atendimento.findAll({
                attributes: [[fn('DISTINCT', col(campo + '_na_epoca')), 'valor']],
                where: { [campo + '_na_epoca']: { [Op.ne]: null } },
                raw: true
            });
        }
        const valores = new Set();
        for (const registro of [...cadastros, ...historicos]) {
            const valor = registro.valor.trim();
            if (valor) valores.add(valor);
        }
        for (const valor of [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'))) {
            opcoes.push({ campo, valor });
        }
    }
    return opcoes;
}
