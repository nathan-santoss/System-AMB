import {
    criarAtendimento as criarAtendimentoService,
    buscarAtendimentoPorId,
    buscarAtendimentosPorFuncionario as buscarHistoricoService,
    atualizarAtendimento as atualizarAtendimentoService,
    buscarAtendimentosPorPeriodo,
    buscarUltimosAtendimentos
} from '../services/atendimentoService.js';

import {
    buscarFuncionarioPorMatricula,
    buscarTodosFuncionarios
} from '../services/funcionarioService.js';

import {
    normalizarMatricula,
    normalizarTexto,
    normalizarTextoOpcional
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    campoFoiEnviado,
    matriculaEhValida,
    identificadorEhValido,
    textoObrigatorioEhValido,
    textoOpcionalEhValido,
    temperaturaEhValida
} from '../utils/validadores.js';

import {
    criarInicioDoDia,
    criarFimDoDia,
    criarInicioDoMes,
    criarFimDoMes
} from '../utils/datas.js';

import {
    responderErroInterno
} from '../utils/respostas.js';


const GRAVIDADES = [
    'Baixa',
    'Média',
    'Alta'
];

const ACOES = [
    'Medicação no Local',
    'Encaminhado UPA',
    'Liberado'
];


function normalizarTemperatura(valor) {
    if (
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    if (typeof valor === 'string') {
        const texto = valor
            .trim()
            .replace(',', '.');

        if (texto.length === 0) {
            return null;
        }

        return Number(texto);
    }

    return valor;
}


function validarDadosAtendimento(
    corpo,
    parcial
) {
    const dados = {};

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'queixa_principal'
        )
    ) {
        const queixa = normalizarTexto(
            corpo.queixa_principal
        );

        if (
            !textoObrigatorioEhValido(
                queixa,
                5000
            )
        ) {
            return {
                erro:
                    'A queixa principal é obrigatória e deve possuir até 5000 caracteres.'
            };
        }

        dados.queixa_principal = queixa;
    }

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'gravidade'
        )
    ) {
        const gravidade = normalizarTexto(
            corpo.gravidade
        );

        if (!GRAVIDADES.includes(gravidade)) {
            return {
                erro:
                    'A gravidade deve ser Baixa, Média ou Alta.'
            };
        }

        dados.gravidade = gravidade;
    }

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'acao_tomada'
        )
    ) {
        const acao = normalizarTexto(
            corpo.acao_tomada
        );

        if (!ACOES.includes(acao)) {
            return {
                erro:
                    'A ação tomada informada não é permitida.'
            };
        }

        dados.acao_tomada = acao;
    }

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'pressao_arterial'
        )
    ) {
        const pressao = normalizarTextoOpcional(
            corpo.pressao_arterial
        );

        if (
            !textoOpcionalEhValido(
                pressao,
                20
            )
        ) {
            return {
                erro:
                    'A pressão arterial deve possuir até 20 caracteres.'
            };
        }

        dados.pressao_arterial = pressao;
    }

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'temperatura'
        )
    ) {
        const temperatura = normalizarTemperatura(
            corpo.temperatura
        );

        if (!temperaturaEhValida(temperatura)) {
            return {
                erro:
                    'A temperatura deve ser um número entre 0 e 100.'
            };
        }

        dados.temperatura = temperatura;
    }

    if (
        !parcial ||
        campoFoiEnviado(
            corpo,
            'local_encaminhamento'
        )
    ) {
        const local = normalizarTextoOpcional(
            corpo.local_encaminhamento
        );

        if (
            !textoOpcionalEhValido(
                local,
                100
            )
        ) {
            return {
                erro:
                    'O local de encaminhamento deve possuir até 100 caracteres.'
            };
        }

        dados.local_encaminhamento = local;
    }

    return {
        dados
    };
}


function criarMapaFuncionarios(funcionarios) {
    const mapa = new Map();

    funcionarios.forEach(
        function (funcionario) {
            mapa.set(
                String(funcionario.matricula),
                funcionario
            );
        }
    );

    return mapa;
}


function montarUltimosAtendimentos(
    atendimentos,
    funcionarios
) {
    return atendimentos.map(
        function (atendimento) {
            const dados = atendimento.toJSON();

            const funcionario = funcionarios.get(
                String(
                    dados.funcionario_matricula
                )
            );

            let nome = 'Funcionário sem nome';

            if (
                funcionario &&
                funcionario.nome
            ) {
                nome = funcionario.nome;
            }

            return {
                ...dados,
                nome
            };
        }
    );
}


function montarRankingSetores(
    atendimentos,
    funcionarios
) {
    const totais = new Map();

    atendimentos.forEach(
        function (atendimento) {
            const funcionario = funcionarios.get(
                String(
                    atendimento.funcionario_matricula
                )
            );

            let setor = 'Não informado';

            if (
                funcionario &&
                funcionario.setor
            ) {
                setor = funcionario.setor;
            }

            const quantidadeAtual =
                totais.get(setor) || 0;

            totais.set(
                setor,
                quantidadeAtual + 1
            );
        }
    );

    return Array.from(
        totais,
        function (item) {
            return {
                setor: item[0],
                quantidade: item[1]
            };
        }
    ).sort(
        function (primeiro, segundo) {
            return (
                segundo.quantidade -
                primeiro.quantidade
            );
        }
    );
}


