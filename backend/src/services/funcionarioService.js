import { Op } from 'sequelize';
import Funcionario from '../models/funcionarios.js';
import Alergia from '../models/alergias.js';
import Atendimento from '../models/atendimento.js';

// Aqui eu realizo a criação de um novo registro de paciente diretamente no banco de dados.
export async function criarFuncionario(dados) {
    return Funcionario.create(dados);
}

// Nesta função eu busco a lista de funcionários, permitindo aplicar um filtro de texto livre.
export async function buscarTodosFuncionarios(filtro = {}) {
    // Primeiro eu defino a regra padrão da consulta, ordenando os pacientes alfabeticamente pelo nome.
    const opcoesConsulta = {
        order: [
            ['nome', 'ASC']
        ]
    };

    let busca = '';

    // Agora eu verifico de forma simples se um termo de busca válido foi enviado nos parâmetros.
    if (filtro.busca) {
        if (typeof filtro.busca === 'string') {
            busca = filtro.busca.trim();
        }
    }

    // Se houver texto para buscar, eu configuro a consulta para procurar o termo em diversas colunas.
    if (busca.length > 0) {
        const filtrosBusca = [
            {
                matricula: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                nome: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                cargo: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                setor: {
                    [Op.like]: `%${busca}%`
                }
            },
            {
                nucleo: {
                    [Op.like]: `%${busca}%`
                }
            }
        ];

        // Em seguida eu removo os caracteres não numéricos para verificar se o usuário tentou pesquisar por um CPF.
        const cpfBusca = busca.replace(/\D/g, '');

        // Caso o termo possua números, eu adiciono o CPF como uma das opções válidas de filtro.
        if (cpfBusca.length > 0) {
            filtrosBusca.push({
                cpf: {
                    [Op.like]: `%${cpfBusca}%`
                }
            });
        }

        // Neste ponto eu aplico a cláusula OR, significando que o termo pesquisado pode estar em qualquer uma dessas colunas.
        opcoesConsulta.where = {
            [Op.or]: filtrosBusca
        };
    }

    // Por fim eu executo a consulta no Sequelize e retorno os dados encontrados.
    return Funcionario.findAll(opcoesConsulta);
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

// Aqui eu orquestro a exclusão de um funcionário, lidando manualmente com as restrições dos seus relacionamentos.
export async function deletarFuncionario(funcionario) {
    // Antes de excluir o funcionário, eu deleto todas as alergias associadas a ele para evitar erros de chave estrangeira (RESTRICT).
    await Alergia.destroy({
        where: {
            funcionario_matricula: funcionario.matricula
        }
    });

    // Pelo mesmo motivo de integridade do banco, eu também removo todos os históricos de atendimento desse paciente.
    await Atendimento.destroy({
        where: {
            funcionario_matricula: funcionario.matricula
        }
    });

    // Com as dependências limpas de forma segura, eu finalmente posso deletar o registro principal do funcionário.
    await funcionario.destroy();
}