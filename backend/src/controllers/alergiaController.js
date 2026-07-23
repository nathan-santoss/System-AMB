import Alergia from '../models/alergias.js';
import Funcionario from '../models/funcionarios.js';


function corpoEhObjetoValido(corpo) {

    if (!corpo) {

        return false;

    }

    if (typeof corpo !== 'object') {

        return false;

    }

    if (Array.isArray(corpo)) {

        return false;

    }

    return true;

}


function campoFoiEnviado(objeto, campo) {

    return Object.prototype.hasOwnProperty.call(
        objeto,
        campo
    );

}


function normalizarTexto(valor) {

    if (typeof valor !== 'string') {

        return valor;

    }

    return valor.trim();

}


function normalizarMatricula(valor) {

    if (typeof valor === 'number') {

        return String(valor).trim();

    }

    if (typeof valor === 'string') {

        return valor.trim();

    }

    return valor;

}


function matriculaEhValida(matricula) {

    if (typeof matricula !== 'string') {

        return false;

    }

    if (matricula.length < 1) {

        return false;

    }

    if (matricula.length > 20) {

        return false;

    }

    return true;

}


function descricaoEhValida(descricao) {

    if (typeof descricao !== 'string') {

        return false;

    }

    if (descricao.length < 2) {

        return false;

    }

    if (descricao.length > 255) {

        return false;

    }

    return true;

}


function identificadorEhValido(id) {

    if (id === undefined || id === null) {

        return false;

    }

    const idNormalizado = String(id).trim();

    if (idNormalizado.length === 0) {

        return false;

    }

    if (!/^\d+$/.test(idNormalizado)) {

        return false;

    }

    const idNumerico = Number(idNormalizado);

    if (!Number.isSafeInteger(idNumerico)) {

        return false;

    }

    if (idNumerico <= 0) {

        return false;

    }

    return true;

}


function obterMatriculaDaRequisicao(req) {

    if (req.params) {

        if (req.params.matricula !== undefined) {

            return normalizarMatricula(
                req.params.matricula
            );

        }

    }

    if (req.query) {

        if (req.query.funcionario_matricula !== undefined) {

            return normalizarMatricula(
                req.query.funcionario_matricula
            );

        }

        if (req.query.matricula !== undefined) {

            return normalizarMatricula(
                req.query.matricula
            );

        }

    }

    return undefined;

}


async function buscarFuncionarioPorMatricula(matricula) {

    const funcionario = await Funcionario.findByPk(
        matricula,
        {
            attributes: [
                'matricula',
                'nome'
            ]
        }
    );

    return funcionario;

}


function responderErroInterno(res, mensagem, erro) {

    console.error(
        mensagem,
        erro
    );

    if (erro.name === 'SequelizeValidationError') {

        const detalhes = erro.errors.map(item => {

            return item.message;

        });

        return res.status(400).json({
            erro: 'Os dados da alergia são inválidos.',
            detalhes
        });

    }

    if (erro.name === 'SequelizeForeignKeyConstraintError') {

        return res.status(400).json({
            erro: 'O funcionário informado não existe.'
        });

    }

    if (erro.name === 'SequelizeUniqueConstraintError') {

        return res.status(409).json({
            erro: 'Esta alergia já está cadastrada para o funcionário.'
        });

    }

    return res.status(500).json({
        erro: 'Ocorreu um erro interno no servidor.'
    });

}


// Buscar alergias de um funcionário
export async function buscarAlergias(req, res) {

    try {

        const funcionarioMatricula = obterMatriculaDaRequisicao(
            req
        );

        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        const funcionario = await buscarFuncionarioPorMatricula(
            funcionarioMatricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        const alergias = await Alergia.findAll({
            where: {
                funcionario_matricula: funcionarioMatricula
            },
            order: [
                [
                    'id_alergia',
                    'ASC'
                ]
            ]
        });

        return res.status(200).json(alergias);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao buscar alergias:',
            erro
        );

    }

}


