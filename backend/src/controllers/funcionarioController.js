import {
    criarFuncionario,
    buscarTodosFuncionarios,
    buscarFuncionarioPorMatricula as buscarFuncionarioService,
    atualizarFuncionario as atualizarFuncionarioService,
    deletarFuncionario as deletarFuncionarioService
} from '../services/funcionarioService.js';

import {
    buscarProntuarioFuncionario
} from '../services/prontuarioService.js';

import {
    normalizarTexto,
    normalizarTextoOpcional,
    normalizarMatricula,
    normalizarCpf
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    matriculaEhValida,
    cpfEhValido,
    buscaEhValida,
    textoOpcionalEhValido
} from '../utils/validadores.js';

import {
    responderErroInterno
} from '../utils/respostas.js';


export async function cadastrarFuncionario(req, res) {
    try {
        // Primeiro, eu verifico se o corpo da requisição é um objeto JSON válido.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Eu pego a matrícula, nome e CPF e os normalizo para um formato padrão.
        const matricula = normalizarMatricula(req.body.matricula);
        const nome = normalizarTexto(req.body.nome);
        const cpf = normalizarCpf(req.body.cpf);

        // Eu junto todos os dados do funcionário que recebi, normalizando os campos opcionais também.
        const dadosFuncionario = {
            matricula,
            nome,
            cpf,
            // Para os campos opcionais, eu uso uma normalização que aceita valores nulos ou vazios.
            cargo: normalizarTextoOpcional(req.body.cargo),
            setor: normalizarTextoOpcional(req.body.setor),
            nucleo: normalizarTextoOpcional(req.body.nucleo),
            supervisor: normalizarTextoOpcional(req.body.supervisor),
            coordenador: normalizarTextoOpcional(req.body.coordenador),
            gerente: normalizarTextoOpcional(req.body.gerente)
        };

        // Depois, eu valido se a matrícula está em um formato correto.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula é obrigatória e deve possuir até 20 caracteres.'
            });
        }

        // Também valido o CPF para garantir que ele tem o tamanho certo.
        if (!cpfEhValido(cpf)) {
            return res.status(400).json({
                erro: 'O CPF deve possuir exatamente 11 números.'
            });
        }

        // Com tudo validado, eu chamo o serviço para criar o novo funcionário no banco de dados.
        const funcionario = await criarFuncionario(
            dadosFuncionario
        );

        // Se tudo der certo, eu retorno o funcionário que foi criado.
        return res.status(201).json(funcionario);

    } catch (erro) {
        // Se algo der errado durante o processo, eu capturo o erro e envio uma resposta adequada.
        return responderErroInterno(
            res,
            'Erro ao cadastrar funcionário:',
            erro
        );
    }
}


export async function buscarFuncionarios(req, res) {
    try {
        // Eu pego o termo de busca que pode ter vindo na URL. Se não veio, uso uma string vazia.
        const busca = req.query.busca || '';

        // Valido se o termo de busca é aceitável.
        if (!buscaEhValida(busca)) {
            return res.status(400).json({
                erro: 'O termo de busca é inválido.'
            });
        }

        // Eu chamo o serviço que busca no banco de dados todos os funcionários que correspondem à busca.
        const funcionarios = await buscarTodosFuncionarios({
            busca
        });

        // E retorno a lista de funcionários que encontrei.
        return res.status(200).json(funcionarios);

    } catch (erro) {
        // Se houver erro, eu o capturo e respondo adequadamente.
        return responderErroInterno(
            res,
            'Erro ao buscar funcionários:',
            erro
        );
    }
}

export async function buscarFuncionarioPorMatricula(req, res) {
    try {
        // Eu pego a matrícula do funcionário que veio como parâmetro na URL e a normalizo.
        const matricula = normalizarMatricula(
            req.params.matricula
        );

        // Valido se a matrícula é um dado aceitável.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });
        }

        // Eu busco o funcionário específico no banco de dados usando a matrícula.
        const funcionario = await buscarFuncionarioService(
            matricula
        );

        // Se não encontrar, eu aviso que o funcionário não existe.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Se encontrar, eu retorno os dados do funcionário.
        return res.status(200).json(funcionario);

    } catch (erro) {
        // Se algo der errado, eu lido com o erro.
        return responderErroInterno(
            res,
            'Erro ao buscar funcionário:',
            erro
        );
    }
}



