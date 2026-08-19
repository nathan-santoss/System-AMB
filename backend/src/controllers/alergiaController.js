import {
    criarAlergia,
    buscarAlergiasPorFuncionario,
    buscarAlergiaPorId as buscarAlergiaService,
    deletarAlergia as deletarAlergiaService
} from '../services/alergiaService.js';

import {
    buscarFuncionarioPorMatricula
} from '../services/funcionarioService.js';

import {
    normalizarMatricula,
    normalizarTexto
} from '../utils/normalizadores.js';

import {
    corpoEhObjetoValido,
    matriculaEhValida,
    identificadorEhValido,
    textoObrigatorioEhValido
} from '../utils/validadores.js';

import {
    responderErroInterno
} from '../utils/respostas.js';

// Aqui eu defino as constantes de limite da regra de negócio para facilitar futuras manutenções.
const TAMANHO_MINIMO_DESCRICAO = 2;
const TAMANHO_MAXIMO_DESCRICAO = 255;

// Neste ponto eu crio uma função simples para padronizar as respostas de erro de validação.
function responderErroValidacao(res, mensagem) {
    return res.status(400).json({
        erro: mensagem
    });
}

// Agora eu izolo a validação específica da descrição da alergia para não poluir a função principal.
function obterDescricaoAlergia(corpo) {
    // Primeiro eu garanto que não estou lidando com dados inexistentes ou mal formatados.
    if (!corpoEhObjetoValido(corpo)) {
        return {
            erro: 'O corpo da requisição deve ser um objeto JSON válido.'
        };
    }

    // Em seguida eu removo os espaços em branco extras que o usuário possa ter enviado por engano.
    const descricao = normalizarTexto(corpo.descricao_alergia);

    // Por segurança eu valido se a descrição respeita os limites estritos do nosso banco de dados.
    if (!textoObrigatorioEhValido(descricao, TAMANHO_MAXIMO_DESCRICAO)) {
        return {
            erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
        };
    }

    // Aqui eu reforço a checagem do tamanho mínimo para evitar registros não intencionais com uma letra.
    if (descricao.length < TAMANHO_MINIMO_DESCRICAO) {
        return {
            erro: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
        };
    }

    // Com isso eu retorno a descrição devidamente sanitizada e pronta para ser salva na base.
    return {
        descricao
    };
}

// Nesta parte eu declaro a função principal responsável pelo cadastro de novos alertas médicos.
export async function cadastrarAlergia(req, res) {
    try {
        // Antes de continuar eu verifico se a requisição possui um corpo efetivamente preenchido.
        if (!corpoEhObjetoValido(req.body)) {
            return responderErroValidacao(
                res,
                'O corpo da requisição deve ser um objeto JSON válido.'
            );
        }

        // Agora eu extraio e limpo a matrícula do funcionário para padronizar a busca e o cadastro.
        const matricula = normalizarMatricula(req.body.funcionario_matricula);

        // Neste momento eu bloqueio a operação caso a matrícula não atenda aos critérios da aplicação.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula do funcionário é obrigatória e deve possuir até 20 caracteres.'
            );
        }

        // Aqui eu utilizo a função auxiliar para validar rigorosamente a descrição da alergia.
        const validacaoDescricao = obterDescricaoAlergia(req.body);

        // Se houver algum erro de tamanho ou formato, eu interrompo o processo imediatamente.
        if (validacaoDescricao.erro) {
            return responderErroValidacao(
                res,
                validacaoDescricao.erro
            );
        }

        // Depois eu confiro se o funcionário realmente existe no sistema antes de criar o vínculo médico.
        const funcionario = await buscarFuncionarioPorMatricula(matricula);

        // Para evitar falsos positivos e erros de chave estrangeira, eu retorno 404 caso não seja encontrado.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Com os dados validados e a integridade garantida eu solicito a criação da alergia ao serviço.
        const alergia = await criarAlergia({
            funcionario_matricula: matricula,
            descricao_alergia: validacaoDescricao.descricao
        });

        // Por fim eu retorno a alergia recém-criada juntamente com o código HTTP 201 (Created).
        return res.status(201).json(alergia);

    } catch (erro) {
        // Caso aconteça uma falha imprevista no banco, eu repasso a exceção ao tratador genérico.
        return responderErroInterno(
            res,
            'Erro ao cadastrar alergia:',
            erro
        );
    }
}

// Agora eu crio o fluxo responsável por listar todas as alergias cadastradas para um paciente específico.
export async function buscarAlergiasFuncionario(req, res) {
    try {
        // Primeiro eu higienizo o parâmetro vindo da URL que contém a matrícula desejada.
        const matricula = normalizarMatricula(req.params.matricula);

        // Por segurança eu valido se a matrícula fornecida possui um formato minimamente aceitável.
        if (!matriculaEhValida(matricula)) {
            return responderErroValidacao(
                res,
                'A matrícula informada é inválida.'
            );
        }

        // Neste ponto eu procuro pelo funcionário na base de dados para ter certeza de que o paciente existe.
        const funcionario = await buscarFuncionarioPorMatricula(matricula);

        // Se a matrícula não constar no sistema, eu não devolvo uma lista vazia, mas sim 404 Not Found.
        if (!funcionario) {
            return res.status(404).json({
                erro: 'Funcionário não encontrado.'
            });
        }

        // Com a existência do funcionário confirmada, eu trago todos os alertas médicos ligados a ele.
        const alergias = await buscarAlergiasPorFuncionario(matricula);

        // Em seguida eu retorno a lista de alergias no formato JSON padrão com status de sucesso.
        return res.status(200).json(alergias);

    } catch (erro) {
        // Para evitar exposição sensível do servidor eu trato qualquer falha interna aqui.
        return responderErroInterno(
            res,
            'Erro ao buscar alergias:',
            erro
        );
    }
}

// Aqui eu implemento a funcionalidade de remover um alerta médico que foi cadastrado por engano.
export async function deletarAlergia(req, res) {
    try {
        // Primeiramente eu isolo o ID que foi transmitido nos parâmetros da URL.
        const idAlergia = req.params.id;

        // Agora eu verifico se esse ID é de fato um identificador numérico e seguro para manipulação.
        if (!identificadorEhValido(idAlergia)) {
            return responderErroValidacao(
                res,
                'O identificador da alergia é inválido.'
            );
        }

        // Neste momento eu consulto o serviço para garantir que a alergia desejada ainda está registrada.
        const alergia = await buscarAlergiaService(Number(idAlergia));

        // Para evitar excluir algo que não existe ou quebrar a aplicação, eu barro a operação.
        if (!alergia) {
            return res.status(404).json({
                erro: 'Alergia não encontrada.'
            });
        }

        // Com tudo perfeitamente validado, eu autorizo a exclusão definitiva do registro pelo serviço.
        await deletarAlergiaService(alergia);

        // Por fim eu devolvo uma mensagem clara confirmando ao cliente que a operação foi bem sucedida.
        return res.status(200).json({
            mensagem: 'Alergia excluída com sucesso.'
        });

    } catch (erro) {
        // Caso ocorra uma interrupção inesperada do banco, o utilitário assume a resposta adequada.
        return responderErroInterno(
            res,
            'Erro ao excluir alergia:',
            erro
        );
    }
}