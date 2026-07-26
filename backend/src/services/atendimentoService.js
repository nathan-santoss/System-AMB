import Atendimento from '../models/atendimento.js';

import {
    Op
} from 'sequelize';


// Eu recebo os dados de um novo atendimento e o registro no banco de dados.
export async function criarAtendimento(dados) {
    return await Atendimento.create(dados);
}


// Eu busco um atendimento específico pelo seu ID.
export async function buscarAtendimentoPorId(id) {
    return await Atendimento.findByPk(id);
}


// Eu busco todos os atendimentos, aplicando filtros se eles forem fornecidos.
export async function buscarTodosAtendimentos(filtros = {}) {
    const consulta = {
        order: [
            [
                'data_hora_entrada',
                'DESC'
            ]
        ]
    };


    if (filtros.funcionario_matricula) {
        consulta.where = {
            funcionario_matricula:
                filtros.funcionario_matricula
        };
    }


    return await Atendimento.findAll(consulta);
}


// Eu encontro todos os atendimentos registrados para um funcionário, usando a matrícula dele.
export async function buscarAtendimentosPorFuncionario(matricula) {
    return await Atendimento.findAll({
        where: {
            funcionario_matricula: matricula
        },
        order: [
            [
                'data_hora_entrada',
                'DESC'
            ]
        ]
    });
}


// Eu pego um atendimento e os novos dados, e atualizo o registro no banco.
export async function atualizarAtendimento(
    atendimento,
    dados
) {
    await atendimento.update(dados);

    return atendimento;
}


// Eu atualizo um atendimento para incluir a data e hora de saída, marcando-o como finalizado.
export async function finalizarAtendimento(
    atendimento,
    dataSaida
) {
    await atendimento.update({
        data_hora_saida: dataSaida
    });

    return atendimento;
}


// Eu busco todos os atendimentos que ocorreram dentro de um intervalo de datas específico.
export async function buscarAtendimentosPorPeriodo(
    inicio,
    fim
) {
    return await Atendimento.findAll({
        where: {
            data_hora_entrada: {
                [Op.between]: [
                    inicio,
                    fim
                ]
            }
        },
        order: [
            [
                'data_hora_entrada',
                'DESC'
            ]
        ]
    });
}


// Eu conto quantos atendimentos foram realizados em um determinado período.
export async function contarAtendimentosPorPeriodo(
    inicio,
    fim
) {
    return await Atendimento.count({
        where: {
            data_hora_entrada: {
                [Op.between]: [
                    inicio,
                    fim
                ]
            }
        }
    });
}


// Eu busco os atendimentos mais recentes, com um limite padrão de 5.
export async function buscarUltimosAtendimentos(
    limite = 5
) {
    return await Atendimento.findAll({
        limit,
        order: [
            [
                'data_hora_entrada',
                'DESC'
            ]
        ]
    });
}


// Eu conto quantos atendimentos ainda não foram finalizados (não têm data de saída).
export async function contarAtendimentosAbertos() {
    return await Atendimento.count({
        where: {
            data_hora_saida: {
                [Op.is]: null
            }
        }
    });
}