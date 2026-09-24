import { DataTypes } from 'sequelize';
import database from '../config/database.js';
import Usuario from './usuarios.js';

const Sessao = database.define(
    'Sessao',
    {
        id: { type: DataTypes.UUID, primaryKey: true },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id_usuario' },
            onDelete: 'CASCADE'
        },
        ultima_atividade: { type: DataTypes.DATE, allowNull: false },
        expira_em: { type: DataTypes.DATE, allowNull: false },
        revogada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    { tableName: 'tb_sessoes', timestamps: false }
);

export default Sessao;
