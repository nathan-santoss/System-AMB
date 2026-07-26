import bcrypt from 'bcryptjs';

import Usuario from '../models/usuarios.js';


function normalizarEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }

    return email.trim().toLowerCase();
}


function emailEhValido(email) {
    if (email.length < 3 || email.length > 150) {
        return false;
    }

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}


function obterCredenciaisIniciais() {
    const emailRecebido = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const senhaRecebida = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    const emailFoiInformado =
        typeof emailRecebido === 'string' &&
        emailRecebido.trim().length > 0;

    const senhaFoiInformada =
        typeof senhaRecebida === 'string' &&
        senhaRecebida.length > 0;

    if (!emailFoiInformado && !senhaFoiInformada) {
        return null;
    }

    if (!emailFoiInformado || !senhaFoiInformada) {
        throw new Error(
            'BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD devem ser informados juntos.'
        );
    }

    const email = normalizarEmail(emailRecebido);
    const senha = senhaRecebida;

    if (!emailEhValido(email)) {
        throw new Error(
            'BOOTSTRAP_ADMIN_EMAIL deve possuir um e-mail válido.'
        );
    }

    if (senha.length < 12 || senha.length > 255) {
        throw new Error(
            'BOOTSTRAP_ADMIN_PASSWORD deve possuir entre 12 e 255 caracteres.'
        );
    }

    return {
        email,
        senha
    };
}


export async function criarUsuarioMaster() {
    const credenciais = obterCredenciaisIniciais();

    if (!credenciais) {
        console.log(
            'Criação automática do usuário inicial desativada.'
        );

        return null;
    }

    const usuarioExistente = await Usuario.unscoped().findOne({
        where: {
            email: credenciais.email
        }
    });

    if (usuarioExistente) {
        console.log(
            'O usuário administrativo inicial já existe. A senha não foi alterada.'
        );

        return usuarioExistente;
    }

    const senhaHash = await bcrypt.hash(
        credenciais.senha,
        12
    );

    const novoUsuario = await Usuario.create({
        email: credenciais.email,
        senha: senhaHash
    });

    console.log(
        'Usuário administrativo inicial criado com sucesso.'
    );

    return novoUsuario;
}