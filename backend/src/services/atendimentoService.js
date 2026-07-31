import {Op} from 'sequelize';

import Atendimento from '../models/atendimento.js';

function obterLimiteConsulta(limite) {
    const limitePadrao = 5;

    if (limite === undefined) {
        return limitePadrao;
    }

    if (!Number.isSafeInteger(limite)) {
        throw new TypeError(
            'O limite de atendimentos deve ser um número inteiro.'
        );
    }

    if (limite <= 0) {
        throw new RangeError(
            'O limite de atendimentos deve ser maior que zero.'
        );
    }

    if (limite > 100) {
        throw new RangeError(
            'O limite de atendimentos não pode ser maior que 100.'
        );
    }

    return limite;
}

export async function criarAtendimento(dados) {
    return Atendimento.create(
        dados
    );
}

export async function buscarAtendimentosPorFuncionario(matricula) {
    return Atendimento.findAll({
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

export async function buscarAtendimentosPorPeriodo(inicio, fim) {
    return Atendimento.findAll({
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

export async function buscarUltimosAtendimentos(limite) {
    const limiteConsulta =
        obterLimiteConsulta(
            limite
        );

    return Atendimento.findAll({
        limit: limiteConsulta,

        order: [
            [
                'data_hora_entrada',
                'DESC'
            ]
        ]
    });
}