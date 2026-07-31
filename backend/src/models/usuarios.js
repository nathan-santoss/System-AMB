import { DataTypes } from 'sequelize';

import database from '../config/database.js';

const Usuario = database.define(
    'Usuario',
    {
        id_usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: {
                name: 'usuarios_email_unique',
                msg: 'Este e-mail já está cadastrado.'
            },
            validate: {
                notNull: {
                    msg: 'O e-mail é obrigatório.'
                },
                notEmpty: {
                    msg: 'O e-mail é obrigatório.'
                },
                isEmail: {
                    msg: 'Informe um e-mail válido.'
                },
                len: {
                    args: [
                        3,
                        150
                    ],
                    msg: 'O e-mail deve possuir entre 3 e 150 caracteres.'
                }
            },
            set(valor) {
                if (typeof valor !== 'string') {
                    this.setDataValue(
                        'email',
                        valor
                    );

                    return;
                }

                const emailNormalizado = valor
                    .trim()
                    .toLowerCase();

                this.setDataValue(
                    'email',
                    emailNormalizado
                );
            }
        },

        senha: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'A senha é obrigatória.'
                },
                notEmpty: {
                    msg: 'A senha é obrigatória.'
                },
                len: {
                    args: [
                        1,
                        255
                    ],
                    msg: 'A senha armazenada é inválida.'
                }
            }
        }
    },
    {
        tableName: 'tb_usuarios',
        timestamps: true,
        createdAt: 'criado_em',
        updatedAt: 'atualizado_em',
        defaultScope: {
            attributes: {
                exclude: [
                    'senha'
                ]
            }
        },
        indexes: [
            {
                name: 'idx_usuarios_email',
                unique: true,
                fields: [
                    'email'
                ]
            }
        ]
    }
);

export default Usuario;