import Atestado from '../models/atestados.js';
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

    if (valor === null) {

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


function matriculaEhValida(matricula) {

    if (typeof matricula !== 'string') {

        return false;

    }

    if (matricula.length === 0) {

        return false;

    }

    if (matricula.length > 20) {

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


function dataEhValida(valor) {

    if (typeof valor !== 'string') {

        return false;

    }

    const dataNormalizada = valor.trim();

    if (dataNormalizada.length === 0) {

        return false;

    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada)) {

        return false;

    }

    const partesData = dataNormalizada.split('-');

    const ano = Number(partesData[0]);
    const mes = Number(partesData[1]);
    const dia = Number(partesData[2]);

    const dataConvertida = new Date(
        ano,
        mes - 1,
        dia
    );

    if (dataConvertida.getFullYear() !== ano) {

        return false;

    }

    if (dataConvertida.getMonth() !== mes - 1) {

        return false;

    }

    if (dataConvertida.getDate() !== dia) {

        return false;

    }

    return true;

}


function quantidadeEhValida(valor) {

    let quantidade = valor;

    if (typeof quantidade === 'string') {

        const quantidadeNormalizada = quantidade.trim();

        if (quantidadeNormalizada.length === 0) {

            return false;

        }

        quantidade = Number(quantidadeNormalizada);

    }

    if (typeof quantidade !== 'number') {

        return false;

    }

    if (!Number.isFinite(quantidade)) {

        return false;

    }

    if (!Number.isInteger(quantidade)) {

        return false;

    }

    if (quantidade <= 0) {

        return false;

    }

    return true;

}


function tipoAfastamentoEhValido(tipoAfastamento) {

    const tiposPermitidos = [
        'Doença',
        'Acidente',
        'Consulta',
        'Outro'
    ];

    if (typeof tipoAfastamento !== 'string') {

        return false;

    }

    if (!tiposPermitidos.includes(tipoAfastamento)) {

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


async function buscarFuncionario(matricula) {

    const funcionario = await Funcionario.findOne({
        where: {
            matricula
        },
        attributes: [
            'matricula',
            'nome',
            'supervisor',
            'coordenador',
            'gerente'
        ]
    });

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
            erro: 'Os dados do atestado são inválidos.',
            detalhes
        });

    }

    if (erro.name === 'SequelizeForeignKeyConstraintError') {

        return res.status(400).json({
            erro: 'O funcionário informado não existe.'
        });

    }

    return res.status(500).json({
        erro: 'Ocorreu um erro interno no servidor.'
    });

}


// Emitir um novo atestado
export async function emitirAtestado(req, res) {

    try {

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'funcionario_matricula',
            'data_emissao',
            'tipo_afastamento',
            'quantidade',
            'cid_codigo',
            'caminho_anexo'
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

        const funcionarioMatricula = normalizarMatricula(
            req.body.funcionario_matricula
        );

        const dataEmissao = normalizarTexto(
            req.body.data_emissao
        );

        const tipoAfastamento = normalizarTexto(
            req.body.tipo_afastamento
        );

        const quantidadeRecebida = req.body.quantidade;

        const cidCodigo = normalizarTextoOpcional(
            req.body.cid_codigo
        );

        const caminhoAnexo = normalizarTextoOpcional(
            req.body.caminho_anexo
        );

        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        if (!dataEhValida(dataEmissao)) {

            return res.status(400).json({
                erro: 'A data de emissão deve estar no formato AAAA-MM-DD e ser válida.'
            });

        }

        if (!tipoAfastamentoEhValido(tipoAfastamento)) {

            return res.status(400).json({
                erro: 'O tipo de afastamento deve ser Doença, Acidente, Consulta ou Outro.'
            });

        }

        if (!quantidadeEhValida(quantidadeRecebida)) {

            return res.status(400).json({
                erro: 'A quantidade deve ser um número inteiro maior que zero.'
            });

        }

        if (!textoOpcionalEhValido(cidCodigo, 20)) {

            return res.status(400).json({
                erro: 'O código CID deve ser um texto com no máximo 20 caracteres ou nulo.'
            });

        }

        if (!textoOpcionalEhValido(caminhoAnexo, 255)) {

            return res.status(400).json({
                erro: 'O caminho do anexo deve possuir no máximo 255 caracteres ou ser nulo.'
            });

        }

        const funcionario = await buscarFuncionario(
            funcionarioMatricula
        );

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        const novoAtestado = await Atestado.create({
            funcionario_matricula: funcionarioMatricula,
            data_emissao: dataEmissao,
            tipo_afastamento: tipoAfastamento,
            quantidade: Number(quantidadeRecebida),
            cid_codigo: cidCodigo,
            caminho_anexo: caminhoAnexo,
            supervisor_na_epoca: funcionario.supervisor,
            coordenador_na_epoca: funcionario.coordenador,
            gerente_na_epoca: funcionario.gerente
        });

        return res.status(201).json(novoAtestado);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao emitir atestado:',
            erro
        );

    }

}


