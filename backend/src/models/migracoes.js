import { DataTypes } from 'sequelize';
import database from '../config/database.js';

const Migracao = database.define(
    'Migracao',
    {
        versao: {
            type: DataTypes.STRING(100),
            primaryKey: true
        },
        concluida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        tableName: 'tb_migracoes',
        timestamps: false
    }
);

export default Migracao;
