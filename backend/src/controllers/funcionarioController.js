import {
    criarFuncionario,
    buscarTodosFuncionarios,
    buscarFuncionarioPorMatricula as buscarFuncionarioService,
    atualizarFuncionario as atualizarFuncionarioService,
    deletarFuncionario as deletarFuncionarioService
} from '../services/funcionarioService.js';

import {
    normalizarTexto,
    normalizarTextoOpcional,
    normalizarMatricula,
    normalizarCpf
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    campoFoiEnviado,
    matriculaEhValida,
    cpfEhValido,
    buscaEhValida,
    textoObrigatorioEhValido,
    textoOpcionalEhValido
} from '../utils/validadores.js';

import {
    responderErroInterno
} from '../utils/respostas.js';

const TAMANHO_MAXIMO_NOME = 150;
const TAMANHO_MAXIMO_CAMPO_OPCIONAL = 150;

const CAMPOS_OPCIONAIS = [
    'cargo',
    'setor',
    'nucleo',
    'supervisor',
    'coordenador',
    'gerente'
];

function responderErroValidacao(
    res,
    mensagem
) {
    return res.status(400).json({
        erro: mensagem
    });
}

function validarNome(nome) {
    if (
        !textoObrigatorioEhValido(
            nome,
            TAMANHO_MAXIMO_NOME
        )
    ) {
        return false;
    }

    if (nome.length < 2) {
        return false;
    }

    return true;
}

function obterTermoBusca(req) {
    if (!req.query) {
        return '';
    }

    if (typeof req.query.busca !== 'string') {
        if (req.query.busca === undefined) {
            return '';
        }

        return req.query.busca;
    }

    return req.query.busca.trim();
}

function montarDadosFuncionario(corpo) {
    return {
        matricula: normalizarMatricula(
            corpo.matricula
        ),

        nome: normalizarTexto(
            corpo.nome
        ),

        cpf: normalizarCpf(
            corpo.cpf
        ),

        cargo: normalizarTextoOpcional(
            corpo.cargo
        ),

        setor: normalizarTextoOpcional(
            corpo.setor
        ),

        nucleo: normalizarTextoOpcional(
            corpo.nucleo
        ),

        supervisor: normalizarTextoOpcional(
            corpo.supervisor
        ),

        coordenador: normalizarTextoOpcional(
            corpo.coordenador
        ),

        gerente: normalizarTextoOpcional(
            corpo.gerente
        )
    };
}

function validarCamposOpcionais(dados) {
    for (const campo of CAMPOS_OPCIONAIS) {
        if (
            !textoOpcionalEhValido(
                dados[campo],
                TAMANHO_MAXIMO_CAMPO_OPCIONAL
            )
        ) {
            return `O campo ${campo} deve possuir no máximo 150 caracteres.`;
        }
    }

    return null;
}

function montarDadosAtualizacao(corpo) {
    const dadosAtualizacao = {};

    if (
        campoFoiEnviado(
            corpo,
            'nome'
        )
    ) {
        dadosAtualizacao.nome = normalizarTexto(
            corpo.nome
        );
    }

    if (
        campoFoiEnviado(
            corpo,
            'cpf'
        )
    ) {
        dadosAtualizacao.cpf = normalizarCpf(
            corpo.cpf
        );
    }

    for (const campo of CAMPOS_OPCIONAIS) {
        if (
            campoFoiEnviado(
                corpo,
                campo
            )
        ) {
            dadosAtualizacao[campo] =
                normalizarTextoOpcional(
                    corpo[campo]
                );
        }
    }

    return dadosAtualizacao;
}

