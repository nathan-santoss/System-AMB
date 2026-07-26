import {
    criarAtendimento as criarAtendimentoService,
    buscarTodosAtendimentos as buscarTodosAtendimentosService,
    buscarAtendimentoPorId as buscarAtendimentoService,
    buscarAtendimentosPorFuncionario as buscarAtendimentosFuncionarioService
} from '../services/atendimentoService.js';

import {
    buscarFuncionarioPorMatricula as buscarFuncionarioService
} from '../services/funcionarioService.js';

import {
    normalizarMatricula
} from '../utils/normalizadores.js';

import {
    matriculaEhValida,
    corpoEhObjetoValido,
    identificadorEhValido
} from '../utils/validadores.js';

import {
    responderErroInterno
} from '../utils/respostas.js';



export async function criarAtendimento(req, res) {
    try {
        // Primeiro, eu verifico se o corpo da requisição é um objeto JSON válido.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Eu pego a matrícula do funcionário que veio no corpo da requisição e a normalizo.
        const matricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        // Depois, eu valido se a matrícula está em um formato correto.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória.'
            });
        }

        // Eu busco pelo funcionário no banco de dados para garantir que ele existe.
        const funcionario = await buscarFuncionarioService(
            matricula
        );

        // Se o funcionário não for encontrado, eu retorno um erro.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Eu junto os dados do atendimento que recebi, garantindo que a matrícula está normalizada.
        const dadosAtendimento = {
            ...req.body,
            funcionario_matricula: matricula
        };

        // Com tudo validado, eu chamo o serviço para criar o novo atendimento no banco de dados.
        const atendimento = await criarAtendimentoService(
            dadosAtendimento
        );

        // Se tudo der certo, eu retorno o atendimento que foi criado.
        return res.status(201).json(atendimento);

    } catch (erro) {
        // Se algo der errado durante o processo, eu capturo o erro e envio uma resposta adequada.
        return responderErroInterno(
            res,
            'Erro ao criar atendimento:',
            erro
        );
    }
}



export async function buscarAtendimentos(req, res) {
    try {
        // Eu busco todos os atendimentos, usando os filtros que podem ter vindo na query da URL.
        const atendimentos =
            await buscarTodosAtendimentosService(
                req.query
            );

        // E retorno a lista de atendimentos que encontrei.
        return res.status(200).json(atendimentos);

    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar atendimentos:',
            erro
        );
    }
}



export async function buscarAtendimentoPorId(req, res) {
    try {
        // Eu pego o ID do atendimento que veio como parâmetro na URL.
        const id = req.params.id;

        // Verifico se o ID é um número válido e positivo.
        if (!identificadorEhValido(id)) {
            return res.status(400).json({
                erro: 'O identificador do atendimento é inválido.'
            });
        }

        // Eu busco o atendimento específico no banco de dados usando o ID.
        const atendimento =
            await buscarAtendimentoService(id);

        // Se não encontrar, eu aviso que o atendimento não existe.
        if (!atendimento) {
            return res.status(404).json({
                erro: 'Atendimento não encontrado.'
            });
        }

        // Se encontrar, eu retorno os dados do atendimento.
        return res.status(200).json(atendimento);

    } catch (erro) {
        // Se algo der errado, eu lido com o erro.
        return responderErroInterno(
            res,
            'Erro ao buscar atendimento:',
            erro
        );
    }
}



export async function buscarHistoricoFuncionario(req, res) {
    try {
        // Eu pego a matrícula do funcionário pela URL e a normalizo para um formato padrão.
        const matricula = normalizarMatricula(
            req.params.matricula
        );

        // Valido se a matrícula é um dado aceitável.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });
        }

        // Eu busco todos os atendimentos (o histórico) para essa matrícula.
        const atendimentos =
            await buscarAtendimentosFuncionarioService(
                matricula
            );

        // E retorno a lista de atendimentos encontrada.
        return res.status(200).json(atendimentos);

    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar histórico do funcionário:',
            erro
        );
    }
}

export async function atualizarAtendimento(req, res) {
    try {
        // Verifico se recebi um objeto JSON válido no corpo da requisição.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Pego o ID do atendimento que veio na URL.
        const id = req.params.id;

        // Valido se o ID é um identificador correto.
        if (!identificadorEhValido(id)) {
            return res.status(400).json({
                erro: 'O identificador do atendimento é inválido.'
            });
        }

        // Busco o atendimento que será atualizado para garantir que ele existe.
        const atendimento =
            await buscarAtendimentoService(id);

        // Se não existir, eu retorno um erro 404.
        if (!atendimento) {
            return res.status(404).json({
                erro: 'Atendimento não encontrado.'
            });
        }

        // Chamo o serviço que vai de fato atualizar os dados do atendimento no banco.
        const atualizado =
            await atualizarAtendimentoService(
                atendimento,
                req.body
            );

        // Retorno o atendimento com os dados atualizados.
        return res.status(200).json(atualizado);

    } catch (erro) {
        // Trato qualquer erro que possa acontecer durante a atualização.
        return responderErroInterno(
            res,
            'Erro ao atualizar atendimento:',
            erro
        );
    }
}



