import {
    criarAtendimento as criarAtendimentoService,
    buscarAtendimentosPorFuncionario as buscarHistoricoService,
    buscarAtendimentosPorPeriodo,
    buscarUltimosAtendimentos
} from '../services/atendimentoService.js';

import {
    buscarFuncionarioPorMatricula,
    buscarTodosFuncionarios
} from '../services/funcionarioService.js';

import {
    normalizarMatricula,
    normalizarTexto
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    matriculaEhValida,
    textoObrigatorioEhValido,
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

const GRAVIDADES_PERMITIDAS = [
    'Baixa',
    'Média',
    'Alta'
];

const ACOES_PERMITIDAS = [
    'Medicação no Local',
    'Encaminhado UPA',
    'Liberado'
];

const TAMANHO_MINIMO_QUEIXA = 2;
const TAMANHO_MAXIMO_QUEIXA = 5000;
const TAMANHO_MAXIMO_PRESSAO = 20;

function responderErroValidacao(
    res,
    mensagem
) {
    return res.status(400).json({
        erro: mensagem
    });
}

function normalizarTemperatura(valor) {
    if (valor === null) {
        return null;
    }

    if (valor === undefined) {
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

function validarDadosAtendimento(corpo) {
    const queixaPrincipal = normalizarTexto(
        corpo.queixa_principal
    );

    if (
        !textoObrigatorioEhValido(
            queixaPrincipal,
            TAMANHO_MAXIMO_QUEIXA
        )
    ) {
        return {
            erro: 'A queixa principal é obrigatória e deve possuir entre 2 e 5000 caracteres.'
        };
    }

    if (
        queixaPrincipal.length <
        TAMANHO_MINIMO_QUEIXA
    ) {
        return {
            erro: 'A queixa principal é obrigatória e deve possuir entre 2 e 5000 caracteres.'
        };
    }

    const pressaoArterial = normalizarTexto(
        corpo.pressao_arterial
    );

    if (
        !textoObrigatorioEhValido(
            pressaoArterial,
            TAMANHO_MAXIMO_PRESSAO
        )
    ) {
        return {
            erro: 'A pressão arterial é obrigatória e deve possuir até 20 caracteres.'
        };
    }

    const temperatura = normalizarTemperatura(
        corpo.temperatura
    );

    if (temperatura === null) {
        return {
            erro: 'A temperatura é obrigatória.'
        };
    }

    if (!temperaturaEhValida(temperatura)) {
        return {
            erro: 'A temperatura deve ser um número entre 0 e 100.'
        };
    }

    const gravidade = normalizarTexto(
        corpo.gravidade
    );

    if (
        !GRAVIDADES_PERMITIDAS.includes(
            gravidade
        )
    ) {
        return {
            erro: 'A gravidade deve ser Baixa, Média ou Alta.'
        };
    }

    const acaoTomada = normalizarTexto(
        corpo.acao_tomada
    );

    if (
        !ACOES_PERMITIDAS.includes(
            acaoTomada
        )
    ) {
        return {
            erro: 'A ação tomada informada não é permitida.'
        };
    }

    return {
        dados: {
            queixa_principal: queixaPrincipal,
            pressao_arterial: pressaoArterial,
            temperatura,
            gravidade,
            acao_tomada: acaoTomada
        }
    };
}

function converterRegistroParaObjeto(registro) {
    if (!registro) {
        return {};
    }

    if (typeof registro.toJSON === 'function') {
        return registro.toJSON();
    }

    return {
        ...registro
    };
}

function criarMapaFuncionarios(funcionarios) {
    const mapa = new Map();

    for (const funcionario of funcionarios) {
        const dadosFuncionario =
            converterRegistroParaObjeto(
                funcionario
            );

        const chave = String(
            dadosFuncionario.matricula
        );

        mapa.set(
            chave,
            dadosFuncionario
        );
    }

    return mapa;
}

function montarUltimosAtendimentos(
    atendimentos,
    funcionarios
) {
    const resultado = [];

    for (const atendimento of atendimentos) {
        const dadosAtendimento =
            converterRegistroParaObjeto(
                atendimento
            );

        const chaveFuncionario = String(
            dadosAtendimento.funcionario_matricula
        );

        const funcionario = funcionarios.get(
            chaveFuncionario
        );

        let nome = 'Funcionário sem nome';

        if (funcionario) {
            if (
                typeof funcionario.nome === 'string' &&
                funcionario.nome.trim().length > 0
            ) {
                nome = funcionario.nome;
            }
        }

        resultado.push({
            ...dadosAtendimento,
            nome
        });
    }

    return resultado;
}

function montarRankingSetores(
    atendimentos,
    funcionarios
) {
    const totais = new Map();

    for (const atendimento of atendimentos) {
        const dadosAtendimento =
            converterRegistroParaObjeto(
                atendimento
            );

        const chaveFuncionario = String(
            dadosAtendimento.funcionario_matricula
        );

        const funcionario = funcionarios.get(
            chaveFuncionario
        );

        let setor = 'Não informado';

        if (funcionario) {
            if (
                typeof funcionario.setor === 'string' &&
                funcionario.setor.trim().length > 0
            ) {
                setor = funcionario.setor;
            }
        }

        let quantidadeAtual = 0;

        if (totais.has(setor)) {
            quantidadeAtual = totais.get(
                setor
            );
        }

        totais.set(
            setor,
            quantidadeAtual + 1
        );
    }

    const ranking = [];

    for (const item of totais) {
        ranking.push({
            setor: item[0],
            quantidade: item[1]
        });
    }

    ranking.sort(
        function (primeiro, segundo) {
            return (
                segundo.quantidade -
                primeiro.quantidade
            );
        }
    );

    return ranking;
}

function contarGravidades(atendimentos) {
    const totais = {
        baixa: 0,
        media: 0,
        alta: 0
    };

    for (const atendimento of atendimentos) {
        const dadosAtendimento =
            converterRegistroParaObjeto(
                atendimento
            );

        if (dadosAtendimento.gravidade === 'Baixa') {
            totais.baixa += 1;
        }

        if (dadosAtendimento.gravidade === 'Média') {
            totais.media += 1;
        }

        if (dadosAtendimento.gravidade === 'Alta') {
            totais.alta += 1;
        }
    }

    return totais;
}

export async function registrarAtendimento(
    req,
    res
) {
    try {
        if (!corpoEhObjetoValido(req.body)) {
            return responderErroValidacao(
                res,
                'O corpo da requisição deve ser um objeto JSON válido.'
            );
        }

        const matricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula do funcionário é obrigatória e deve possuir até 20 caracteres.'
            );
        }

        const funcionario =
            await buscarFuncionarioPorMatricula(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        const validacao = validarDadosAtendimento(
            req.body
        );

        if (validacao.erro) {
            return responderErroValidacao(
                res,
                validacao.erro
            );
        }

        const atendimento =
            await criarAtendimentoService({
                ...validacao.dados,
                funcionario_matricula: matricula,
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
            return responderErroValidacao(
                res,
                'A matrícula informada é inválida.'
            );
        }

        const funcionario =
            await buscarFuncionarioPorMatricula(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
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

            buscarUltimosAtendimentos(
                5
            ),

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

        return res.status(200).json({
            totalHoje:
                atendimentosHoje.length,

            gravidadeHoje:
                contarGravidades(
                    atendimentosHoje
                ),

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