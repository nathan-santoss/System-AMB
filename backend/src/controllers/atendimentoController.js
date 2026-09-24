import {
    criarAtendimento as criarAtendimentoService,
    finalizarAtendimento as finalizarAtendimentoService,
    buscarAtendimentosPorFuncionario as buscarHistoricoService
} from '../services/atendimentoService.js';

import { buscarFuncionarioPorMatricula } from '../services/funcionarioService.js';

import { normalizarMatricula, normalizarTexto } from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    identificadorEhValido,
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

import { responderErroInterno } from '../utils/respostas.js';
import { consultarDashboard } from '../services/dashboardService.js';

const GRAVIDADES_PERMITIDAS = ['Baixa', 'Média', 'Alta'];

const ACOES_PERMITIDAS = ['Medicação no Local', 'Encaminhado UPA', 'Liberado'];

const TAMANHO_MINIMO_QUEIXA = 2;
const TAMANHO_MAXIMO_QUEIXA = 5000;
const TAMANHO_MAXIMO_PRESSAO = 20;

export async function finalizarAtendimento(req, res) {
    const id = req.params.id;
    if (!identificadorEhValido(id) || Number(id) > 2147483647) {
        return res.status(400).json({ erro: 'Informe um identificador de atendimento válido.' });
    }
    try {
        const atendimento = await finalizarAtendimentoService(Number(id));
        if (!atendimento) {
            return res.status(404).json({ erro: 'Atendimento não encontrado.' });
        }
        return res.status(200).json(atendimento);
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao finalizar atendimento.', erro);
    }
}

function responderErroValidacao(res, mensagem) {
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
        const texto = valor.trim().replace(',', '.');

        if (texto.length === 0) {
            return null;
        }

        return Number(texto);
    }

    return valor;
}

function validarDadosAtendimento(corpo) {
    const queixaPrincipal = normalizarTexto(corpo.queixa_principal);

    if (!textoObrigatorioEhValido(queixaPrincipal, TAMANHO_MAXIMO_QUEIXA)) {
        return {
            erro: 'A queixa principal é obrigatória e deve possuir entre 2 e 5000 caracteres.'
        };
    }

    if (queixaPrincipal.length < TAMANHO_MINIMO_QUEIXA) {
        return {
            erro: 'A queixa principal é obrigatória e deve possuir entre 2 e 5000 caracteres.'
        };
    }

    const pressaoArterial = normalizarTexto(corpo.pressao_arterial);

    if (!textoObrigatorioEhValido(pressaoArterial, TAMANHO_MAXIMO_PRESSAO)) {
        return {
            erro: 'A pressão arterial é obrigatória e deve possuir até 20 caracteres.'
        };
    }

    const temperatura = normalizarTemperatura(corpo.temperatura);

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

    const gravidade = normalizarTexto(corpo.gravidade);

    if (!GRAVIDADES_PERMITIDAS.includes(gravidade)) {
        return {
            erro: 'A gravidade deve ser Baixa, Média ou Alta.'
        };
    }

    const acaoTomada = normalizarTexto(corpo.acao_tomada);

    if (!ACOES_PERMITIDAS.includes(acaoTomada)) {
        return {
            erro: 'A ação tomada informada não é permitida.'
        };
    }

    const entrada = new Date(corpo.data_hora_entrada);
    if (
        typeof corpo.data_hora_entrada !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(
            corpo.data_hora_entrada
        ) ||
        Number.isNaN(entrada.getTime()) ||
        entrada.getTime() > Date.now()
    ) {
        return { erro: 'Informe uma data de entrada válida, sem horário futuro.' };
    }
    if (
        typeof corpo.chave_registro !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            corpo.chave_registro
        )
    ) {
        return { erro: 'Identificador do envio inválido. Atualize a página.' };
    }
    let destino = null;
    if (acaoTomada === 'Encaminhado UPA') {
        if (
            typeof corpo.local_encaminhamento !== 'string' ||
            !corpo.local_encaminhamento.trim() ||
            corpo.local_encaminhamento.trim().length > 150
        ) {
            return { erro: 'Informe o destino do encaminhamento, com até 150 caracteres.' };
        }
        destino = corpo.local_encaminhamento.trim();
    }
    if (corpo.finalizar !== undefined && typeof corpo.finalizar !== 'boolean')
        return { erro: 'Situação inválida.' };
    let saida = null;
    if (corpo.finalizar === true) saida = new Date();

    return {
        dados: {
            queixa_principal: queixaPrincipal,
            pressao_arterial: pressaoArterial,
            temperatura,
            gravidade,
            acao_tomada: acaoTomada,
            chave_registro: corpo.chave_registro,
            data_hora_entrada: entrada,
            data_hora_saida: saida,
            local_encaminhamento: destino
        }
    };
}

export async function registrarAtendimento(req, res) {
    try {
        if (!corpoEhObjetoValido(req.body)) {
            return responderErroValidacao(
                res,
                'O corpo da requisição deve ser um objeto JSON válido.'
            );
        }

        const matricula = normalizarMatricula(req.body.funcionario_matricula);

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula do funcionário é obrigatória e deve possuir até 20 caracteres.'
            );
        }

        const funcionario = await buscarFuncionarioPorMatricula(matricula);

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        const validacao = validarDadosAtendimento(req.body);

        if (validacao.erro) {
            return responderErroValidacao(res, validacao.erro);
        }

        const atendimento = await criarAtendimentoService({
            ...validacao.dados,
            funcionario_matricula: matricula,
            registrado_por: req.usuario.id_usuario,
            supervisor_na_epoca: funcionario.supervisor,
            coordenador_na_epoca: funcionario.coordenador,
            gerente_na_epoca: funcionario.gerente
        });

        return res.status(201).json(atendimento);
    } catch (erro) {
        if (erro.status === 400 || erro.status === 409)
            return res.status(erro.status).json({ erro: erro.message });
        return responderErroInterno(res, 'Erro ao registrar atendimento:', erro);
    }
}

export async function buscarAtendimentosPorFuncionario(req, res) {
    try {
        const matricula = normalizarMatricula(req.params.matricula);

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(res, 'A matrícula informada é inválida.');
        }

        const funcionario = await buscarFuncionarioPorMatricula(matricula);

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        const atendimentos = await buscarHistoricoService(matricula);

        return res.status(200).json(atendimentos);
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao buscar atendimentos:', erro);
    }
}

export async function obterDadosDashboard(req, res) {
    try {
        return res.json(await consultarDashboard());
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao carregar dashboard:', erro);
    }
}
