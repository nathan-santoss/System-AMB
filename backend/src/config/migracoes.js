import { DataTypes } from 'sequelize';
import { migrarUsuarios } from './migracaoUsuarios.js';

export async function aplicarMigracoes(database) {
    const Migracao = database.models.Migracao;
    const interfaceBanco = database.getQueryInterface();

    await database.transaction(async (transaction) => {
        // O registro e o bloqueio evitam reaplicar a migração em outra instância.
        const [migracao] = await Migracao.findOrCreate({
            where: { versao: '001-operacao' },
            defaults: { concluida: false },
            transaction
        });

        await migracao.reload({ transaction, lock: transaction.LOCK.UPDATE });
        if (migracao.concluida) return;

        const funcionarios = await interfaceBanco.describeTable('tb_funcionarios', { transaction });
        if (!funcionarios.ativo) {
            await interfaceBanco.addColumn(
                'tb_funcionarios',
                'ativo',
                {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true
                },
                { transaction }
            );
        }

        const atendimentos = await interfaceBanco.describeTable('tb_atendimento', { transaction });
        if (!atendimentos.chave_registro) {
            await interfaceBanco.addColumn(
                'tb_atendimento',
                'chave_registro',
                {
                    type: DataTypes.UUID,
                    allowNull: true
                },
                { transaction }
            );
        }
        if (!atendimentos.registrado_por) {
            await interfaceBanco.addColumn(
                'tb_atendimento',
                'registrado_por',
                {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'tb_usuarios', key: 'id_usuario' }
                },
                { transaction }
            );
        }

        const indices = await interfaceBanco.showIndex('tb_atendimento', { transaction });
        if (!indices.some((indice) => indice.name === 'idx_atendimento_chave_registro')) {
            await interfaceBanco.addIndex('tb_atendimento', ['chave_registro'], {
                name: 'idx_atendimento_chave_registro',
                unique: true,
                transaction
            });
        }

        // A fila em aberto e os rankings consultam estes campos com frequência.
        const novosIndices = [
            [
                'idx_atendimento_abertos',
                ['data_hora_entrada'],
                { where: { data_hora_saida: null } }
            ],
            ['idx_atendimento_supervisor_data', ['supervisor_na_epoca', 'data_hora_entrada'], {}],
            ['idx_atendimento_coordenador_data', ['coordenador_na_epoca', 'data_hora_entrada'], {}],
            ['idx_atendimento_gerente_data', ['gerente_na_epoca', 'data_hora_entrada'], {}]
        ];
        for (const [nome, campos, opcoes] of novosIndices) {
            if (indices.some((indice) => indice.name === nome)) continue;
            await interfaceBanco.addIndex('tb_atendimento', campos, {
                ...opcoes,
                name: nome,
                transaction
            });
        }

        // A versão só fica concluída se todas as alterações forem confirmadas.
        await migracao.update({ concluida: true }, { transaction });
    });
    await migrarUsuarios(database);
}
