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
        // Eu pego a matrícula do funcionário que veio na requisição (pode ser na URL ou como parâmetro).
        const funcionarioMatricula = obterMatriculaDaRequisicao(
            req
        );

        // Valido se a matrícula é um dado aceitável.
        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        // Eu busco pelo funcionário no banco de dados para garantir que ele existe.
        const funcionario = await buscarFuncionarioPorMatricula(
            funcionarioMatricula
        );

        // Se o funcionário não for encontrado, eu retorno um erro.
        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        // Agora, eu busco todas as alergias associadas a essa matrícula.
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

        // E retorno a lista de alergias que encontrei.
        return res.status(200).json(alergias);

    } catch (erro) {

        // Se algo der errado, eu lido com o erro.
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
        // Primeiro, eu verifico se o corpo da requisição é um objeto JSON válido.
        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        // Eu defino quais campos são permitidos para evitar que dados indesejados sejam enviados.
        const camposPermitidos = [
            'descricao_alergia',
            'funcionario_matricula'
        ];

        const camposRecebidos = Object.keys(req.body);

        const camposNaoPermitidos = camposRecebidos.filter(campo => {
            // Verifico se a requisição contém algum campo que não é permitido.

            return !camposPermitidos.includes(campo);

        });

        if (camposNaoPermitidos.length > 0) {

            return res.status(400).json({
                erro: 'A requisição contém campos não permitidos.',
                camposNaoPermitidos
            });

        }

        // Eu normalizo a descrição da alergia e a matrícula do funcionário.
        const descricaoAlergia = normalizarTexto(
            req.body.descricao_alergia
        );

        const funcionarioMatricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        // Valido se a descrição da alergia tem um formato correto.
        if (!descricaoEhValida(descricaoAlergia)) {

            return res.status(400).json({
                erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
            });

        }

        // E também valido a matrícula do funcionário.
        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        // Eu busco pelo funcionário no banco de dados para garantir que ele existe.
        const funcionario = await buscarFuncionarioPorMatricula(
            funcionarioMatricula
        );

        // Se o funcionário não for encontrado, eu retorno um erro.
        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        // Verifico se essa mesma alergia já não está cadastrada para este funcionário.
        const alergiaExistente = await Alergia.findOne({
            where: {
                funcionario_matricula: funcionarioMatricula,
                descricao_alergia: descricaoAlergia
            }
        });

        // Se já existir, eu informo que não é possível cadastrar novamente.
        if (alergiaExistente) {

            return res.status(409).json({
                erro: 'Esta alergia já está cadastrada para o funcionário.'
            });

        }

        // Com tudo validado, eu crio a nova alergia no banco de dados.
        const novaAlergia = await Alergia.create({
            funcionario_matricula: funcionarioMatricula,
            descricao_alergia: descricaoAlergia
        });

        // Se tudo der certo, eu retorno a alergia que foi criada.
        return res.status(201).json(novaAlergia);

    } catch (erro) {

        // Se algo der errado durante o processo, eu capturo o erro e envio uma resposta adequada.
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
        // Eu pego o ID da alergia que veio como parâmetro na URL.
        const id = req.params.id;

        // Verifico se o ID é um número válido e positivo.
        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador da alergia é inválido.'
            });

        }

        // Verifico se recebi um objeto JSON válido no corpo da requisição.
        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        // Eu defino quais campos podem ser atualizados.
        const camposPermitidos = [
            'descricao_alergia',
            'funcionario_matricula'
        ];

        const camposRecebidos = Object.keys(req.body);

        if (camposRecebidos.length === 0) {
            // Se nenhum campo for enviado, eu peço para que pelo menos um seja informado.

            return res.status(400).json({
                erro: 'Informe ao menos um campo para atualização.'
            });

        }

        // Verifico se a requisição contém algum campo que não pode ser atualizado.
        const camposNaoPermitidos = camposRecebidos.filter(campo => {

            return !camposPermitidos.includes(campo);

        });

        if (camposNaoPermitidos.length > 0) {

            return res.status(400).json({
                erro: 'A requisição contém campos que não podem ser atualizados.',
                camposNaoPermitidos
            });

        }

        // Eu busco a alergia que será atualizada para garantir que ela existe.
        const alergia = await Alergia.findByPk(
            Number(id)
        );

        // Se não existir, eu retorno um erro 404.
        if (!alergia) {

            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });

        }

        // Preparo um objeto para guardar os dados que serão atualizados.
        const dadosParaAtualizar = {};

        let descricaoFinal = alergia.descricao_alergia;
        let matriculaFinal = alergia.funcionario_matricula;

        if (campoFoiEnviado(req.body, 'descricao_alergia')) {
            // Se a descrição foi enviada, eu a normalizo e valido.

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
            // Se a matrícula foi enviada, eu a normalizo e valido.

            const funcionarioMatricula = normalizarMatricula(
                req.body.funcionario_matricula
            );

            if (!matriculaEhValida(funcionarioMatricula)) {

                return res.status(400).json({
                    erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
                });

            }

            // Verifico se o novo funcionário associado realmente existe.
            const funcionario = await buscarFuncionarioPorMatricula(
                funcionarioMatricula
            );

            // Se não existir, eu retorno um erro.
            if (!funcionario) {

                return res.status(404).json({
                    erro: 'Funcionário não encontrado.'
                });

            }

            dadosParaAtualizar.funcionario_matricula = funcionarioMatricula;
            matriculaFinal = funcionarioMatricula;

        }

        // Se, após as validações, nenhum dado válido foi enviado, eu informo o usuário.
        if (Object.keys(dadosParaAtualizar).length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo válido para atualização.'
            });

        }

        // Verifico se a atualização não vai criar uma alergia duplicada para o mesmo funcionário.
        const alergiaDuplicada = await Alergia.findOne({
            where: {
                funcionario_matricula: matriculaFinal,
                descricao_alergia: descricaoFinal
            }
        });

        // Se a alergia já existe e não é a mesma que estou atualizando, eu retorno um erro.
        if (alergiaDuplicada) {

            if (alergiaDuplicada.id_alergia !== alergia.id_alergia) {

                return res.status(409).json({
                    erro: 'Esta alergia já está cadastrada para o funcionário.'
                });

            }

        }

        // Chamo o serviço que vai de fato atualizar os dados da alergia no banco.
        await alergia.update(
            dadosParaAtualizar
        );

        // Retorno a alergia com os dados atualizados.
        return res.status(200).json(alergia);

    } catch (erro) {

        // Trato qualquer erro que possa acontecer durante a atualização.
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
        // Pego o ID da alergia que quero deletar a partir da URL.
        const id = req.params.id;

        // Faço a validação do ID.
        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador da alergia é inválido.'
            });

        }

        // Busco a alergia no banco de dados.
        const alergia = await Alergia.findByPk(
            Number(id)
        );

        // Se a alergia não for encontrada, eu informo.
        if (!alergia) {

            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });

        }

        // Se encontrei, eu a removo do banco de dados.
        await alergia.destroy();

        // Retorno uma resposta de sucesso, sem conteúdo.
        return res.status(204).send();

    } catch (erro) {

        // Se ocorrer algum erro, eu o trato.
        return responderErroInterno(
            res,
            'Erro ao deletar alergia:',
            erro
        );

    }

}