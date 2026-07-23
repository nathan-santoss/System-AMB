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


function normalizarTextoOpcional(valor) {

    if (valor === null || valor === undefined) {

        return null;

    }

    if (typeof valor !== 'string') {

        return valor;

    }

    const valorNormalizado = valor.trim();

    if (valorNormalizado.length === 0) {

        return null;

    }

    return valorNormalizado;

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


function normalizarCpf(valor) {

    if (typeof valor === 'number') {

        return String(valor).trim();

    }

    if (typeof valor === 'string') {

        return valor.replace(/\D/g, '').trim();

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


function nomeEhValido(nome) {

    if (typeof nome !== 'string') {

        return false;

    }

    if (nome.length < 2) {

        return false;

    }

    if (nome.length > 150) {

        return false;

    }

    return true;

}


function cpfEhValido(cpf) {

    if (typeof cpf !== 'string') {

        return false;

    }

    if (!/^\d{11}$/.test(cpf)) {

        return false;

    }

    return true;

}


function textoOpcionalEhValido(valor, tamanhoMaximo) {

    if (valor === null) {

        return true;

    }

    if (typeof valor !== 'string') {

        return false;

    }

    if (valor.length > tamanhoMaximo) {

        return false;

    }

    return true;

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
            erro: 'Os dados do funcionário são inválidos.',
            detalhes
        });

    }

    if (erro.name === 'SequelizeUniqueConstraintError') {

        return res.status(409).json({
            erro: 'Já existe um funcionário com os dados informados.'
        });

    }

    if (erro.name === 'SequelizeForeignKeyConstraintError') {

        return res.status(409).json({
            erro: 'O funcionário não pode ser excluído porque possui registros vinculados.'
        });

    }

    return res.status(500).json({
        erro: 'Ocorreu um erro interno no servidor.'
    });

}