// Buscar atestados por funcionário
export async function buscarAtestadosPorFuncionario(req, res) {

    try {

        const matricula = normalizarMatricula(
            req.params.matricula
        );

        if (!matriculaEhValida(matricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é inválida.'
            });

        }

        const funcionario = await buscarFuncionario(matricula);

        if (!funcionario) {

            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });

        }

        const atestados = await Atestado.findAll({
            where: {
                funcionario_matricula: matricula
            },
            order: [
                [
                    'data_emissao',
                    'DESC'
                ],
                [
                    'id_atestado',
                    'DESC'
                ]
            ]
        });

        return res.status(200).json(atestados);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao buscar atestados por funcionário:',
            erro
        );

    }

}


// Atualizar um atestado
export async function atualizarAtestado(req, res) {

    try {

        const { id } = req.params;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador do atestado é inválido.'
            });

        }

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'data_emissao',
            'tipo_afastamento',
            'quantidade',
            'cid_codigo',
            'caminho_anexo'
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

        const atestado = await Atestado.findByPk(id);

        if (!atestado) {

            return res.status(404).json({
                erro: 'Atestado não encontrado.'
            });

        }

        const dadosParaAtualizar = {};

        if (campoFoiEnviado(req.body, 'data_emissao')) {

            const dataEmissao = normalizarTexto(
                req.body.data_emissao
            );

            if (!dataEhValida(dataEmissao)) {

                return res.status(400).json({
                    erro: 'A data de emissão deve estar no formato AAAA-MM-DD e ser válida.'
                });

            }

            dadosParaAtualizar.data_emissao = dataEmissao;

        }

        if (campoFoiEnviado(req.body, 'tipo_afastamento')) {

            const tipoAfastamento = normalizarTexto(
                req.body.tipo_afastamento
            );

            if (!tipoAfastamentoEhValido(tipoAfastamento)) {

                return res.status(400).json({
                    erro: 'O tipo de afastamento deve ser Doença, Acidente, Consulta ou Outro.'
                });

            }

            dadosParaAtualizar.tipo_afastamento = tipoAfastamento;

        }

        if (campoFoiEnviado(req.body, 'quantidade')) {

            const quantidadeRecebida = req.body.quantidade;

            if (!quantidadeEhValida(quantidadeRecebida)) {

                return res.status(400).json({
                    erro: 'A quantidade deve ser um número inteiro maior que zero.'
                });

            }

            dadosParaAtualizar.quantidade = Number(
                quantidadeRecebida
            );

        }

        if (campoFoiEnviado(req.body, 'cid_codigo')) {

            const cidCodigo = normalizarTextoOpcional(
                req.body.cid_codigo
            );

            if (!textoOpcionalEhValido(cidCodigo, 20)) {

                return res.status(400).json({
                    erro: 'O código CID deve ser um texto com no máximo 20 caracteres ou nulo.'
                });

            }

            dadosParaAtualizar.cid_codigo = cidCodigo;

        }

        if (campoFoiEnviado(req.body, 'caminho_anexo')) {

            const caminhoAnexo = normalizarTextoOpcional(
                req.body.caminho_anexo
            );

            if (!textoOpcionalEhValido(caminhoAnexo, 255)) {

                return res.status(400).json({
                    erro: 'O caminho do anexo deve possuir no máximo 255 caracteres ou ser nulo.'
                });

            }

            dadosParaAtualizar.caminho_anexo = caminhoAnexo;

        }

        if (Object.keys(dadosParaAtualizar).length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo válido para atualização.'
            });

        }

        await atestado.update(dadosParaAtualizar);

        return res.status(200).json(atestado);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao atualizar atestado:',
            erro
        );

    }

}


// Deletar um atestado
export async function deletarAtestado(req, res) {

    try {

        const { id } = req.params;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador do atestado é inválido.'
            });

        }

        const atestado = await Atestado.findByPk(id);

        if (!atestado) {

            return res.status(404).json({
                erro: 'Atestado não encontrado.'
            });

        }

        await atestado.destroy();

        return res.status(204).send();

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao deletar atestado:',
            erro
        );

    }

}