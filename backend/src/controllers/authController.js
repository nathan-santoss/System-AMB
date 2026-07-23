import Usuario from '../models/usuarios.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


function normalizarEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }

    return email.trim().toLowerCase();
}


function emailEhValido(email) {
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoEmail.test(email)) {
        return false;
    }

    if (email.length > 150) {
        return false;
    }

    return true;
}


function senhaEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length < 8) {
        return false;
    }

    if (senha.length > 255) {
        return false;
    }

    return true;
}


// Cadastrar usuário
export async function cadastrar(req, res) {
    try {
        const email = normalizarEmail(req.body.email);
        const senha = req.body.senha;

        if (!emailEhValido(email)) {
            return res.status(400).json({
                message: 'Informe um email válido.'
            });
        }

        if (!senhaEhValida(senha)) {
            return res.status(400).json({
                message: 'A senha deve possuir entre 8 e 255 caracteres.'
            });
        }

        const usuarioExistente = await Usuario.unscoped().findOne({
            where: {
                email
            }
        });

        if (usuarioExistente) {
            return res.status(409).json({
                message: 'Este email já está cadastrado.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = await Usuario.create({
            email,
            senha: senhaHash
        });

        return res.status(201).json({
            message: 'Usuário criado com sucesso!',
            usuario: {
                id_usuario: novoUsuario.id_usuario,
                email: novoUsuario.email
            }
        });

    } catch (erro) {
        console.error(
            'Erro ao cadastrar usuário:',
            erro
        );

        if (erro.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'Este email já está cadastrado.'
            });
        }

        if (erro.name === 'SequelizeValidationError') {
            const detalhes = erro.errors.map(item => {
                return item.message;
            });

            return res.status(400).json({
                message: 'Os dados do usuário são inválidos.',
                detalhes
            });
        }

        return res.status(500).json({
            message: 'Erro interno ao criar usuário.'
        });
    }
}


// Login
export async function login(req, res) {
    try {
        const email = normalizarEmail(req.body.email);
        const senha = req.body.senha;

        if (!emailEhValido(email)) {
            return res.status(400).json({
                message: 'Informe um email válido.'
            });
        }

        if (typeof senha !== 'string' || senha.length === 0) {
            return res.status(400).json({
                message: 'A senha é obrigatória.'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                'JWT_SECRET não está configurado no arquivo .env.'
            );

            return res.status(500).json({
                message: 'O servidor de autenticação não está configurado.'
            });
        }

        /*
         * O unscoped é necessário porque o model Usuario
         * oculta o campo senha no defaultScope.
         */
        const usuario = await Usuario.unscoped().findOne({
            where: {
                email
            }
        });

        if (!usuario) {
            return res.status(401).json({
                message: 'Email ou senha inválidos.'
            });
        }

        if (!usuario.senha) {
            console.error(
                'O usuário foi encontrado, mas a senha não foi carregada.'
            );

            return res.status(500).json({
                message: 'Erro ao carregar os dados do usuário.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                message: 'Email ou senha inválidos.'
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '12h'
            }
        );

        let ambienteProducao = false;

        if (process.env.NODE_ENV === 'production') {
            ambienteProducao = true;
        }

        res.cookie('token', token, {
            httpOnly: true,
            secure: ambienteProducao,
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                email: usuario.email
            }
        });

    } catch (erro) {
        console.error(
            'Erro ao realizar login:',
            erro
        );

        return res.status(500).json({
            message: 'Erro interno ao processar o login.'
        });
    }
}