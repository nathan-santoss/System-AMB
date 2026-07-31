import {
    criarAlergia,
    buscarAlergiasPorFuncionario,
    buscarAlergiaPorId as buscarAlergiaService,
    deletarAlergia as deletarAlergiaService
} from '../services/alergiaService.js';

import {
    buscarFuncionarioPorMatricula
} from '../services/funcionarioService.js';

import {
    normalizarMatricula,
    normalizarTexto
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    matriculaEhValida,
    identificadorEhValido,
    textoObrigatorioEhValido
} from '../utils/validadores.js';

import {
    responderErroInterno
} from '../utils/respostas.js';

const TAMANHO_MINIMO_DESCRICAO = 2;
const TAMANHO_MAXIMO_DESCRICAO = 255;

function responderErroValidacao(
    res,
    mensagem
) {
    return res.status(400).json({
        erro: mensagem
    });
}

function obterDescricaoAlergia(corpo) {
    if (!corpoEhObjetoValido(corpo)) {
        return {
            erro: 'O corpo da requisição deve ser um objeto JSON válido.'
        };
    }

    const descricao = normalizarTexto(
        corpo.descricao_alergia
    );

    if (
        !textoObrigatorioEhValido(
            descricao,
            TAMANHO_MAXIMO_DESCRICAO
        )
    ) {
        return {
            erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
        };
    }

    if (
        descricao.length <
        TAMANHO_MINIMO_DESCRICAO
    ) {
        return {
            erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
        };
    }

    return {
        descricao
    };
}

export async function cadastrarAlergia(
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

        const validacaoDescricao =
            obterDescricaoAlergia(
                req.body
            );

        if (validacaoDescricao.erro) {
            return responderErroValidacao(
                res,
                validacaoDescricao.erro
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

        const alergia = await criarAlergia({
            funcionario_matricula: matricula,
            descricao_alergia:
                validacaoDescricao.descricao
        });

        return res.status(201).json(
            alergia
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao cadastrar alergia:',
            erro
        );
    }
}

export async function buscarAlergiasFuncionario(
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

        const alergias =
            await buscarAlergiasPorFuncionario(
                matricula
            );

        return res.status(200).json(
            alergias
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar alergias:',
            erro
        );
    }
}

export async function deletarAlergia(
    req,
    res
) {
    try {
        const idAlergia = req.params.id;

        if (!identificadorEhValido(idAlergia)) {
            return responderErroValidacao(
                res,
                'O identificador da alergia é inválido.'
            );
        }

        const alergia =
            await buscarAlergiaService(
                Number(idAlergia)
            );

        if (!alergia) {
            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });
        }

        await deletarAlergiaService(
            alergia
        );

        return res.status(200).json({
            mensagem: 'Alergia excluída com sucesso.'
        });
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao excluir alergia:',
            erro
        );
    }
}