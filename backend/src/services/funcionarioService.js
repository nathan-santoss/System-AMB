import Funcionario from '../models/funcionarios.js';

import {
    Op
} from 'sequelize';



export async function criarFuncionario(
    dados
) {

    return await Funcionario.create(
        dados
    );

}



export async function buscarTodosFuncionarios(
    filtro = {}
) {

    const opcoesConsulta = {

        order: [
            [
                'nome',
                'ASC'
            ]
        ]

    };


    if (
        filtro.busca &&
        filtro.busca.trim().length > 0
    ) {

        const busca =
            filtro.busca.trim();


        const filtros = [

            {
                matricula: {
                    [Op.like]:
                        `%${busca}%`
                }
            },


            {
                nome: {
                    [Op.like]:
                        `%${busca}%`
                }
            },


            {
                cargo: {
                    [Op.like]:
                        `%${busca}%`
                }
            },


            {
                setor: {
                    [Op.like]:
                        `%${busca}%`
                }
            },


            {
                nucleo: {
                    [Op.like]:
                        `%${busca}%`
                }
            }

        ];


        const cpfBusca =
            busca.replace(
                /\D/g,
                ''
            );


        if (
            cpfBusca.length > 0
        ) {

            filtros.push({

                cpf: {

                    [Op.like]:
                        `%${cpfBusca}%`

                }

            });

        }


        opcoesConsulta.where = {

            [Op.or]:
                filtros

        };

    }


    return await Funcionario.findAll(
        opcoesConsulta
    );

}



export async function buscarFuncionarioPorMatricula(
    matricula
) {

    return await Funcionario.findByPk(
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



export async function deletarFuncionario(
    funcionario
) {

    await funcionario.destroy();

}



export async function funcionarioExiste(
    matricula
) {

    const funcionario =
        await Funcionario.findByPk(
            matricula
        );


    return funcionario !== null;

}