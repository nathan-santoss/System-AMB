import {
    buscarFuncionarioPorMatricula
} from './funcionarioService.js';


import {
    buscarAlergiasPorFuncionario
} from './alergiaService.js';


import {
    buscarAtendimentosPorFuncionario
} from './atendimentoService.js';



// Eu monto o prontuário completo de um funcionário.
export async function buscarProntuarioFuncionario(
    matricula
) {


    // Primeiro, busco os dados principais do funcionário.
    const funcionario =
        await buscarFuncionarioPorMatricula(
            matricula
        );


    if (!funcionario) {
        // Se ele não existir, eu paro por aqui e retorno nulo.

        return null;

    }



    // Se o funcionário existe, eu busco a lista de alergias dele.
    const alergias =
        await buscarAlergiasPorFuncionario(
            matricula
        );



    // Também busco todo o histórico de atendimentos.
    const atendimentos =
        await buscarAtendimentosPorFuncionario(
            matricula
        );



    // Eu percorro cada atendimento para adicionar um campo de 'status' (em_aberto ou finalizado).
    const atendimentosComStatus =
        atendimentos.map(
            atendimento => {


                const dados =
                    atendimento.toJSON();



                let status =
                    'em_aberto';



                // Se tiver data e hora de saída, o status muda para 'finalizado'.
                if (

                    dados.data_hora_saida !== null &&
                    dados.data_hora_saida !== undefined

                ) {

                    status =
                        'finalizado';

                }



                return {

                    ...dados,

                    status

                };

            }

        );



    // Eu filtro a lista de atendimentos para contar quantos ainda estão abertos.
    const atendimentosAbertos =
        atendimentosComStatus.filter(
            atendimento => {


                return (
                    atendimento.status ===
                    'em_aberto'
                );


            }
        );



    // Eu pego a data do último atendimento registrado.
    const ultimoAtendimento =
        atendimentos.length > 0
            ?
            atendimentos[0].data_hora_entrada
            :
            null;

    // Por fim, eu junto todas as informações em um único objeto de prontuário.
    return {


        funcionario,



        // Crio um resumo com os totais para facilitar a exibição no frontend.
        resumo: {


            totalAlergias:
                alergias.length,



            totalAtendimentos:
                atendimentos.length,



            totalAtendimentosAbertos:
                atendimentosAbertos.length,

            ultimoAtendimento


        },

        alergias,

        // Retorno a lista de atendimentos já com o campo de status.
        atendimentos:
            atendimentosComStatus


    };


}