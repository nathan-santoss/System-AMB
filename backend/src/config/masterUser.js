import {
    CUSTO_BCRYPT,
    normalizarEmail,
    emailEhValido,
    senhaEhValida
} from '../utils/credenciais.js';
import bcrypt from 'bcryptjs';

import Usuario from '../models/usuarios.js';

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
    const emailRecebido = process.env.BOOTSTRAP_ADMIN_EMAIL;

    const senhaRecebida = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    const emailFoiInformado = valorFoiInformado(emailRecebido);

    const senhaFoiInformada = valorFoiInformado(senhaRecebida);

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
        throw new Error('BOOTSTRAP_ADMIN_EMAIL deve possuir um e-mail válido.');
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
        attributes: ['id_usuario', 'email', 'senha', 'perfil']
    });
}

async function criarUsuarioInicial(credenciais) {
    // Uma credencial antiga mantida no ambiente não deve impedir a inicialização
    // quando o usuário já existe e a senha não será utilizada para criar um hash.
    if (!senhaEhValida(credenciais.senha)) {
        throw new Error(
            'BOOTSTRAP_ADMIN_PASSWORD deve possuir pelo menos 12 caracteres e no máximo 72 bytes em UTF-8.'
        );
    }

    const senhaHash = await bcrypt.hash(credenciais.senha, CUSTO_BCRYPT);

    return Usuario.create({
        email: credenciais.email,
        senha: senhaHash,
        perfil: 'admin'
    });
}

export async function criarUsuarioMaster() {
    const credenciais = obterCredenciaisIniciais();

    if (credenciais === null) {
        console.log('Criação automática do usuário inicial desativada.');

        return null;
    }

    const usuarioExistente = await buscarUsuarioPorEmail(credenciais.email);

    if (usuarioExistente) {
        if (usuarioExistente.perfil !== 'admin') await usuarioExistente.update({ perfil: 'admin' });
        console.log('O usuário inicial já existe. A senha não foi alterada.');

        return usuarioExistente;
    }

    const novoUsuario = await criarUsuarioInicial(credenciais);

    console.log('Usuário inicial criado com sucesso.');

    return novoUsuario;
}
