import {
    Op
} from 'sequelize';

import Funcionario from '../models/funcionarios.js';

export async function criarFuncionario(dados) {
    return Funcionario.create(
        dados
    );
}

export async function buscarTodosFuncionarios(filtro = {}) {
    const opcoesConsulta = {
        order: [
            [
                'nome',
                'ASC'
            ]
        ]
    };

    let busca = '';

    if (
        filtro &&
        typeof filtro === 'object' &&
        typeof filtro.busca === 'string'
    ) {
        busca = filtro.busca.trim();
    }

    if (busca.length > 0) {
        const filtrosBusca = [
            {
                matricula: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                nome: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                cargo: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                setor: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                nucleo: {
                    [Op.like]: `%${busca}%`
                }
            }
        ];

        const cpfBusca = busca.replace(
            /\D/g,
            ''
        );

        if (cpfBusca.length > 0) {
            filtrosBusca.push({
                cpf: {
                    [Op.like]: `%${cpfBusca}%`
                }
            });
        }

        opcoesConsulta.where = {
            [Op.or]: filtrosBusca
        };
    }

    return Funcionario.findAll(
        opcoesConsulta
    );
}

export async function buscarFuncionarioPorMatricula(matricula) {
    return Funcionario.findByPk(
        matricula
    );
}

export async function atualizarFuncionario(
    funcionario,
    dados
) {
    await funcionario.update(
        dados
    );

    return funcionario;
}

export async function deletarFuncionario(funcionario) {
    await funcionario.destroy();
}