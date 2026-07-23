import { DataTypes } from 'sequelize';

import database from '../config/database.js';
import Funcionario from './funcionarios.js';


const Alergia = database.define(
    'Alergia',
    {
        id_alergia: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },


        funcionario_matricula: {
            type: DataTypes.STRING(20),
            allowNull: false,

            references: {
                model: Funcionario,
                key: 'matricula'
            },

            onUpdate: 'CASCADE',

            onDelete: 'RESTRICT',

            validate: {
                notNull: {
                    msg: 'A matrícula do funcionário é obrigatória.'
                },

                notEmpty: {
                    msg: 'A matrícula do funcionário é obrigatória.'
                },

                len: {
                    args: [
                        1,
                        20
                    ],
                    msg: 'A matrícula do funcionário deve possuir entre 1 e 20 caracteres.'
                }
            },

            set(valor) {

                if (typeof valor === 'number') {

                    this.setDataValue(
                        'funcionario_matricula',
                        String(valor).trim()
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'funcionario_matricula',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'funcionario_matricula',
                    valor
                );

            }
        },


        descricao_alergia: {
            type: DataTypes.STRING(255),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A descrição da alergia é obrigatória.'
                },

                notEmpty: {
                    msg: 'A descrição da alergia é obrigatória.'
                },

                len: {
                    args: [
                        2,
                        255
                    ],
                    msg: 'A descrição da alergia deve possuir entre 2 e 255 caracteres.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'descricao_alergia',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'descricao_alergia',
                    valor
                );

            }
        }
    },
    {
        tableName: 'tb_alergias',

        timestamps: false,

        indexes: [
            {
                name: 'idx_alergias_funcionario_matricula',
                fields: [
                    'funcionario_matricula'
                ]
            },

            {
                name: 'idx_alergias_descricao',
                fields: [
                    'descricao_alergia'
                ]
            }
        ]
    }
);


// Um funcionário pode possuir várias alergias
Funcionario.hasMany(
    Alergia,
    {
        foreignKey: {
            name: 'funcionario_matricula',
            allowNull: false
        },

        sourceKey: 'matricula',

        as: 'alergias',

        onUpdate: 'CASCADE',

        onDelete: 'RESTRICT'
    }
);


// Cada alergia pertence a um funcionário
Alergia.belongsTo(
    Funcionario,
    {
        foreignKey: {
            name: 'funcionario_matricula',
            allowNull: false
        },

        targetKey: 'matricula',

        as: 'funcionario',

        onUpdate: 'CASCADE',

        onDelete: 'RESTRICT'
    }
);


export default Alergia;