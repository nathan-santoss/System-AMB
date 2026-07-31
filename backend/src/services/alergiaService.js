import Alergia from '../models/alergias.js';

export async function criarAlergia(
    dados
) {
    return Alergia.create(
        dados
    );
}

export async function buscarAlergiasPorFuncionario(
    matricula
) {
    return Alergia.findAll({
        where: {
            funcionario_matricula: matricula
        },

        order: [
            [
                'id_alergia',
                'ASC'
            ]
        ]
    });
}

export async function buscarAlergiaPorId(
    idAlergia
) {
    return Alergia.findByPk(
        idAlergia
    );
}

export async function deletarAlergia(
    alergia
) {
    await alergia.destroy();
}