export async function registrarAtendimento(
    req,
    res
) {
    try {
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro:
                    'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        const matricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro:
                    'A matrícula do funcionário é obrigatória.'
            });
        }

        const funcionario =
            await buscarFuncionarioPorMatricula(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro:
                    'Funcionário não encontrado.'
            });
        }

        const validacao = validarDadosAtendimento(
            req.body,
            false
        );

        if (validacao.erro) {
            return res.status(400).json({
                erro: validacao.erro
            });
        }

        const atendimento =
            await criarAtendimentoService({
                ...validacao.dados,

                funcionario_matricula:
                    matricula,

                supervisor_na_epoca:
                    funcionario.supervisor,

                coordenador_na_epoca:
                    funcionario.coordenador,

                gerente_na_epoca:
                    funcionario.gerente
            });

        return res.status(201).json(
            atendimento
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao registrar atendimento:',
            erro
        );
    }
}


export async function buscarAtendimentosPorFuncionario(
    req,
    res
) {
    try {
        const matricula = normalizarMatricula(
            req.params.matricula
        );

        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro:
                    'A matrícula informada é inválida.'
            });
        }

        const funcionario =
            await buscarFuncionarioPorMatricula(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro:
                    'Funcionário não encontrado.'
            });
        }

        const atendimentos =
            await buscarHistoricoService(
                matricula
            );

        return res.status(200).json(
            atendimentos
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar atendimentos:',
            erro
        );
    }
}


export async function atualizarAtendimento(
    req,
    res
) {
    try {
        if (
            !identificadorEhValido(
                req.params.id
            )
        ) {
            return res.status(400).json({
                erro:
                    'O identificador do atendimento é inválido.'
            });
        }

        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro:
                    'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        const atendimento =
            await buscarAtendimentoPorId(
                req.params.id
            );

        if (!atendimento) {
            return res.status(404).json({
                erro:
                    'Atendimento não encontrado.'
            });
        }

        const validacao = validarDadosAtendimento(
            req.body,
            true
        );

        if (validacao.erro) {
            return res.status(400).json({
                erro: validacao.erro
            });
        }

        if (
            Object.keys(
                validacao.dados
            ).length === 0
        ) {
            return res.status(400).json({
                erro:
                    'Informe ao menos um campo válido para atualização.'
            });
        }

        const atualizado =
            await atualizarAtendimentoService(
                atendimento,
                validacao.dados
            );

        return res.status(200).json(
            atualizado
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao atualizar atendimento:',
            erro
        );
    }
}


export async function deletarAtendimento(
    req,
    res
) {
    try {
        if (
            !identificadorEhValido(
                req.params.id
            )
        ) {
            return res.status(400).json({
                erro:
                    'O identificador do atendimento é inválido.'
            });
        }

        const atendimento =
            await buscarAtendimentoPorId(
                req.params.id
            );

        if (!atendimento) {
            return res.status(404).json({
                erro:
                    'Atendimento não encontrado.'
            });
        }

        await atendimento.destroy();

        return res.status(204).send();
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao excluir atendimento:',
            erro
        );
    }
}


export async function obterDadosDashboard(
    req,
    res
) {
    try {
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

        const resultados = await Promise.all([
            buscarAtendimentosPorPeriodo(
                inicioDia,
                fimDia
            ),

            buscarAtendimentosPorPeriodo(
                inicioMes,
                fimMes
            ),

            buscarUltimosAtendimentos(5),

            buscarTodosFuncionarios()
        ]);

        const atendimentosHoje =
            resultados[0];

        const atendimentosMes =
            resultados[1];

        const ultimosAtendimentos =
            resultados[2];

        const funcionarios =
            criarMapaFuncionarios(
                resultados[3]
            );

        const gravidadeHoje = {
            baixa: 0,
            media: 0,
            alta: 0
        };

        atendimentosHoje.forEach(
            function (atendimento) {
                if (
                    atendimento.gravidade ===
                    'Baixa'
                ) {
                    gravidadeHoje.baixa += 1;
                }

                if (
                    atendimento.gravidade ===
                    'Média'
                ) {
                    gravidadeHoje.media += 1;
                }

                if (
                    atendimento.gravidade ===
                    'Alta'
                ) {
                    gravidadeHoje.alta += 1;
                }
            }
        );

        return res.status(200).json({
            totalHoje:
                atendimentosHoje.length,

            gravidadeHoje,

            ultimosAtendimentos:
                montarUltimosAtendimentos(
                    ultimosAtendimentos,
                    funcionarios
                ),

            atendimentosPorSetor:
                montarRankingSetores(
                    atendimentosMes,
                    funcionarios
                )
        });
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao carregar dashboard:',
            erro
        );
    }
}