export async function cadastrarFuncionario(
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

        const dadosFuncionario =
            montarDadosFuncionario(
                req.body
            );

        if (
            !matriculaEhValida(
                dadosFuncionario.matricula
            )
        ) {
            return responderErroValidacao(
                res,
                'A matrícula é obrigatória e deve possuir até 20 caracteres.'
            );
        }

        if (
            !validarNome(
                dadosFuncionario.nome
            )
        ) {
            return responderErroValidacao(
                res,
                'O nome é obrigatório e deve possuir entre 2 e 150 caracteres.'
            );
        }

        if (
            !cpfEhValido(
                dadosFuncionario.cpf
            )
        ) {
            return responderErroValidacao(
                res,
                'O CPF deve possuir exatamente 11 números.'
            );
        }

        const erroCamposOpcionais =
            validarCamposOpcionais(
                dadosFuncionario
            );

        if (erroCamposOpcionais !== null) {
            return responderErroValidacao(
                res,
                erroCamposOpcionais
            );
        }

        const funcionario =
            await criarFuncionario(
                dadosFuncionario
            );

        return res.status(201).json(
            funcionario
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao cadastrar funcionário:',
            erro
        );
    }
}

export async function buscarFuncionarios(
    req,
    res
) {
    try {
        const busca = obterTermoBusca(
            req
        );

        if (!buscaEhValida(busca)) {
            return responderErroValidacao(
                res,
                'O termo de busca é inválido.'
            );
        }

        const funcionarios =
            await buscarTodosFuncionarios({
                busca
            });

        return res.status(200).json(
            funcionarios
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar funcionários:',
            erro
        );
    }
}

export async function buscarFuncionarioPorMatricula(
    req,
    res
) {
    try {
        const matricula =
            normalizarMatricula(
                req.params.matricula
            );

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula informada é inválida.'
            );
        }

        const funcionario =
            await buscarFuncionarioService(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        return res.status(200).json(
            funcionario
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao buscar funcionário:',
            erro
        );
    }
}

export async function atualizarFuncionario(
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

        const matricula =
            normalizarMatricula(
                req.params.matricula
            );

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula informada é inválida.'
            );
        }

        const funcionario =
            await buscarFuncionarioService(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        const dadosAtualizacao =
            montarDadosAtualizacao(
                req.body
            );

        if (
            Object.keys(
                dadosAtualizacao
            ).length === 0
        ) {
            return responderErroValidacao(
                res,
                'Nenhum campo válido foi enviado para atualização.'
            );
        }

        if (
            campoFoiEnviado(
                dadosAtualizacao,
                'nome'
            )
        ) {
            if (
                !validarNome(
                    dadosAtualizacao.nome
                )
            ) {
                return responderErroValidacao(
                    res,
                    'O nome deve possuir entre 2 e 150 caracteres.'
                );
            }
        }

        if (
            campoFoiEnviado(
                dadosAtualizacao,
                'cpf'
            )
        ) {
            if (
                !cpfEhValido(
                    dadosAtualizacao.cpf
                )
            ) {
                return responderErroValidacao(
                    res,
                    'O CPF deve possuir exatamente 11 números.'
                );
            }
        }

        const erroCamposOpcionais =
            validarCamposOpcionais(
                dadosAtualizacao
            );

        if (erroCamposOpcionais !== null) {
            return responderErroValidacao(
                res,
                erroCamposOpcionais
            );
        }

        const funcionarioAtualizado =
            await atualizarFuncionarioService(
                funcionario,
                dadosAtualizacao
            );

        return res.status(200).json(
            funcionarioAtualizado
        );
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao atualizar funcionário:',
            erro
        );
    }
}

export async function deletarFuncionario(
    req,
    res
) {
    try {
        const matricula =
            normalizarMatricula(
                req.params.matricula
            );

        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula informada é inválida.'
            );
        }

        const funcionario =
            await buscarFuncionarioService(
                matricula
            );

        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        await deletarFuncionarioService(
            funcionario
        );

        return res.status(200).json({
            mensagem: 'Funcionário excluído com sucesso.'
        });
    } catch (erro) {
        return responderErroInterno(
            res,
            'Erro ao excluir funcionário:',
            erro
        );
    }
}