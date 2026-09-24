import {
    criarFuncionario,
    buscarFuncionarioPorMatricula as buscarFuncionarioService,
    atualizarFuncionario as atualizarFuncionarioService,
    deletarFuncionario as deletarFuncionarioService
} from '../services/funcionarioService.js';

import { buscarProntuarioFuncionario } from '../services/prontuarioService.js';

import {
    normalizarTexto,
    normalizarTextoOpcional,
    normalizarMatricula,
    normalizarCpf
} from '../utils/normalizadores.js';

import {
    matriculaEhValida,
    cpfEhValido,
    textoObrigatorioEhValido,
    textoOpcionalEhValido
} from '../utils/validadores.js';

import { responderErroInterno } from '../utils/respostas.js';
import { buscarPaginaFuncionarios } from '../services/funcionarioService.js';
import { validarPagina, validarTextoFiltro, validarEscolha } from '../utils/filtrosRelatorio.js';

// Aqui eu centralizo os tamanhos máximos permitidos pelas colunas do banco de dados.
const TAMANHO_MAXIMO_NOME = 150;
const TAMANHO_MAXIMO_CAMPO_OPCIONAL = 150;

// Nesta função eu padronizo a devolução de falhas de negócio sempre no formato HTTP 400 (Bad Request).
function responderErroValidacao(res, mensagem) {
    return res.status(400).json({ erro: mensagem });
}

// Neste escopo eu realizo o cadastro de um novo funcionário recebendo os dados diretamente do frontend.
export async function cadastrarFuncionario(req, res) {
    try {
        // Primeiro eu extraio e limpo os campos obrigatórios básicos de forma segura usando encadeamento opcional.
        const matricula = normalizarMatricula(req.body?.matricula);
        const nome = normalizarTexto(req.body?.nome);
        const cpf = normalizarCpf(req.body?.cpf);

        // Agora eu verifico se a matrícula informada atende aos requisitos numéricos/alfanuméricos do banco.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula é obrigatória e deve possuir até 20 caracteres.'
            );
        }

        // Em seguida eu valido se o nome do funcionário foi preenchido e possui um tamanho aceitável e seguro.
        if (!textoObrigatorioEhValido(nome, TAMANHO_MAXIMO_NOME)) {
            return responderErroValidacao(
                res,
                'O nome é obrigatório e deve possuir entre 2 e 150 caracteres.'
            );
        }

        // Aqui eu reforço a checagem do tamanho mínimo para evitar registros não intencionais.
        if (nome.length < 2) {
            return responderErroValidacao(
                res,
                'O nome é obrigatório e deve possuir entre 2 e 150 caracteres.'
            );
        }

        // Depois garanto que o CPF contenha exatamente os 11 dígitos numéricos exigidos pela aplicação.
        if (!cpfEhValido(cpf)) {
            return responderErroValidacao(res, 'Informe um CPF válido.');
        }

        // Aqui eu preparo e normalizo os dados extras corporativos que não são de preenchimento obrigatório.
        const cargo = normalizarTextoOpcional(req.body?.cargo);
        const setor = normalizarTextoOpcional(req.body?.setor);
        const nucleo = normalizarTextoOpcional(req.body?.nucleo);
        const supervisor = normalizarTextoOpcional(req.body?.supervisor);
        const coordenador = normalizarTextoOpcional(req.body?.coordenador);
        const gerente = normalizarTextoOpcional(req.body?.gerente);

        // Por segurança eu crio um array com esses campos opcionais para checar facilmente se o limite não estourou.
        const camposOpcionais = [cargo, setor, nucleo, supervisor, coordenador, gerente];

        // Neste momento eu percorro cada campo opcional validando o seu tamanho máximo.
        for (const campo of camposOpcionais) {
            if (!textoOpcionalEhValido(campo, TAMANHO_MAXIMO_CAMPO_OPCIONAL)) {
                return responderErroValidacao(
                    res,
                    'Os campos opcionais devem possuir no máximo 150 caracteres.'
                );
            }
        }

        // Com os dados devidamente higienizados e validados, eu aciono o serviço para inserir no PostgreSQL.
        const funcionario = await criarFuncionario({
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

        // Por fim eu entrego o objeto do paciente recém-criado em formato JSON com o status HTTP 201.
        return res.status(201).json(funcionario);
    } catch (erro) {
        // Se o ORM disparar um erro de unicidade (Ex: CPF já existente), essa utilidade tratará automaticamente.
        return responderErroInterno(res, 'Erro ao cadastrar funcionário:', erro);
    }
}

// Nesta função eu listo todos os pacientes cadastrados, permitindo que a pesquisa filtre por termos em texto.
export async function buscarFuncionarios(req, res) {
    let filtros;
    try {
        filtros = {
            pagina: validarPagina(req.query.pagina),
            busca: validarTextoFiltro(req.query.busca),
            situacao: validarEscolha(req.query.situacao, ['ativos', 'inativos', 'todos'], 'ativos')
        };
        for (const campo of ['setor', 'nucleo', 'supervisor', 'coordenador', 'gerente']) {
            filtros[campo] = validarTextoFiltro(req.query[campo]);
        }
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
    try {
        const funcionarios = await buscarPaginaFuncionarios(filtros);

        // Como resposta eu apenas serializo a coleção de dados e envio como sucesso.
        return res.status(200).json(funcionarios);
    } catch (erro) {
        // Se a base de dados ficar indisponível ou as permissões falharem eu bloqueio a resposta.
        return responderErroInterno(res, 'Erro ao buscar funcionários:', erro);
    }
}

// Aqui eu pesquiso e trago o molde completo do paciente (prontuário) através da sua matrícula.
export async function buscarFuncionarioPorMatricula(req, res) {
    try {
        // Inicialmente eu limpo qualquer formatação indesejada na chave repassada na rota.
        const matricula = normalizarMatricula(req.params.matricula);

        // Se o valor não atender à expressão base, não há motivo para sobrecarregar a rede indo no banco.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(res, 'A matrícula informada é inválida.');
        }

        // Agora eu verifico fisicamente a presença dos dados e monto o prontuário completo (o molde esperado).
        let pagina;
        try {
            pagina = validarPagina(req.query.pagina);
        } catch (erro) {
            return responderErroValidacao(res, erro.message);
        }
        const prontuario = await buscarProntuarioFuncionario(matricula, pagina);

        // Se o banco não achar correspondência, eu padronizo a devolução com status de recurso não encontrado.
        if (!prontuario) {
            return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        }

        // Caso exista, libero a listagem empacotada (funcionário, resumo, alergias e atendimentos) ao cliente web.
        return res.status(200).json(prontuario);
    } catch (erro) {
        // A proteção geral é aplicada garantindo que mensagens técnicas não cheguem ao console front-end.
        return responderErroInterno(res, 'Erro ao buscar prontuário do funcionário:', erro);
    }
}

