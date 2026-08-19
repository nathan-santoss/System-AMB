import {
    buscarFuncionarioPorMatricula
} from './funcionarioService.js';

import {
    buscarAlergiasPorFuncionario
} from './alergiaService.js';

import {
    buscarAtendimentosPorFuncionario
} from './atendimentoService.js';

// Aqui eu monto o prontuário completo do paciente de forma organizada.
export async function buscarProntuarioFuncionario(matricula) {
    // Primeiro eu busco os dados principais do funcionário utilizando a matrícula.
    const funcionario = await buscarFuncionarioPorMatricula(matricula);

    // Se o paciente não existir no banco de dados, eu interrompo a execução retornando nulo.
    if (!funcionario) {
        return null;
    }

    // Com o paciente validado, eu resgato todos os alertas médicos e alergias cadastradas.
    const alergias = await buscarAlergiasPorFuncionario(matricula);

    // Em seguida eu busco todo o histórico de triagens e atendimentos já realizados.
    const atendimentos = await buscarAtendimentosPorFuncionario(matricula);

    // Agora eu percorro cada atendimento para injetar um status situacional amigável.
    const atendimentosComStatus = atendimentos.map(atendimento => {
        const dados = atendimento.toJSON();
        let status = 'em_aberto';

        // Se houver uma data de saída registrada, eu considero o atendimento como concluído.
        if (dados.data_hora_saida !== null && dados.data_hora_saida !== undefined) {
            status = 'finalizado';
        }

        return {
            ...dados,
            status
        };
    });

    // Neste ponto eu filtro a lista apenas para saber quantos atendimentos não foram finalizados.
    const atendimentosAbertos = atendimentosComStatus.filter(atendimento => {
        if (atendimento.status === 'em_aberto') {
            return true;
        }

        return false;
    });

    // Aqui eu preparo a variável que guardará a data da última vez que o paciente foi atendido.
    let ultimoAtendimento = null;

    // Se existir pelo menos um registro no histórico, eu pego a data de entrada do mais recente.
    if (atendimentos.length > 0) {
        ultimoAtendimento = atendimentos[0].data_hora_entrada;
    }

    // Por fim eu empacoto todas as informações no formato exato que o frontend espera (o molde).
    return {
        funcionario,
        resumo: {
            totalAlergias: alergias.length,
            totalAtendimentos: atendimentos.length,
            totalAtendimentosAbertos: atendimentosAbertos.length,
            ultimoAtendimento
        },
        alergias,
        atendimentos: atendimentosComStatus
    };
}