export async function finalizarAtendimento(req, res) {
    try {
        // Pego o ID do atendimento que quero finalizar a partir da URL.
        const id = req.params.id;

        // Faço a validação do ID.
        if (!identificadorEhValido(id)) {
            return res.status(400).json({
                erro: 'O identificador do atendimento é inválido.'
            });
        }

        // Busco o atendimento no banco de dados.
        const atendimento =
            await buscarAtendimentoService(id);

        // Se o atendimento não for encontrado, eu informo.
        if (!atendimento) {
            return res.status(404).json({
                erro: 'Atendimento não encontrado.'
            });
        }

        // Verifico se o atendimento já foi finalizado antes.
        if (atendimento.data_hora_saida) {
            return res.status(400).json({
                erro: 'Este atendimento já foi finalizado.'
            });
        }

        // Chamo o serviço para registrar a data e hora de saída, finalizando o atendimento.
        const finalizado =
            await finalizarAtendimentoService(
                atendimento,
                new Date()
            );

        // Retorno o atendimento com o status de finalizado.
        return res.status(200).json(finalizado);

    } catch (erro) {
        // Se ocorrer algum erro, eu o trato.
        return responderErroInterno(
            res,
            'Erro ao finalizar atendimento:',
            erro
        );
    }
}

import {
    buscarAtendimentosPorPeriodo as buscarAtendimentosPeriodoService,
    contarAtendimentosPorPeriodo as contarAtendimentosPeriodoService,
    buscarUltimosAtendimentos as buscarUltimosAtendimentosService,
    contarAtendimentosAbertos as contarAtendimentosAbertosService
} from '../services/atendimentoService.js';

import {
    criarInicioDoDia,
    criarFimDoDia,
    criarInicioDoMes,
    criarFimDoMes
} from '../utils/datas.js';



export async function obterDadosDashboard(req, res) {
    try {
        // Eu pego a data e hora atuais para usar como base para as buscas.
        const agora = new Date();

        const inicioDia = criarInicioDoDia(
            agora
        );

        const fimDia = criarFimDoDia(
            agora
        );

        const inicioMes = criarInicioDoMes(
            agora
        );

        const fimMes = criarFimDoMes(
            agora
        );

        // Conto quantos atendimentos foram realizados hoje.
        const atendimentosHoje =
            await contarAtendimentosPeriodoService(
                inicioDia,
                fimDia
            );

        // Conto quantos atendimentos foram realizados no mês atual.
        const atendimentosMes =
            await contarAtendimentosPeriodoService(
                inicioMes,
                fimMes
            );

        // Conto quantos atendimentos ainda estão em aberto.
        const atendimentosAbertos =
            await contarAtendimentosAbertosService();

        // Busco os últimos atendimentos registrados para exibir na tela.
        const ultimosAtendimentos =
            await buscarUltimosAtendimentosService();

        // Monto um objeto com todos os dados resumidos para o dashboard.
        return res.status(200).json({
            resumo: {
                atendimentosHoje,
                atendimentosMes,
                atendimentosAbertos
            },
            ultimosAtendimentos
        });

    } catch (erro) {
        // Se algo der errado ao buscar os dados, eu retorno um erro.
        return responderErroInterno(
            res,
            'Erro ao carregar dashboard:',
            erro
        );
    }
}



export async function buscarAtendimentosPeriodo(req, res) {
    try {
        // Eu pego as datas de início e fim que vieram nos parâmetros da URL.
        const inicio = req.query.inicio;
        const fim = req.query.fim;

        // Verifico se as duas datas foram informadas.
        if (!inicio || !fim) {
            return res.status(400).json({
                erro: 'Informe a data inicial e final.'
            });
        }

        // Chamo o serviço que busca no banco de dados todos os atendimentos dentro do período.
        const atendimentos =
            await buscarAtendimentosPeriodoService(
                inicio,
                fim
            );

        // Retorno a lista de atendimentos encontrados.
        return res.status(200).json(
            atendimentos
        );

    } catch (erro) {
        // Se houver erro, eu o capturo e respondo adequadamente.
        return responderErroInterno(
            res,
            'Erro ao buscar atendimentos por período:',
            erro
        );
    }
}