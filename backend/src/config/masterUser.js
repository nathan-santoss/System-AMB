import bcrypt from 'bcryptjs';
import database from './database.js';
import Funcionario from '../models/funcionarios.js';
import Usuario from '../models/usuarios.js';


const MATRICULA_MASTER = '1';
const EMAIL_MASTER = 'logos@123.com';
const SENHA_MASTER = 'logos@123';


export async function criarUsuarioMaster() {
    const transacao = await database.transaction();

    try {
        let funcionarioMaster = await Funcionario.findByPk(
            MATRICULA_MASTER,
            {
                transaction: transacao
            }
        );

        if (!funcionarioMaster) {
            funcionarioMaster = await Funcionario.create(
                {
                    matricula: MATRICULA_MASTER,
                    nome: 'Administrador Master',
                    cpf: '00000000000',
                    cargo: 'Administrador',
                    setor: 'TI',
                    nucleo: null,
                    supervisor: null,
                    coordenador: null,
                    gerente: null
                },
                {
                    transaction: transacao
                }
            );

            console.log(
                'Funcionário administrador master criado.'
            );
        }

        const usuarioMaster = await Usuario.unscoped().findOne({
            where: {
                email: EMAIL_MASTER
            },
            transaction: transacao
        });

        const senhaHash = await bcrypt.hash(
            SENHA_MASTER,
            10
        );

        if (!usuarioMaster) {
            await Usuario.create(
                {
                    email: EMAIL_MASTER,
                    senha: senhaHash
                },
                {
                    transaction: transacao
                }
            );

            console.log(
                'Usuário master criado com sucesso.'
            );
        } else {
            const senhaAtualCorreta = await bcrypt.compare(
                SENHA_MASTER,
                usuarioMaster.senha
            );

            if (!senhaAtualCorreta) {
                await usuarioMaster.update(
                    {
                        senha: senhaHash
                    },
                    {
                        transaction: transacao
                    }
                );

                console.log(
                    'Senha do usuário master atualizada.'
                );
            } else {
                console.log(
                    'Usuário master já está configurado.'
                );
            }
        }

        await transacao.commit();

        console.log(
            `Login master disponível: ${EMAIL_MASTER}
            Senha: ${SENHA_MASTER}`
        );
    } catch (erro) {
        await transacao.rollback();

        console.error(
            'Erro ao criar ou atualizar o usuário master:',
            erro
        );

        throw erro;
    }
}