// Cadastrar funcionário
export async function cadastrarFuncionario(req, res) {

    try {

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'matricula',
            'nome',
            'cpf',
            'cargo',
            'setor',
            'nucleo',
            'supervisor',
            'coordenador',
            'gerente'
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

        const matricula = normalizarMatricula(
            req.body.matricula
        );

        const nome = normalizarTexto(
            req.body.nome
        );

        const cpf = normalizarCpf(
            req.body.cpf
        );

        const cargo = normalizarTextoOpcional(
            req.body.cargo
        );

        const setor = normalizarTextoOpcional(
            req.body.setor
        );

        const nucleo = normalizarTextoOpcional(
            req.body.nucleo
        );

        const supervisor = normalizarTextoOpcional(
            req.body.supervisor
        );

        const coordenador = normalizarTextoOpcional(
            req.body.coordenador
        );

        const gerente = normalizarTextoOpcional(
            req.body.gerente
        );

        if (!matriculaEhValida(matricula)) {

            return res.status(400).json({
                erro: 'A matrícula é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        if (!nomeEhValido(nome)) {

            return res.status(400).json({
                erro: 'O nome é obrigatório e deve possuir entre 2 e 150 caracteres.'
            });

        }

        if (!cpfEhValido(cpf)) {

            return res.status(400).json({
                erro: 'O CPF é obrigatório e deve possuir exatamente 11 números.'
            });

        }

        if (!textoOpcionalEhValido(cargo, 100)) {

            return res.status(400).json({
                erro: 'O cargo deve possuir no máximo 100 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(setor, 100)) {

            return res.status(400).json({
                erro: 'O setor deve possuir no máximo 100 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(nucleo, 100)) {

            return res.status(400).json({
                erro: 'O núcleo deve possuir no máximo 100 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(supervisor, 100)) {

            return res.status(400).json({
                erro: 'O supervisor deve possuir no máximo 100 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(coordenador, 100)) {

            return res.status(400).json({
                erro: 'O coordenador deve possuir no máximo 100 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(gerente, 100)) {

            return res.status(400).json({
                erro: 'O gerente deve possuir no máximo 100 caracteres.'
            });

        }

        const funcionarioExistente = await Funcionario.findByPk(
            matricula
        );

        if (funcionarioExistente) {

            return res.status(409).json({
                erro: 'Já existe um funcionário com esta matrícula.'
            });

        }

        const novoFuncionario = await Funcionario.create({
            matricula,
            nome,
            cpf,
            cargo,
            setor,
            nucleo,
            supervisor,
            coordenador,
            gerente
        });

        return res.status(201).json(novoFuncionario);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao cadastrar funcionário:',
            erro
        );

    }

}


// Buscar todos os funcionários
export async function buscarFuncionarios(req, res) {

    try {

        const funcionarios = await Funcionario.findAll({
            order: [
                [
                    'nome',
                    'ASC'
                ]
            ]
        });

        return res.status(200).json(funcionarios);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao buscar funcionários:',
            erro
        );

    }

}


// Buscar funcionário pela matrícula
export async function buscarFuncionarioPorMatricula(req, res) {

    try {

        const matricula = normalizarMatricula(
            req.params.matricula
        );

        if (!matriculaEhValida(matricula)) {

            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });

        }

        const funcionario = await Funcionario.findByPk(
            matricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        return res.status(200).json(funcionario);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao buscar funcionário pela matrícula:',
            erro
        );

    }

}


// Atualizar funcionário
export async function atualizarFuncionario(req, res) {

    try {

        const matricula = normalizarMatricula(
            req.params.matricula
        );

        if (!matriculaEhValida(matricula)) {

            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });

        }

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'nome',
            'cpf',
            'cargo',
            'setor',
            'nucleo',
            'supervisor',
            'coordenador',
            'gerente'
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

        const funcionario = await Funcionario.findByPk(
            matricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        const dadosParaAtualizar = {};

        if (campoFoiEnviado(req.body, 'nome')) {

            const nome = normalizarTexto(
                req.body.nome
            );

            if (!nomeEhValido(nome)) {

                return res.status(400).json({
                    erro: 'O nome deve possuir entre 2 e 150 caracteres.'
                });

            }

            dadosParaAtualizar.nome = nome;

        }

        if (campoFoiEnviado(req.body, 'cpf')) {

            const cpf = normalizarCpf(
                req.body.cpf
            );

            if (!cpfEhValido(cpf)) {

                return res.status(400).json({
                    erro: 'O CPF deve possuir exatamente 11 números.'
                });

            }

            dadosParaAtualizar.cpf = cpf;

        }

        if (campoFoiEnviado(req.body, 'cargo')) {

            const cargo = normalizarTextoOpcional(
                req.body.cargo
            );

            if (!textoOpcionalEhValido(cargo, 100)) {

                return res.status(400).json({
                    erro: 'O cargo deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.cargo = cargo;

        }

        if (campoFoiEnviado(req.body, 'setor')) {

            const setor = normalizarTextoOpcional(
                req.body.setor
            );

            if (!textoOpcionalEhValido(setor, 100)) {

                return res.status(400).json({
                    erro: 'O setor deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.setor = setor;

        }

        if (campoFoiEnviado(req.body, 'nucleo')) {

            const nucleo = normalizarTextoOpcional(
                req.body.nucleo
            );

            if (!textoOpcionalEhValido(nucleo, 100)) {

                return res.status(400).json({
                    erro: 'O núcleo deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.nucleo = nucleo;

        }

        if (campoFoiEnviado(req.body, 'supervisor')) {

            const supervisor = normalizarTextoOpcional(
                req.body.supervisor
            );

            if (!textoOpcionalEhValido(supervisor, 100)) {

                return res.status(400).json({
                    erro: 'O supervisor deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.supervisor = supervisor;

        }

        if (campoFoiEnviado(req.body, 'coordenador')) {

            const coordenador = normalizarTextoOpcional(
                req.body.coordenador
            );

            if (!textoOpcionalEhValido(coordenador, 100)) {

                return res.status(400).json({
                    erro: 'O coordenador deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.coordenador = coordenador;

        }

        if (campoFoiEnviado(req.body, 'gerente')) {

            const gerente = normalizarTextoOpcional(
                req.body.gerente
            );

            if (!textoOpcionalEhValido(gerente, 100)) {

                return res.status(400).json({
                    erro: 'O gerente deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.gerente = gerente;

        }

        if (Object.keys(dadosParaAtualizar).length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo válido para atualização.'
            });

        }

        await funcionario.update(
            dadosParaAtualizar
        );

        return res.status(200).json(funcionario);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao atualizar funcionário:',
            erro
        );

    }

}


// Deletar funcionário
export async function deletarFuncionario(req, res) {

    try {

        const matricula = normalizarMatricula(
            req.params.matricula
        );

        if (!matriculaEhValida(matricula)) {

            return res.status(400).json({
                erro: 'A matrícula informada é inválida.'
            });

        }

        const funcionario = await Funcionario.findByPk(
            matricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        await funcionario.destroy();

        return res.status(204).send();

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao deletar funcionário:',
            erro
        );

    }

}