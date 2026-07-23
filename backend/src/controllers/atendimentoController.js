import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';
import { Op } from 'sequelize';


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

    if (matricula.length < 1) {

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


function gravidadeEhValida(gravidade) {

    const gravidadesPermitidas = [
        'Baixa',
        'Média',
        'Alta'
    ];

    if (typeof gravidade !== 'string') {

        return false;

    }

    if (!gravidadesPermitidas.includes(gravidade)) {

        return false;

    }

    return true;

}


function textoObrigatorioEhValido(valor, tamanhoMaximo) {

    if (typeof valor !== 'string') {

        return false;

    }

    if (valor.length === 0) {

        return false;

    }

    if (valor.length > tamanhoMaximo) {

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


function temperaturaEhValida(valor) {

    if (valor === null) {

        return true;

    }

    if (typeof valor === 'string') {

        const valorNormalizado = valor.trim();

        if (valorNormalizado.length === 0) {

            return true;

        }

        valor = Number(valorNormalizado);

    }

    if (typeof valor !== 'number') {

        return false;

    }

    if (!Number.isFinite(valor)) {

        return false;

    }

    if (valor < 0 || valor > 100) {

        return false;

    }

    return true;

}


function normalizarTemperatura(valor) {

    if (valor === null) {

        return null;

    }

    if (typeof valor === 'string') {

        const valorNormalizado = valor.trim();

        if (valorNormalizado.length === 0) {

            return null;

        }

        return Number(valorNormalizado);

    }

    return valor;

}


function dataOpcionalEhValida(valor) {

    if (valor === null) {

        return true;

    }

    if (typeof valor !== 'string') {

        return false;

    }

    const valorNormalizado = valor.trim();

    if (valorNormalizado.length === 0) {

        return true;

    }

    const dataConvertida = new Date(valorNormalizado);

    if (Number.isNaN(dataConvertida.getTime())) {

        return false;

    }

    return true;

}


function normalizarDataOpcional(valor) {

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

    return new Date(valorNormalizado);

}


async function buscarFuncionario(matricula) {

    const funcionario = await Funcionario.findOne({
        where: {
            matricula
        },
        attributes: [
            'matricula',
            'nome',
            'setor',
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
            erro: 'Os dados do atendimento são inválidos.',
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


// Buscar atendimentos por funcionário
export async function buscarAtendimentosPorFuncionario(req, res) {

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

        const atendimentos = await Atendimento.findAll({
            where: {
                funcionario_matricula: matricula
            },
            order: [
                [
                    'data_hora_entrada',
                    'DESC'
                ]
            ]
        });

        return res.status(200).json(atendimentos);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao buscar atendimentos por funcionário:',
            erro
        );

    }

}


// Registrar um novo atendimento
export async function registrarAtendimento(req, res) {

    try {

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'funcionario_matricula',
            'gravidade',
            'queixa_principal',
            'temperatura',
            'pressao_arterial',
            'acao_tomada',
            'local_encaminhamento',
            'data_hora_saida'
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

        const gravidade = normalizarTexto(
            req.body.gravidade
        );

        const queixaPrincipal = normalizarTexto(
            req.body.queixa_principal
        );

        const acaoTomada = normalizarTexto(
            req.body.acao_tomada
        );

        const temperatura = normalizarTemperatura(
            req.body.temperatura
        );

        const pressaoArterial = normalizarTextoOpcional(
            req.body.pressao_arterial
        );

        const localEncaminhamento = normalizarTextoOpcional(
            req.body.local_encaminhamento
        );

        const dataHoraSaida = normalizarDataOpcional(
            req.body.data_hora_saida
        );

        if (!matriculaEhValida(funcionarioMatricula)) {

            return res.status(400).json({
                erro: 'A matrícula do funcionário é obrigatória e deve possuir no máximo 20 caracteres.'
            });

        }

        if (!gravidadeEhValida(gravidade)) {

            return res.status(400).json({
                erro: 'A gravidade deve ser Baixa, Média ou Alta.'
            });

        }

        if (!textoObrigatorioEhValido(queixaPrincipal, 65535)) {

            return res.status(400).json({
                erro: 'A queixa principal é obrigatória.'
            });

        }

        if (!textoObrigatorioEhValido(acaoTomada, 100)) {

            return res.status(400).json({
                erro: 'A ação tomada é obrigatória e deve possuir no máximo 100 caracteres.'
            });

        }

        if (!temperaturaEhValida(temperatura)) {

            return res.status(400).json({
                erro: 'A temperatura deve ser um número entre 0 e 100.'
            });

        }

        if (!textoOpcionalEhValido(pressaoArterial, 20)) {

            return res.status(400).json({
                erro: 'A pressão arterial deve possuir no máximo 20 caracteres.'
            });

        }

        if (!textoOpcionalEhValido(localEncaminhamento, 100)) {

            return res.status(400).json({
                erro: 'O local de encaminhamento deve possuir no máximo 100 caracteres.'
            });

        }

        if (!dataOpcionalEhValida(req.body.data_hora_saida)) {

            return res.status(400).json({
                erro: 'A data e hora de saída são inválidas.'
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

        const novoAtendimento = await Atendimento.create({
            funcionario_matricula: funcionarioMatricula,
            gravidade,
            queixa_principal: queixaPrincipal,
            temperatura,
            pressao_arterial: pressaoArterial,
            acao_tomada: acaoTomada,
            local_encaminhamento: localEncaminhamento,
            supervisor_na_epoca: funcionario.supervisor,
            coordenador_na_epoca: funcionario.coordenador,
            gerente_na_epoca: funcionario.gerente,
            data_hora_saida: dataHoraSaida
        });

        return res.status(201).json(novoAtendimento);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao registrar atendimento:',
            erro
        );

    }

}


// Atualizar um atendimento
export async function atualizarAtendimento(req, res) {

    try {

        const { id } = req.params;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador do atendimento é inválido.'
            });

        }

        if (!corpoEhObjetoValido(req.body)) {

            return res.status(400).json({
                erro: 'O corpo da requisição deve ser um objeto JSON válido.'
            });

        }

        const camposPermitidos = [
            'gravidade',
            'queixa_principal',
            'temperatura',
            'pressao_arterial',
            'acao_tomada',
            'local_encaminhamento',
            'data_hora_saida'
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

        const atendimento = await Atendimento.findByPk(id);

        if (!atendimento) {

            return res.status(404).json({
                erro: 'Atendimento não encontrado.'
            });

        }

        const dadosParaAtualizar = {};

        if (campoFoiEnviado(req.body, 'gravidade')) {

            const gravidade = normalizarTexto(
                req.body.gravidade
            );

            if (!gravidadeEhValida(gravidade)) {

                return res.status(400).json({
                    erro: 'A gravidade deve ser Baixa, Média ou Alta.'
                });

            }

            dadosParaAtualizar.gravidade = gravidade;

        }

        if (campoFoiEnviado(req.body, 'queixa_principal')) {

            const queixaPrincipal = normalizarTexto(
                req.body.queixa_principal
            );

            if (!textoObrigatorioEhValido(queixaPrincipal, 65535)) {

                return res.status(400).json({
                    erro: 'A queixa principal não pode ficar vazia.'
                });

            }

            dadosParaAtualizar.queixa_principal = queixaPrincipal;

        }

        if (campoFoiEnviado(req.body, 'temperatura')) {

            const temperatura = normalizarTemperatura(
                req.body.temperatura
            );

            if (!temperaturaEhValida(temperatura)) {

                return res.status(400).json({
                    erro: 'A temperatura deve ser um número entre 0 e 100.'
                });

            }

            dadosParaAtualizar.temperatura = temperatura;

        }

        if (campoFoiEnviado(req.body, 'pressao_arterial')) {

            const pressaoArterial = normalizarTextoOpcional(
                req.body.pressao_arterial
            );

            if (!textoOpcionalEhValido(pressaoArterial, 20)) {

                return res.status(400).json({
                    erro: 'A pressão arterial deve possuir no máximo 20 caracteres.'
                });

            }

            dadosParaAtualizar.pressao_arterial = pressaoArterial;

        }

        if (campoFoiEnviado(req.body, 'acao_tomada')) {

            const acaoTomada = normalizarTexto(
                req.body.acao_tomada
            );

            if (!textoObrigatorioEhValido(acaoTomada, 100)) {

                return res.status(400).json({
                    erro: 'A ação tomada não pode ficar vazia e deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.acao_tomada = acaoTomada;

        }

        if (campoFoiEnviado(req.body, 'local_encaminhamento')) {

            const localEncaminhamento = normalizarTextoOpcional(
                req.body.local_encaminhamento
            );

            if (!textoOpcionalEhValido(localEncaminhamento, 100)) {

                return res.status(400).json({
                    erro: 'O local de encaminhamento deve possuir no máximo 100 caracteres.'
                });

            }

            dadosParaAtualizar.local_encaminhamento = localEncaminhamento;

        }

        if (campoFoiEnviado(req.body, 'data_hora_saida')) {

            if (!dataOpcionalEhValida(req.body.data_hora_saida)) {

                return res.status(400).json({
                    erro: 'A data e hora de saída são inválidas.'
                });

            }

            dadosParaAtualizar.data_hora_saida = normalizarDataOpcional(
                req.body.data_hora_saida
            );

        }

        if (Object.keys(dadosParaAtualizar).length === 0) {

            return res.status(400).json({
                erro: 'Informe ao menos um campo válido para atualização.'
            });

        }

        await atendimento.update(dadosParaAtualizar);

        return res.status(200).json(atendimento);

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao atualizar atendimento:',
            erro
        );

    }

}


// Deletar um atendimento
export async function deletarAtendimento(req, res) {

    try {

        const { id } = req.params;

        if (!identificadorEhValido(id)) {

            return res.status(400).json({
                erro: 'O identificador do atendimento é inválido.'
            });

        }

        const atendimento = await Atendimento.findByPk(id);

        if (!atendimento) {

            return res.status(404).json({
                erro: 'Atendimento não encontrado.'
            });

        }

        await atendimento.destroy();

        return res.status(204).send();

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao deletar atendimento:',
            erro
        );

    }

}


// Obter dados compilados para o dashboard
export async function obterDadosDashboard(req, res) {

    try {

        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        const fimDia = new Date();
        fimDia.setHours(23, 59, 59, 999);

        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const fimMes = new Date();
        fimMes.setMonth(fimMes.getMonth() + 1);
        fimMes.setDate(0);
        fimMes.setHours(23, 59, 59, 999);

        const totalHoje = await Atendimento.count({
            where: {
                data_hora_entrada: {
                    [Op.between]: [
                        inicioDia,
                        fimDia
                    ]
                }
            }
        });

        const baixa = await Atendimento.count({
            where: {
                gravidade: 'Baixa',
                data_hora_entrada: {
                    [Op.between]: [
                        inicioDia,
                        fimDia
                    ]
                }
            }
        });

        const media = await Atendimento.count({
            where: {
                gravidade: 'Média',
                data_hora_entrada: {
                    [Op.between]: [
                        inicioDia,
                        fimDia
                    ]
                }
            }
        });

        const alta = await Atendimento.count({
            where: {
                gravidade: 'Alta',
                data_hora_entrada: {
                    [Op.between]: [
                        inicioDia,
                        fimDia
                    ]
                }
            }
        });

        const atendimentosMes = await Atendimento.findAll({
            where: {
                data_hora_entrada: {
                    [Op.between]: [
                        inicioMes,
                        fimMes
                    ]
                }
            },
            attributes: [
                'funcionario_matricula'
            ]
        });

        const ultimosAtendimentosRaw = await Atendimento.findAll({
            limit: 5,
            order: [
                [
                    'data_hora_entrada',
                    'DESC'
                ]
            ]
        });

        const todasMatriculas = [
            ...new Set([
                ...atendimentosMes.map(atendimento => {

                    return atendimento.funcionario_matricula;

                }),
                ...ultimosAtendimentosRaw.map(atendimento => {

                    return atendimento.funcionario_matricula;

                })
            ])
        ];

        let funcionarios = [];

        if (todasMatriculas.length > 0) {

            funcionarios = await Funcionario.findAll({
                where: {
                    matricula: {
                        [Op.in]: todasMatriculas
                    }
                },
                attributes: [
                    'matricula',
                    'nome',
                    'setor'
                ]
            });

        }

        const mapaFuncionarios = {};

        funcionarios.forEach(funcionario => {

            mapaFuncionarios[funcionario.matricula] = {
                nome: funcionario.nome,
                setor: funcionario.setor
            };

        });

        const setoresContagem = {};

        atendimentosMes.forEach(atendimento => {

            const funcionario = mapaFuncionarios[
                atendimento.funcionario_matricula
            ];

            let nomeSetor = 'Não Informado';

            if (funcionario) {

                if (funcionario.setor) {

                    nomeSetor = funcionario.setor;

                }

            }

            if (setoresContagem[nomeSetor]) {

                setoresContagem[nomeSetor] += 1;

            } else {

                setoresContagem[nomeSetor] = 1;

            }

        });

        const atendimentosPorSetor = Object.keys(setoresContagem)
            .map(setor => {

                return {
                    setor,
                    quantidade: setoresContagem[setor]
                };

            })
            .sort((primeiro, segundo) => {

                return segundo.quantidade - primeiro.quantidade;

            });

        const ultimosAtendimentos = ultimosAtendimentosRaw.map(
            atendimento => {

                const funcionario = mapaFuncionarios[
                    atendimento.funcionario_matricula
                ];

                let nomeFuncionario = 'Funcionário Desconhecido';
                let setorFuncionario = 'Não informado';

                if (funcionario) {

                    if (funcionario.nome) {

                        nomeFuncionario = funcionario.nome;

                    }

                    if (funcionario.setor) {

                        setorFuncionario = funcionario.setor;

                    }

                }

                return {
                    id_atendimento: atendimento.id_atendimento,
                    funcionario_matricula: atendimento.funcionario_matricula,
                    nome: nomeFuncionario,
                    setor: setorFuncionario,
                    gravidade: atendimento.gravidade,
                    queixa_principal: atendimento.queixa_principal,
                    acao_tomada: atendimento.acao_tomada,
                    data_hora_entrada: atendimento.data_hora_entrada
                };

            }
        );

        return res.status(200).json({
            totalHoje,
            gravidadeHoje: {
                baixa,
                media,
                alta
            },
            atendimentosPorSetor,
            ultimosAtendimentos
        });

    } catch (erro) {

        return responderErroInterno(
            res,
            'Erro ao obter os dados do dashboard:',
            erro
        );

    }

}