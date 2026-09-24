import { Op } from 'sequelize';
import Funcionario from '../models/funcionarios.js';

// Aqui eu realizo a criação de um novo registro de paciente diretamente no banco de dados.
export async function criarFuncionario(dados) {
    return Funcionario.create(dados);
}

// Aqui eu busco os dados completos de um único funcionário utilizando a sua chave primária.
export async function buscarFuncionarioPorMatricula(matricula) {
    return Funcionario.findByPk(matricula);
}

// Nesta parte eu aplico as atualizações recebidas do controlador em um paciente que já existe.
export async function atualizarFuncionario(funcionario, dados) {
    await funcionario.update(dados);
    return funcionario;
}

// Mantém as referências históricas ao retirar o funcionário da lista ativa.
export async function deletarFuncionario(funcionario) {
    // A inativação mantém os registros usados nos relatórios históricos.
    return funcionario.update({ ativo: false });
}

export async function buscarPaginaFuncionarios(filtros) {
    const where = {};
    if (filtros.situacao === 'ativos') where.ativo = true;
    if (filtros.situacao === 'inativos') where.ativo = false;
    for (const campo of ['setor', 'nucleo', 'supervisor', 'coordenador', 'gerente']) {
        if (filtros[campo]) where[campo] = filtros[campo];
    }
    if (filtros.busca) {
        const termo = '%' + filtros.busca + '%';
        where[Op.or] = ['nome', 'matricula', 'cpf', 'cargo', 'setor', 'nucleo'].map((campo) => ({
            [campo]: { [Op.iLike]: termo }
        }));
        const cpf = filtros.busca.replace(/\D/g, '');
        if (cpf.length) where[Op.or].push({ cpf: { [Op.iLike]: '%' + cpf + '%' } });
    }
    const resultado = await Funcionario.findAndCountAll({
        where,
        limit: 25,
        offset: (filtros.pagina - 1) * 25,
        order: [
            ['nome', 'ASC'],
            ['matricula', 'ASC']
        ]
    });
    return {
        registros: resultado.rows,
        total: resultado.count,
        pagina: filtros.pagina,
        totalPaginas: Math.max(1, Math.ceil(resultado.count / 25))
    };
}
