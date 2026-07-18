import bcrypt from 'bcryptjs'
import Funcionario from '../models/funcionarios.js'
import Usuario from '../models/usuarios.js'

async function criarUsuarioMaster() {
    const matricula =  '1'
    const senhaMain = '123456'
    const email = 'admin@logos123'
    try {
        const usuarioExiste = await Usuario.findOne({ where: { id: 1 } })

        if (!usuarioExiste) {
            console.log("⏳ Criando usuário master padrão para testes...")

            const funcionarioExiste = await Funcionario.findByPk(matricula)
            if (!funcionarioExiste) {
                await Funcionario.create({
                    matricula: matricula,
                    nome: 'Aparecida',
                    cpf: '00000000000',
                    cargo: 'Chefe',
                    setor: 'TI'
                })
            }

            const salt = await bcrypt.genSalt(10)
            const senhaHash = await bcrypt.hash(senhaMain, salt)

            await Usuario.create({
                id: 1,
                email: email,
                senha: senhaHash
            })

            console.log(`Usuário master criado com sucesso! [email: ${email} | Senha: ${senhaMain}]`)
        } else {
            console.log("✅ Usuário master já configurado no banco de dados.")
        }
    } catch (error) {
        console.error("Falha crítica ao inicializar usuário master:", error)
    }
}

export default criarUsuarioMaster