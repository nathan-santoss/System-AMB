import bcrypt from 'bcryptjs';

import Usuario from '../models/usuarios.js';

const CUSTO_BCRYPT = 12;

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

    if (email.length < 3) {
        return false;
    }

    if (email.length > 150) {
        return false;
    }

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}

function senhaEhValida(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    if (senha.length < 12) {
        return false;
    }

    if (senha.length > 255) {
        return false;
    }

    return true;
}

function valorFoiInformado(valor) {
    if (typeof valor !== 'string') {
        return false;
    }

    if (valor.trim().length === 0) {
        return false;
    }

    return true;
}

function obterCredenciaisIniciais() {
    const emailRecebido =
        process.env.BOOTSTRAP_ADMIN_EMAIL;

    const senhaRecebida =
        process.env.BOOTSTRAP_ADMIN_PASSWORD;

    const emailFoiInformado =
        valorFoiInformado(emailRecebido);

    const senhaFoiInformada =
        valorFoiInformado(senhaRecebida);

    if (
        !emailFoiInformado &&
        !senhaFoiInformada
    ) {
        return null;
    }

    if (
        !emailFoiInformado ||
        !senhaFoiInformada
    ) {
        throw new Error(
            'BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD devem ser informados juntos.'
        );
    }

    const email = normalizarEmail(
        emailRecebido
    );

    const senha = senhaRecebida;

    if (!emailEhValido(email)) {
        throw new Error(
            'BOOTSTRAP_ADMIN_EMAIL deve possuir um e-mail válido.'
        );
    }

    if (!senhaEhValida(senha)) {
        throw new Error(
            'BOOTSTRAP_ADMIN_PASSWORD deve possuir entre 12 e 255 caracteres.'
        );
    }

    return {
        email,
        senha
    };
}

async function buscarUsuarioPorEmail(email) {
    return Usuario.unscoped().findOne({
        where: {
            email
        },
        attributes: [
            'id_usuario',
            'email',
            'senha'
        ]
    });
}

async function criarUsuarioInicial(
    credenciais
) {
    const senhaHash = await bcrypt.hash(
        credenciais.senha,
        CUSTO_BCRYPT
    );

    return Usuario.create({
        email: credenciais.email,
        senha: senhaHash
    });
}

export async function criarUsuarioMaster() {
    const credenciais =
        obterCredenciaisIniciais();

    if (credenciais === null) {
        console.log(
            'Criação automática do usuário inicial desativada.'
        );

        return null;
    }

    const usuarioExistente =
        await buscarUsuarioPorEmail(
            credenciais.email
        );

    if (usuarioExistente) {
        console.log(
            'O usuário inicial já existe. A senha não foi alterada.'
        );

        return usuarioExistente;
    }

    const novoUsuario =
        await criarUsuarioInicial(
            credenciais
        );

    console.log(
        'Usuário inicial criado com sucesso.'
    );

    return novoUsuario;
}