import Alergia from '../models/alergias.js';



// Eu recebo os dados de uma nova alergia e a crio no banco de dados.
export async function criarAlergia(
    dados
) {

    return await Alergia.create(
        dados
    );

}



// Eu busco no banco de dados todas as alergias de um funcionário específico, usando a matrícula dele.
export async function buscarAlergiasPorFuncionario(
    matricula
) {

    return await Alergia.findAll({

        where: {

            funcionario_matricula:
                matricula

        },

        order: [

            [

                'id_alergia',

                'ASC'

            ]

        ]

    });

}



// Eu procuro por uma alergia específica usando o seu ID.
export async function buscarAlergiaPorId(
    id
) {

    return await Alergia.findByPk(
        id
    );

}

// Eu recebo uma alergia já existente e os novos dados, e faço a atualização no banco.
export async function atualizarAlergia(
    alergia,
    dados
) {

    await alergia.update(
        dados
    );

    return alergia;

}



// Eu recebo uma alergia e a removo permanentemente do banco de dados.
export async function deletarAlergia(
    alergia
) {

    await alergia.destroy();

}