// Cadastrar uma nova alergia
export async function cadastrarAlergia(req, res) {

    try {

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'descricao_alergia',
            'funcionario_matricula'
        ];

        const camposRecebidos = Object.keys(req.body);

        const camposNaoPermitidos = camposRecebidos.filter(campo => {

            return !camposPermitidos.includes(campo);

        });

        if (camposNaoPermitidos.length > 0) {

            return res.status(400).json({
                erro: 'A requisição contém campos não permitidos.',
                camposNaoPermitidos
            });

        }

        const descricaoAlergia = normalizarTexto(
            req.body.descricao_alergia
        );

        const funcionarioMatricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        if (!descricaoEhValida(descricaoAlergia)) {

            return res.status(400).json({
                erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
            });

        }

        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        const funcionario = await buscarFuncionarioPorMatricula(
            funcionarioMatricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        const alergiaExistente = await Alergia.findOne({
            where: {
                funcionario_matricula: funcionarioMatricula,
                descricao_alergia: descricaoAlergia
            }
        });

        if (alergiaExistente) {

            return res.status(409).json({
                erro: 'Esta alergia já está cadastrada para o funcionário.'
            });

        }

        const novaAlergia = await Alergia.create({
            funcionario_matricula: funcionarioMatricula,
            descricao_alergia: descricaoAlergia
        });

        return res.status(201).json(novaAlergia);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao cadastrar alergia:',
            erro
        );

    }

}


// Atualizar uma alergia
export async function atualizarAlergia(req, res) {

    try {

        const id = req.params.id;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador da alergia é inválido.'
            });

        }

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'descricao_alergia',
            'funcionario_matricula'
        ];

        const camposRecebidos = Object.keys(req.body);

        if (camposRecebidos.length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo para atualização.'
            });

        }

        const camposNaoPermitidos = camposRecebidos.filter(campo => {

            return !camposPermitidos.includes(campo);

        });

        if (camposNaoPermitidos.length > 0) {

            return res.status(400).json({
                erro: 'A requisição contém campos que não podem ser atualizados.',
                camposNaoPermitidos
            });

        }

        const alergia = await Alergia.findByPk(
            Number(id)
        );

        if (!alergia) {

            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });

        }

        const dadosParaAtualizar = {};

        let descricaoFinal = alergia.descricao_alergia;
        let matriculaFinal = alergia.funcionario_matricula;

        if (campoFoiEnviado(req.body, 'descricao_alergia')) {

            const descricaoAlergia = normalizarTexto(
                req.body.descricao_alergia
            );

            if (!descricaoEhValida(descricaoAlergia)) {

                return res.status(400).json({
                    erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
                });

            }

            dadosParaAtualizar.descricao_alergia = descricaoAlergia;
            descricaoFinal = descricaoAlergia;

        }

        if (campoFoiEnviado(req.body, 'funcionario_matricula')) {

            const funcionarioMatricula = normalizarMatricula(
                req.body.funcionario_matricula
            );

            if (!matriculaEhValida(funcionarioMatricula)) {

                return res.status(400).json({
                    erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
                });

            }

            const funcionario = await buscarFuncionarioPorMatricula(
                funcionarioMatricula
            );

            if (!funcionario) {

                return res.status(404).json({
                    erro: 'Funcionário não encontrado.'
                });

            }

            dadosParaAtualizar.funcionario_matricula = funcionarioMatricula;
            matriculaFinal = funcionarioMatricula;

        }

        if (Object.keys(dadosParaAtualizar).length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo válido para atualização.'
            });

        }

        const alergiaDuplicada = await Alergia.findOne({
            where: {
                funcionario_matricula: matriculaFinal,
                descricao_alergia: descricaoFinal
            }
        });

        if (alergiaDuplicada) {

            if (alergiaDuplicada.id_alergia !== alergia.id_alergia) {

                return res.status(409).json({
                    erro: 'Esta alergia já está cadastrada para o funcionário.'
                });

            }

        }

        await alergia.update(
            dadosParaAtualizar
        );

        return res.status(200).json(alergia);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao atualizar alergia:',
            erro
        );

    }

}


// Deletar uma alergia
export async function deletarAlergia(req, res) {

    try {

        const id = req.params.id;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador da alergia é inválido.'
            });

        }

        const alergia = await Alergia.findByPk(
            Number(id)
        );

        if (!alergia) {

            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });

        }

        await alergia.destroy();

        return res.status(204).send();

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao deletar alergia:',
            erro
        );

    }

}