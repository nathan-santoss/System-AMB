import bcrypt from 'bcryptjs';
import Funcionario from '../models/funcionarios.js';
import Usuario from '../models/usuarios.js';
import crypto from 'crypto';

export async function criarUsuarioMaster() {
    const matricula = '1';
    const email = 'admin@logos123';

    try {
        const usuarioExiste = await Usuario.findOne({ where: { email } });

        if (!usuarioExiste) {
            console.log("⏳ Criando usuário master padrão...");

            // Gera uma senha segura de 8 caracteres automaticamente
            const senhaMain = '123456789';

            const funcionarioExiste = await Funcionario.findByPk(matricula);
            if (!funcionarioExiste) {
                await Funcionario.create({
                    matricula: matricula,
                    nome: 'Administrador Master',
                    cpf: '00000000000',
                    cargo: 'Administrador',
                    setor: 'TI'
                });
            }

            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senhaMain, saltRounds);
            await Usuario.create({ email, senha: senhaHash });

            console.log(`Usuário master criado com sucesso! [email: ${email} | Senha: ${senhaMain}]`);
            console.log(`⚠️ ATENÇÃO: Anote a senha acima. Ela não será exibida novamente!`);
        }
    } catch (error) {
        console.error("Erro ao criar usuário Master:", error);
    }
}