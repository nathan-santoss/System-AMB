import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Usuario from '../models/usuarios.js';


const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000;
const DURACAO_SESSAO_JWT = '12h';
const CUSTO_BCRYPT = 12;

const EMISSOR_TOKEN = 'system-amb';
const PUBLICO_TOKEN = 'system-amb-web';


function corpoEhObjetoValido(corpo) {
    if (!corpo || typeof corpo !== 'object') {
        return false;
    }

    if (Array.isArray(corpo)) {
        return false;
    }

    return true;
}


function normalizarEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }

    return email
        .trim()
        .toLowerCase();
}


function emailEhValido(email) {
    if (typeof email !== 'string') {
        return false;
    }

    if (email.length < 3 || email.length > 150) {
        return false;
    }

    const formatoEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}


function senhaCadastroEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length < 8 || senha.length > 255) {
        return false;
    }

    return true;
}


function senhaLoginEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length === 0 || senha.length > 255) {
        return false;
    }

    return true;
}


function obterJwtSecret() {
    if (typeof process.env.JWT_SECRET !== 'string') {
        return null;
    }

    const jwtSecret =
        process.env.JWT_SECRET.trim();

    if (jwtSecret.length < 32) {
        return null;
    }

    return jwtSecret;
}


function ambienteEhProducao() {
    return process.env.NODE_ENV === 'production';
}


export function obterOpcoesCookieToken() {
    return {
        httpOnly: true,
        secure: ambienteEhProducao(),
        sameSite: 'strict',
        path: '/',
        maxAge: DURACAO_SESSAO_MS
    };
}


function adicionarEmailsDaVariavel(
    conjunto,
    valorVariavel
) {
    if (typeof valorVariavel !== 'string') {
        return;
    }

    valorVariavel
        .split(',')
        .map(normalizarEmail)
        .filter(emailEhValido)
        .forEach(email => {
            conjunto.add(email);
        });
}


function obterEmailsAdministradores() {
    const emailsAdministradores = new Set();

    adicionarEmailsDaVariavel(
        emailsAdministradores,
        process.env.ADMIN_EMAILS
    );

    /*
     * Mantém compatibilidade com a configuração
     * opcional de criação do primeiro administrador.
     *
     * Se BOOTSTRAP_ADMIN_EMAIL estiver vazio,
     * nada será adicionado.
     */
    const emailInicial = normalizarEmail(
        process.env.BOOTSTRAP_ADMIN_EMAIL
    );

    if (emailEhValido(emailInicial)) {
        emailsAdministradores.add(emailInicial);
    }

    return emailsAdministradores;
}


function usuarioPodeCadastrarUsuarios(usuario) {
    if (
        !usuario ||
        typeof usuario.email !== 'string'
    ) {
        return false;
    }

    const emailUsuario = normalizarEmail(
        usuario.email
    );

    const emailsAdministradores =
        obterEmailsAdministradores();

    return emailsAdministradores.has(
        emailUsuario
    );
}


function criarToken(usuario, jwtSecret) {
    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            email: usuario.email
        },
        jwtSecret,
        {
            algorithm: 'HS256',
            expiresIn: DURACAO_SESSAO_JWT,
            issuer: EMISSOR_TOKEN,
            audience: PUBLICO_TOKEN,
            subject: String(usuario.id_usuario)
        }
    );
}


function impedirCache(res) {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader(
        'Pragma',
        'no-cache'
    );
}


function responderErroValidacaoSequelize(
    res,
    erro
) {
    if (
        erro.name ===
        'SequelizeUniqueConstraintError'
    ) {
        return res.status(409).json({
            message:
                'Este e-mail já está cadastrado.'
        });
    }

    if (
        erro.name ===
        'SequelizeValidationError'
    ) {
        const detalhes = erro.errors.map(
            item => {
                return item.message;
            }
        );

        return res.status(400).json({
            message:
                'Os dados do usuário são inválidos.',
            detalhes
        });
    }

    return null;
}


async function atualizarHashSenhaSeNecessario(
    usuario,
    senha
) {
    try {
        const custoAtual = bcrypt.getRounds(
            usuario.senha
        );

        if (custoAtual >= CUSTO_BCRYPT) {
            return;
        }

        const novoHash = await bcrypt.hash(
            senha,
            CUSTO_BCRYPT
        );

        await usuario.update({
            senha: novoHash
        });
    } catch (erro) {
        console.error(
            'Não foi possível atualizar o hash da senha do usuário:',
            erro.message
        );
    }
}


