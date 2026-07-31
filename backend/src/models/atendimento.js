import {
    DataTypes
} from 'sequelize';

import database from '../config/database.js';

import Funcionario from './funcionarios.js';

import {
    normalizarTexto,
    normalizarTextoOpcional
} from '../utils/normalizadores.js';

const GRAVIDADES_PERMITIDAS = [
    'Baixa',
    'Média',
    'Alta'
];

const ACOES_PERMITIDAS = [
    'Medicação no Local',
    'Encaminhado UPA',
    'Liberado'
];

function normalizarTemperatura(valor) {
    if (valor === null) {
        return null;
    }

    if (valor === undefined) {
        return valor;
    }

    if (typeof valor === 'string') {
        const temperaturaNormalizada = valor
            .trim()
            .replace(',', '.');

        if (temperaturaNormalizada.length === 0) {
            return null;
        }

        return temperaturaNormalizada;
    }

    return valor;
}

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
                    msg: 'A matrícula deve possuir entre 1 e 20 caracteres.'
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
                },

                len: {
                    args: [
                        2,
                        5000
                    ],
                    msg: 'A queixa principal deve possuir entre 2 e 5000 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'queixa_principal',
                    normalizarTexto(valor)
                );
            }
        },

        pressao_arterial: {
            type: DataTypes.STRING(20),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A pressão arterial é obrigatória.'
                },

                notEmpty: {
                    msg: 'A pressão arterial é obrigatória.'
                },

                len: {
                    args: [
                        1,
                        20
                    ],
                    msg: 'A pressão arterial deve possuir entre 1 e 20 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'pressao_arterial',
                    normalizarTexto(valor)
                );
            }
        },

        temperatura: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,

            validate: {
                notNull: {
                    msg: 'A temperatura é obrigatória.'
                },

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
                this.setDataValue(
                    'temperatura',
                    normalizarTemperatura(valor)
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
                        GRAVIDADES_PERMITIDAS
                    ],
                    msg: 'A gravidade deve ser Baixa, Média ou Alta.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'gravidade',
                    normalizarTexto(valor)
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

                isIn: {
                    args: [
                        ACOES_PERMITIDAS
                    ],
                    msg: 'A ação tomada informada não é permitida.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'acao_tomada',
                    normalizarTexto(valor)
                );
            }
        },

        local_encaminhamento: {
            type: DataTypes.STRING(150),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        150
                    ],
                    msg: 'O local de encaminhamento deve possuir no máximo 150 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'local_encaminhamento',
                    normalizarTextoOpcional(valor)
                );
            }
        },

        supervisor_na_epoca: {
            type: DataTypes.STRING(150),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        150
                    ],
                    msg: 'O supervisor deve possuir no máximo 150 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'supervisor_na_epoca',
                    normalizarTextoOpcional(valor)
                );
            }
        },

        coordenador_na_epoca: {
            type: DataTypes.STRING(150),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        150
                    ],
                    msg: 'O coordenador deve possuir no máximo 150 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'coordenador_na_epoca',
                    normalizarTextoOpcional(valor)
                );
            }
        },

        gerente_na_epoca: {
            type: DataTypes.STRING(150),
            allowNull: true,

            validate: {
                len: {
                    args: [
                        0,
                        150
                    ],
                    msg: 'O gerente deve possuir no máximo 150 caracteres.'
                }
            },

            set(valor) {
                this.setDataValue(
                    'gerente_na_epoca',
                    normalizarTextoOpcional(valor)
                );
            }
        },

        data_hora_saida: {
            type: DataTypes.DATE,
            allowNull: true
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