// Nesta estrutura eu aceito alterações pontuais (PATCH) em campos variados de um funcionário que já existe.
export async function atualizarFuncionario(req, res) {
    try {
        // Eu higienizo e defino o alvo da requisição utilizando a matrícula provida na URL.
        const matricula = normalizarMatricula(req.params.matricula);

        // Antes de continuar eu verifico se a matrícula é logicamente válida.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(res, 'A matrícula informada é inválida.');
        }

        // Antes de tentar o update, eu garanto que o registro realmente está ali para ser editado.
        const funcionario = await buscarFuncionarioService(matricula);

        // Caso o funcionário não exista, eu interrompo informando o cliente.
        if (!funcionario) {
            return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        }

        // Neste momento eu preparo o objeto vazio que englobará estritamente aquilo que foi modificado.
        const dadosAtualizacao = {};
        if (req.body?.ativo !== undefined) {
            if (typeof req.body.ativo !== 'boolean')
                return responderErroValidacao(res, 'Situação inválida.');
            dadosAtualizacao.ativo = req.body.ativo;
        }

        // Se a chave "nome" foi declarada no JSON eu limpo, verifico se é coerente e defino no update.
        if (req.body?.nome !== undefined) {
            const nome = normalizarTexto(req.body.nome);

            if (!textoObrigatorioEhValido(nome, TAMANHO_MAXIMO_NOME)) {
                return responderErroValidacao(res, 'O nome deve possuir entre 2 e 150 caracteres.');
            }

            if (nome.length < 2) {
                return responderErroValidacao(res, 'O nome deve possuir entre 2 e 150 caracteres.');
            }

            dadosAtualizacao.nome = nome;
        }

        // O mesmo ocorre com o CPF, com a garantia de que as pontuações visuais foram cortadas antes do banco.
        if (req.body?.cpf !== undefined) {
            const cpf = normalizarCpf(req.body.cpf);

            if (!cpfEhValido(cpf)) {
                return responderErroValidacao(res, 'Informe um CPF válido.');
            }

            dadosAtualizacao.cpf = cpf;
        }

        // Agora eu verifico todos os dados complementares, processando-os separadamente no escopo do pacote.
        const camposExtras = ['cargo', 'setor', 'nucleo', 'supervisor', 'coordenador', 'gerente'];

        // Para cada campo adicional, eu executo a validação de tamanho máximo se ele foi enviado.
        for (const campo of camposExtras) {
            if (req.body?.[campo] !== undefined) {
                const valorLimpo = normalizarTextoOpcional(req.body[campo]);

                if (!textoOpcionalEhValido(valorLimpo, TAMANHO_MAXIMO_CAMPO_OPCIONAL)) {
                    return responderErroValidacao(
                        res,
                        `O campo ${campo} deve possuir no máximo 150 caracteres.`
                    );
                }

                dadosAtualizacao[campo] = valorLimpo;
            }
        }

        // Depois de todas as verificações, eu analiso se há pelo menos um campo viável de alteração no novo objeto.
        if (Object.keys(dadosAtualizacao).length === 0) {
            return responderErroValidacao(res, 'Nenhum campo válido foi enviado para atualização.');
        }

        // Envio os dados filtrados para a persistência assíncrona.
        const funcionarioAtualizado = await atualizarFuncionarioService(
            funcionario,
            dadosAtualizacao
        );

        // Por fim entrego a resposta confirmando a sobreposição de dados.
        return res.status(200).json(funcionarioAtualizado);
    } catch (erro) {
        // Qualquer erro de formatação ou banco será encapsulado.
        return responderErroInterno(res, 'Erro ao atualizar funcionário:', erro);
    }
}

// Inativa o cadastro sem remover o histórico utilizado pelos relatórios.
export async function deletarFuncionario(req, res) {
    try {
        // Eu sanitizo novamente o dado vindo como referência na rota de remoção.
        const matricula = normalizarMatricula(req.params.matricula);

        // Se a matrícula não tiver um formato válido, eu bloqueio a operação.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(res, 'A matrícula informada é inválida.');
        }

        // Confere se o funcionário existe antes da atualização.
        const funcionario = await buscarFuncionarioService(matricula);

        // Se o funcionário não existir no banco, eu aviso o cliente.
        if (!funcionario) {
            return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        }

        // Alergias e atendimentos permanecem disponíveis para consulta.
        await deletarFuncionarioService(funcionario);

        // Confirma a inativação sem apagar os registros relacionados.
        return res.status(200).json({ mensagem: 'Funcionário inativado. Histórico preservado.' });
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao inativar funcionário:', erro);
    }
}
