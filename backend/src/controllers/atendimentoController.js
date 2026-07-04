import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';
import { Op } from 'sequelize';

// Registrar um novo atendimento/triagem
export async function registrarAtendimento(req, res) {
    try {
        const novoAtendimento = await Atendimento.create(req.body);
        res.status(201).json(novoAtendimento);
    } catch (_error) {
        res.status(500).json({ error: error.message });
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