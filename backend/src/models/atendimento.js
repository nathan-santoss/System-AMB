import { DataTypes } from 'sequelize';
import database from '../config/database.js';
import Funcionario from './funcionarios.js';


const Atendimento = database.define(
    'Atendimento',
    {
        id_atendimento: {
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


        queixa_principal: {
            type: DataTypes.TEXT,
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A queixa principal é obrigatória.'
                },

                notEmpty: {
                    msg: 'A queixa principal é obrigatória.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'queixa_principal',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'queixa_principal',
                    valor
                );

            }
        },


        pressao_arterial: {
            type: DataTypes.STRING(20),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        20
                    ],
                    msg: 'A pressão arterial deve possuir no máximo 20 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'pressao_arterial',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'pressao_arterial',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'pressao_arterial',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'pressao_arterial',
                    valor
                );

            }
        },


        temperatura: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,

            validate: {
                isDecimal: {
                    msg: 'A temperatura deve ser um número válido.'
                },

                min: {
                    args: [
                        0
                    ],
                    msg: 'A temperatura não pode ser menor que zero.'
                },

                max: {
                    args: [
                        100
                    ],
                    msg: 'A temperatura não pode ser maior que 100.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'temperatura',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'temperatura',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'temperatura',
                        Number(valorNormalizado)
                    );

                    return;

                }

                this.setDataValue(
                    'temperatura',
                    valor
                );

            }
        },


        gravidade: {
            type: DataTypes.STRING(20),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A gravidade é obrigatória.'
                },

                notEmpty: {
                    msg: 'A gravidade é obrigatória.'
                },

                isIn: {
                    args: [
                        [
                            'Baixa',
                            'Média',
                            'Alta'
                        ]
                    ],
                    msg: 'A gravidade deve ser Baixa, Média ou Alta.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'gravidade',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'gravidade',
                    valor
                );

            }
        },


        acao_tomada: {
            type: DataTypes.STRING(100),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A ação tomada é obrigatória.'
                },

                notEmpty: {
                    msg: 'A ação tomada é obrigatória.'
                },

                len: {
                    args: [
                        1,
                        100
                    ],
                    msg: 'A ação tomada deve possuir entre 1 e 100 caracteres.'
                }
            },

            set(valor) {

                if (typeof valor === 'string') {

                    this.setDataValue(
                        'acao_tomada',
                        valor.trim()
                    );

                    return;

                }

                this.setDataValue(
                    'acao_tomada',
                    valor
                );

            }
        },


        local_encaminhamento: {
            type: DataTypes.STRING(100),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        100
                    ],
                    msg: 'O local de encaminhamento deve possuir no máximo 100 caracteres.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'local_encaminhamento',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'local_encaminhamento',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'local_encaminhamento',
                        valorNormalizado
                    );

                    return;

                }

                this.setDataValue(
                    'local_encaminhamento',
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
        },


        data_hora_saida: {
            type: DataTypes.DATE,
            allowNull: true,

            validate: {
                isDate: {
                    msg: 'A data e hora de saída devem ser válidas.'
                }
            },

            set(valor) {

                if (valor === null || valor === undefined) {

                    this.setDataValue(
                        'data_hora_saida',
                        null
                    );

                    return;

                }

                if (typeof valor === 'string') {

                    const valorNormalizado = valor.trim();

                    if (valorNormalizado.length === 0) {

                        this.setDataValue(
                            'data_hora_saida',
                            null
                        );

                        return;

                    }

                    this.setDataValue(
                        'data_hora_saida',
                        new Date(valorNormalizado)
                    );

                    return;

                }

                this.setDataValue(
                    'data_hora_saida',
                    valor
                );

            }
        }
    },
    {
        tableName: 'tb_atendimento',

        timestamps: true,

        createdAt: 'data_hora_entrada',

        updatedAt: 'atualizado_em',

        indexes: [
            {
                name: 'idx_atendimento_funcionario_matricula',
                fields: [
                    'funcionario_matricula'
                ]
            },
            {
                name: 'idx_atendimento_data_hora_entrada',
                fields: [
                    'data_hora_entrada'
                ]
            },
            {
                name: 'idx_atendimento_gravidade',
                fields: [
                    'gravidade'
                ]
            },
            {
                name: 'idx_atendimento_funcionario_data',
                fields: [
                    'funcionario_matricula',
                    'data_hora_entrada'
                ]
            }
        ]
    }
);


// Um funcionário pode possuir vários atendimentos
Funcionario.hasMany(
    Atendimento,
    {
        foreignKey: {
            name: 'funcionario_matricula',
            allowNull: false
        },

        sourceKey: 'matricula',

        as: 'atendimentos',

        onUpdate: 'CASCADE',

        onDelete: 'RESTRICT'
    }
);


// Cada atendimento pertence a um funcionário
Atendimento.belongsTo(
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


export default Atendimento;