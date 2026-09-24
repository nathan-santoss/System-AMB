import { DataTypes } from 'sequelize';
import { normalizarEmail } from '../utils/credenciais.js';

export async function migrarUsuarios(database) {
    const interfaceBanco = database.getQueryInterface();
    await database.transaction(async (transaction) => {
        const [migracao] = await database.models.Migracao.findOrCreate({
            where: { versao: '002-administracao-usuarios' },
            defaults: { concluida: false },
            transaction
        });
        await migracao.reload({ transaction, lock: transaction.LOCK.UPDATE });
        if (migracao.concluida) return;

        const colunas = await interfaceBanco.describeTable('tb_usuarios', { transaction });
        if (!colunas.perfil) {
            await interfaceBanco.addColumn(
                'tb_usuarios',
                'perfil',
                {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    defaultValue: 'usuario'
                },
                { transaction }
            );
        }
        if (!colunas.ativo) {
            await interfaceBanco.addColumn(
                'tb_usuarios',
                'ativo',
                {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true
                },
                { transaction }
            );
        }

        const Usuario = database.models.Usuario;
        const admin = await Usuario.findOne({
            where: { perfil: 'admin', ativo: true },
            transaction
        });
        if (!admin) {
            const email = normalizarEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
            let inicial = null;
            if (email) {
                inicial = await Usuario.findOne({ where: { email }, transaction });
            } else {
                const existentes = await Usuario.findAll({ limit: 2, transaction });
                if (existentes.length > 1) {
                    throw new Error(
                        'Informe BOOTSTRAP_ADMIN_EMAIL para identificar o administrador existente.'
                    );
                }
                if (existentes.length === 1) inicial = existentes[0];
            }
            if (inicial) await inicial.update({ perfil: 'admin', ativo: true }, { transaction });
        }
        await migracao.update({ concluida: true }, { transaction });
    });
}
