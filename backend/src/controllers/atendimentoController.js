import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';
import { Op } from 'sequelize';

// Buscar atendimentos por funcionário
export async function buscarAtendimentosPorFuncionario(req, res) {
    try {
        const { matricula } = req.params;
        const atendimentos = await Atendimento.findAll({ where: { funcionario_matricula: matricula } });
        res.status(200).json(atendimentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Atualizar um atendimento
export async function atualizarAtendimento(req, res) {
    try {
        const { id } = req.params;
        const [atualizado] = await Atendimento.update(req.body, { where: { id_atendimento: id } });
        if (atualizado) {
            const atendimentoAtualizado = await Atendimento.findByPk(id);
            res.status(200).json(atendimentoAtualizado);
        } else {
            res.status(404).json({ error: 'Atendimento não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Deletar um atendimento
export async function deletarAtendimento(req, res) {
    try {
        const { id } = req.params;
        const deletado = await Atendimento.destroy({ where: { id_atendimento: id } });
        if (deletado) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Atendimento não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Registrar um novo atendimento
export async function registrarAtendimento(req, res) {
    try {
        // Validação contra dados vazios ou corrompidos
        const { funcionario_matricula, gravidade, queixa_principal } = req.body;

        if (!funcionario_matricula || !gravidade || !queixa_principal) {
            return res.status(400).json({ message: "Preencha a matrícula, gravidade e queixa principal." });
        }

        const novoAtendimento = await Atendimento.create(req.body);
        res.status(201).json(novoAtendimento);
    } catch (_error) {
        console.error(_error);
        res.status(500).json({ message: "Erro ao registrar atendimento.", details: _error.message });
    }
}

// Obter dados compilados para o Dashboard
export async function obterDadosDashboard(req, res) {
    try {
        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(); fimDia.setHours(23, 59, 59, 999);
        const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
        const fimMes = new Date(); fimMes.setMonth(fimMes.getMonth() + 1); fimMes.setDate(0); fimMes.setHours(23, 59, 59, 999);

        const totalHoje = await Atendimento.count({ where: { data_hora_entrada: { [Op.between]: [inicioDia, fimDia] } } });
        const baixa = await Atendimento.count({ where: { gravidade: 'Baixa', data_hora_entrada: { [Op.between]: [inicioDia, fimDia] } } });
        const media = await Atendimento.count({ where: { gravidade: 'Média', data_hora_entrada: { [Op.between]: [inicioDia, fimDia] } } });
        const alta = await Atendimento.count({ where: { gravidade: 'Alta', data_hora_entrada: { [Op.between]: [inicioDia, fimDia] } } });

        const atendimentosMes = await Atendimento.findAll({ where: { data_hora_entrada: { [Op.between]: [inicioMes, fimMes] } }, attributes: ['funcionario_matricula'] });
        const ultimosAtendimentosRaw = await Atendimento.findAll({ limit: 5, order: [['data_hora_entrada', 'DESC']] });

        const todasMatriculas = [...new Set([...atendimentosMes.map(at => at.funcionario_matricula), ...ultimosAtendimentosRaw.map(at => at.funcionario_matricula)])];
        const funcionarios = await Funcionario.findAll({ where: { matricula: { [Op.in]: todasMatriculas } }, attributes: ['matricula', 'nome', 'setor'] });

        const mapaFuncionarios = {};
        funcionarios.forEach(f => mapaFuncionarios[f.matricula] = { nome: f.nome, setor: f.setor });

        const setoresContagem = {};
        atendimentosMes.forEach(at => {
            const func = mapaFuncionarios[at.funcionario_matricula];
            let nomeSetor = 'Não Informado';
            if (func) {
                if (func.setor) {
                    nomeSetor = func.setor;
                }
            }
            if (setoresContagem[nomeSetor]) {
                setoresContagem[nomeSetor] += 1;
            } else {
                setoresContagem[nomeSetor] = 1;
            }
        });

        const atendimentosPorSetor = Object.keys(setoresContagem).map(setor => ({ setor, quantidade: setoresContagem[setor] })).sort((a, b) => b.quantidade - a.quantidade);

        const ultimosAtendimentos = ultimosAtendimentosRaw.map(at => {
            const func = mapaFuncionarios[at.funcionario_matricula];
            let nomeFunc = 'Funcionário Desconhecido';
            let setorFunc = '---';
            if (func) {
                if (func.nome) nomeFunc = func.nome;
                if (func.setor) setorFunc = func.setor;
            }
            return { id: at.id_atendimento, matricula: at.funcionario_matricula, nome: nomeFunc, setor: setorFunc, gravidade: at.gravidade, queixa: at.queixa_principal };
        });

        res.status(200).json({ totalHoje, gravidadeHoje: { baixa, media, alta }, atendimentosPorSetor, ultimosAtendimentos });
    } catch (_error) {
        console.error("Erro no obterDadosDashboard:", _error);
        res.status(500).json({ error: _error.message });
    }
}