export async function cadastrar(req, res) {
    // Eu garanto que a resposta não será guardada em cache pelo navegador.
    impedirCache(res);

    try {
        // Primeiro, eu verifico se o usuário que está fazendo a requisição tem permissão para cadastrar outros.
        if (
            !usuarioPodeCadastrarUsuarios(
                req.usuario
            )
        ) {
            return res.status(403).json({
                message:
                    'Você não possui permissão para cadastrar usuários.'
            });
        }

        // Depois, eu valido se o corpo da requisição é um objeto JSON.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                message:
                    'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Eu normalizo o e-mail para um formato padrão e pego a senha.
        const email = normalizarEmail(
            req.body.email
        );

        const senha = req.body.senha;

        // Eu valido se o e-mail tem um formato aceitável.
        if (!emailEhValido(email)) {
            return res.status(400).json({
                message:
                    'Informe um e-mail válido.'
            });
        }

        // E também valido a senha para garantir que ela é forte o suficiente.
        if (!senhaCadastroEhValida(senha)) {
            return res.status(400).json({
                message:
                    'A senha deve possuir entre 8 e 255 caracteres.'
            });
        }

        // Eu procuro no banco de dados para ver se já existe um usuário com este e-mail.
        const usuarioExistente =
            await Usuario.unscoped().findOne({
                where: {
                    email
                },

                attributes: [
                    'id_usuario'
                ]
            });

        // Se o usuário já existir, eu retorno um erro informando.
        if (usuarioExistente) {
            return res.status(409).json({
                message:
                    'Este e-mail já está cadastrado.'
            });
        }

        // Com tudo certo, eu crio um hash seguro para a senha antes de salvar.
        const senhaHash = await bcrypt.hash(
            senha,
            CUSTO_BCRYPT
        );

        // Agora, eu crio o novo usuário no banco de dados com o e-mail e a senha criptografada.
        const novoUsuario =
            await Usuario.create({
                email,
                senha: senhaHash
            });

        // Por fim, eu retorno uma resposta de sucesso com os dados do usuário criado.
        return res.status(201).json({
            message:
                'Usuário criado com sucesso.',

            usuario: {
                id_usuario:
                    novoUsuario.id_usuario,

                email:
                    novoUsuario.email
            }
        });
    } catch (erro) {
        // Se qualquer coisa der errado, eu capturo o erro e envio uma resposta adequada.
        console.error(
            'Erro ao cadastrar usuário:',
            erro
        );

        const respostaValidacao =
            responderErroValidacaoSequelize(
                res,
                erro
            );

        if (respostaValidacao) {
            return respostaValidacao;
        }

        return res.status(500).json({
            message:
                'Erro interno ao criar usuário.'
        });
    }
}


export async function login(req, res) {
    // Eu impeço que o navegador guarde a resposta em cache para garantir a segurança.
    impedirCache(res);

    try {
        // Eu verifico se o corpo da requisição é um objeto JSON válido.
        if (!corpoEhObjetoValido(req.body)) {
            return res.status(400).json({
                message:
                    'O corpo da requisição deve ser um objeto JSON válido.'
            });
        }

        // Eu normalizo o e-mail para um formato padrão e pego a senha.
        const email = normalizarEmail(
            req.body.email
        );

        const senha = req.body.senha;

        // Eu valido se o e-mail informado tem um formato correto.
        if (!emailEhValido(email)) {
            return res.status(400).json({
                message:
                    'Informe um e-mail válido.'
            });
        }

        // E também valido a senha.
        if (!senhaLoginEhValida(senha)) {
            return res.status(400).json({
                message:
                    'A senha é obrigatória e deve possuir no máximo 255 caracteres.'
            });
        }

        // Eu verifico se a chave secreta para gerar o token de sessão está configurada no servidor.
        const jwtSecret = obterJwtSecret();

        if (!jwtSecret) {
            console.error(
                'JWT_SECRET não está configurado ou possui menos de 32 caracteres.'
            );

            return res.status(500).json({
                message:
                    'O servidor de autenticação não está configurado corretamente.'
            });
        }

        // Eu busco o usuário no banco de dados pelo e-mail fornecido.
        const usuario =
            await Usuario.unscoped().findOne({
                where: {
                    email
                },

                attributes: [
                    'id_usuario',
                    'email',
                    'senha'
                ]
            });

        // Se eu não encontrar o usuário ou se ele não tiver uma senha, eu retorno um erro genérico.
        if (
            !usuario ||
            typeof usuario.senha !== 'string'
        ) {
            return res.status(401).json({
                message:
                    'E-mail ou senha inválidos.'
            });
        }

        // Eu comparo a senha enviada com o hash da senha que está salvo no banco.
        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            );

        // Se as senhas não baterem, eu retorno o mesmo erro genérico para não dar pistas a atacantes.
        if (!senhaCorreta) {
            return res.status(401).json({
                message:
                    'E-mail ou senha inválidos.'
            });
        }

        /*
         * Usuários antigos que ainda utilizem hash
         * bcrypt com custo menor serão atualizados
         * automaticamente após um login válido.
         */
        await atualizarHashSenhaSeNecessario(
            usuario,
            senha
        );

        // Com o usuário autenticado, eu crio um token JWT para ele.
        const token = criarToken(
            usuario,
            jwtSecret
        );

        // Eu envio o token para o navegador em um cookie seguro (HttpOnly).
        res.cookie(
            'token',
            token,
            obterOpcoesCookieToken()
        );

        // E finalmente, retorno uma resposta de sucesso com os dados do usuário.
        return res.status(200).json({
            message:
                'Login realizado com sucesso.',

            usuario: {
                id_usuario:
                    usuario.id_usuario,

                email:
                    usuario.email,

                administrador:
                    usuarioPodeCadastrarUsuarios(
                        usuario
                    )
            }
        });
    } catch (erro) {
        // Se algo inesperado acontecer, eu registro o erro e retorno uma mensagem genérica.
        console.error(
            'Erro ao realizar login:',
            erro
        );

        return res.status(500).json({
            message:
                'Erro interno ao processar o login.'
        });
    }
}