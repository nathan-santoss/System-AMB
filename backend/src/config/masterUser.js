import bcrypt from 'bcryptjs';

import Usuario from '../models/usuarios.js';


const EMAIL_MASTER = 'logos@123.com';
const SENHA_MASTER = 'logos@123';


async function criarNovoUsuarioMaster(senhaHash) {

    const novoUsuario = await Usuario.create({
        email: EMAIL_MASTER,
        senha: senhaHash
    });

    console.log(
        'Usuário master criado com sucesso.'
    );

    return novoUsuario;

}


async function atualizarSenhaUsuarioMaster(
    usuarioMaster,
    senhaHash
) {

    await usuarioMaster.update({
        senha: senhaHash
    });

    console.log(
        'Senha do usuário master atualizada com sucesso.'
    );

}


async function verificarSenhaUsuarioMaster(
    usuarioMaster
) {

    if (!usuarioMaster.senha) {

        return false;

    }

    const senhaCorreta = await bcrypt.compare(
        SENHA_MASTER,
        usuarioMaster.senha
    );

    return senhaCorreta;

}


export async function criarUsuarioMaster() {

    try {

        const usuarioMaster = await Usuario
            .unscoped()
            .findOne({
                where: {
                    email: EMAIL_MASTER
                }
            });

        if (!usuarioMaster) {

            const senhaHash = await bcrypt.hash(
                SENHA_MASTER,
                10
            );

            await criarNovoUsuarioMaster(
                senhaHash
            );

            console.log(
                'Login master disponível.'
            );

            console.log(
                'E-mail: ' + EMAIL_MASTER
            );

            console.log(
                'Senha: ' + SENHA_MASTER
            );

            return;

        }

        const senhaAtualCorreta =
            await verificarSenhaUsuarioMaster(
                usuarioMaster
            );

        if (!senhaAtualCorreta) {

            const senhaHash = await bcrypt.hash(
                SENHA_MASTER,
                10
            );

            await atualizarSenhaUsuarioMaster(
                usuarioMaster,
                senhaHash
            );

        } else {

            console.log(
                'Usuário master já está configurado.'
            );

        }

        console.log(
            'Login master disponível.'
        );

        console.log(
            'E-mail: ' + EMAIL_MASTER
        );

        console.log(
            'Senha: ' + SENHA_MASTER
        );

    } catch (erro) {

        console.error(
            'Erro ao criar ou atualizar o usuário master:'
        );

        console.error(
            erro
        );

        throw erro;

    }

}