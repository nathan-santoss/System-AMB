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
                msg: 'Este email já está cadastrado.'
            },

            validate: {
                notNull: {
                    msg: 'O email é obrigatório.'
                },

                notEmpty: {
                    msg: 'O email é obrigatório.'
                },

                isEmail: {
                    msg: 'Informe um email válido.'
                },

                len: {
                    args: [
                        3,
                        150
                    ],
                    msg: 'O email deve possuir entre 3 e 150 caracteres.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    const emailNormalizado = valor
                        .trim()
                        .toLowerCase();

                    this.setDataValue(
                        'email',
                        emailNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'email',
                    valor
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
                        8,
                        255
                    ],
                    msg: 'A senha deve possuir entre 8 e 255 caracteres.'
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

        scopes: {
            comSenha: {
                attributes: {
                    include: [
                        'senha'
                    ]
                }
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