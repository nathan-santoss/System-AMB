import { DataTypes } from 'sequelize';
import database from '../config/database.js';
import Funcionario from './funcionarios.js';


const Atestado = database.define(
    'Atestado',
    {
        id_atestado: {
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


        data_emissao: {
            type: DataTypes.DATEONLY,
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A data de emissão é obrigatória.'
                },

                isDate: {
                    msg: 'A data de emissão deve ser uma data válida.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'data_emissao',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'data_emissao',
                    valor
                );

            }
        },


        tipo_afastamento: {
            type: DataTypes.STRING(50),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'O tipo de afastamento é obrigatório.'
                },

                notEmpty: {
                    msg: 'O tipo de afastamento é obrigatório.'
                },

                isIn: {
                    args: [
                        [
                            'Doença',
                            'Acidente',
                            'Consulta',
                            'Outro'
                        ]
                    ],
                    msg: 'O tipo de afastamento deve ser Doença, Acidente, Consulta ou Outro.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'tipo_afastamento',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'tipo_afastamento',
                    valor
                );

            }
        },


        quantidade: {
            type: DataTypes.INTEGER,
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A quantidade de afastamento é obrigatória.'
                },

                isInt: {
                    msg: 'A quantidade deve ser um número inteiro.'
                },

                min: {
                    args: [
                        1
                    ],
                    msg: 'A quantidade deve ser maior que zero.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'quantidade',
                            valor
                        );

                        return;

                    }

                    this.setDataValue(
                        'quantidade',
                        Number(valorNormalizado)
                    );

                    return;

                }

                this.setDataValue(
                    'quantidade',
                    valor
                );

            }
        },


        cid_codigo: {
            type: DataTypes.STRING(20),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        20
                    ],
                    msg: 'O código CID deve possuir no máximo 20 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'cid_codigo',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'cid_codigo',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'cid_codigo',
                        valorNormalizado.toUpperCase()
                    );

                    return;

                }

                this.setDataValue(
                    'cid_codigo',
                    valor
                );

            }
        },


        caminho_anexo: {
            type: DataTypes.STRING(255),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        255
                    ],
                    msg: 'O caminho do anexo deve possuir no máximo 255 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'caminho_anexo',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'caminho_anexo',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'caminho_anexo',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'caminho_anexo',
                    valor
                );

            }
        },


        supervisor_na_epoca: {
            type: DataTypes.STRING(100),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        100
                    ],
                    msg: 'O supervisor deve possuir no máximo 100 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'supervisor_na_epoca',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'supervisor_na_epoca',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'supervisor_na_epoca',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'supervisor_na_epoca',
                    valor
                );

            }
        },


        coordenador_na_epoca: {
            type: DataTypes.STRING(100),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        100
                    ],
                    msg: 'O coordenador deve possuir no máximo 100 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'coordenador_na_epoca',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'coordenador_na_epoca',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'coordenador_na_epoca',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'coordenador_na_epoca',
                    valor
                );

            }
        },


        gerente_na_epoca: {
            type: DataTypes.STRING(100),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        100
                    ],
                    msg: 'O gerente deve possuir no máximo 100 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'gerente_na_epoca',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'gerente_na_epoca',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'gerente_na_epoca',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'gerente_na_epoca',
                    valor
                );

            }
        }
    },
    {
        tableName: 'tb_atestados',

        timestamps: true,

        createdAt: 'criado_em',

        updatedAt: 'atualizado_em',

        indexes: [
            {
                name: 'idx_atestados_funcionario_matricula',
                fields: [
                    'funcionario_matricula'
                ]
            },
            {
                name: 'idx_atestados_data_emissao',
                fields: [
                    'data_emissao'
                ]
            },
            {
                name: 'idx_atestados_tipo_afastamento',
                fields: [
                    'tipo_afastamento'
                ]
            }
        ]
    }
);


// Um funcionário pode possuir vários atestados
Funcionario.hasMany(
    Atestado,
    {
        foreignKey: {
            name: 'funcionario_matricula',
            allowNull: false
        },

        sourceKey: 'matricula',

        as: 'atestados',

        onUpdate: 'CASCADE',

        onDelete: 'RESTRICT'
    }
);


// Cada atestado pertence a um funcionário
Atestado.belongsTo(
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


export default Atestado;