export async function buscarPerfilFuncionario(req, res) {
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

        // Eu busco o prontuário completo do funcionário, que inclui seus dados e histórico.
        const prontuario = await buscarProntuarioFuncionario(
            matricula
        );

        // Se não encontrar, eu aviso que o funcionário não existe.
        if (!prontuario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Se encontrar, eu retorno o prontuário completo.
        return res.status(200).json(prontuario);

    } catch (erro) {
        // Se algo der errado, eu lido com o erro.
        return responderErroInterno(
            res,
            'Erro ao buscar perfil do funcionário:',
            erro
        );
    }
}



export async function atualizarFuncionario(req, res) {
    try {
        // Verifico se recebi um objeto JSON válido no corpo da requisição.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Pego a matrícula do funcionário que veio na URL e a normalizo.
        const matricula = normalizarMatricula(
            req.params.matricula
        );

        // Valido se a matrícula é um identificador correto.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });
        }

        // Busco o funcionário que será atualizado para garantir que ele existe.
        const funcionario = await buscarFuncionarioService(
            matricula
        );

        // Se não existir, eu retorno um erro 404.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Preparo um objeto para guardar os dados que serão atualizados.
        const dadosAtualizacao = {};

        // Se o nome foi enviado na requisição, eu o normalizo e adiciono para atualização.
        if (req.body.nome !== undefined) {
            dadosAtualizacao.nome = normalizarTexto(
                req.body.nome
            );
        }

        // Se o CPF foi enviado, eu o normalizo, valido e adiciono para atualização.
        if (req.body.cpf !== undefined) {
            const cpf = normalizarCpf(
                req.body.cpf
            );

            if (!cpfEhValido(cpf)) {
                return res.status(400).json({
                    erro: 'O CPF deve possuir exatamente 11 números.'
                });
            }

            dadosAtualizacao.cpf = cpf;
        }

        // Eu defino uma lista de outros campos que também podem ser atualizados.
        const camposOpcionais = [
            'cargo',
            'setor',
            'nucleo',
            'supervisor',
            'coordenador',
            'gerente'
        ];

        // Eu passo por cada um desses campos opcionais.
        for (const campo of camposOpcionais) {
            if (req.body[campo] !== undefined) {
                const valor = normalizarTextoOpcional(
                    req.body[campo]
                );

                if (!textoOpcionalEhValido(valor, 150)) {
                    // Se o valor for inválido, eu retorno um erro.
                    return res.status(400).json({
                        erro: `O campo ${campo} possui tamanho inválido.`
                    });
                }

                dadosAtualizacao[campo] = valor;
            }
        }

        // Chamo o serviço que vai de fato atualizar os dados do funcionário no banco.
        const atualizado = await atualizarFuncionarioService(
            funcionario,
            dadosAtualizacao
        );

        // Retorno o funcionário com os dados atualizados.
        return res.status(200).json(atualizado);

    } catch (erro) {
        // Trato qualquer erro que possa acontecer durante a atualização.
        return responderErroInterno(
            res,
            'Erro ao atualizar funcionário:',
            erro
        );
    }
}

export async function deletarFuncionario(req, res) {
    try {
        // Pego a matrícula do funcionário que quero deletar a partir da URL e a normalizo.
        const matricula = normalizarMatricula(
            req.params.matricula
        );

        // Faço a validação da matrícula.
        if (!matriculaEhValida(matricula)) {
            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });
        }

        // Busco o funcionário no banco de dados.
        const funcionario = await buscarFuncionarioService(
            matricula
        );

        // Se o funcionário não for encontrado, eu informo.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Se encontrei, eu chamo o serviço para removê-lo do banco de dados.
        await deletarFuncionarioService(
            funcionario
        );

        // Retorno uma mensagem de sucesso.
        return res.status(200).json({
            mensagem: 'Funcionário excluído com sucesso.'
        });

    } catch (erro) {
        // Se ocorrer algum erro, eu o trato.
        return responderErroInterno(
            res,
            'Erro ao excluir funcionário:',
            erro
        );
    }
}