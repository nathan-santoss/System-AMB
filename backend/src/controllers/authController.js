import Usuario from "../models/usuarios.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const cadastrar = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ message: "Email e senha são obrigatórios." });

    try {
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);
        await Usuario.create({ email, senha: senhaHash });
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error("ERRO NO CADASTRO:", error);
        res.status(500).json({ message: "Erro ao criar usuário." });
    }
}

export const login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        let senhaCorreta = false;
        if (usuario) {
            senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        } else {
            await bcrypt.compare(senha, "fake_hash_to_prevent_timing_attacks");
        }

        if (!usuario || !senhaCorreta) {
            return res.status(401).json({ message: "Email ou senha inválidos." });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Token seguro salvo em cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000
        });

        res.status(200).json({ message: "Login realizado com sucesso!", token });

    } catch (error) {
        console.error("ERRO NO LOGIN:", error);
        res.status(500).json({ message: "Erro no servidor ao processar o login." });
    }
}