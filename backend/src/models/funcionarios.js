import {
  DataTypes
} from 'sequelize';

import database from '../config/database.js';

const Funcionario = database.define(
  'Funcionario',
  {
    matricula: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,

      validate: {
        notNull: {
          msg: 'A matrícula é obrigatória.'
        },

        notEmpty: {
          msg: 'A matrícula é obrigatória.'
        },

        len: {
          args: [
            1,
            20
          ],
          msg: 'A matrícula deve possuir entre 1 e 20 caracteres.'
        }
      }
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,

      validate: {
        notNull: {
          msg: 'O nome é obrigatório.'
        },

        notEmpty: {
          msg: 'O nome é obrigatório.'
        },

        len: {
          args: [
            2,
            150
          ],
          msg: 'O nome deve possuir entre 2 e 150 caracteres.'
        }
      }
    },

    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,

      unique: {
        name: 'funcionarios_cpf_unique',
        msg: 'Este CPF já está cadastrado.'
      },

      validate: {
        notNull: {
          msg: 'O CPF é obrigatório.'
        },

        notEmpty: {
          msg: 'O CPF é obrigatório.'
        },

        isNumeric: {
          msg: 'O CPF deve possuir somente números.'
        },

        len: {
          args: [
            11,
            11
          ],
          msg: 'O CPF deve possuir exatamente 11 números.'
        }
      }
    },

    cargo: {
      type: DataTypes.STRING(150),
      allowNull: true,

      validate: {
        len: {
          args: [
            0,
            150
          ],
          msg: 'O cargo deve possuir no máximo 150 caracteres.'
        }
      }
    },

    setor: {
      type: DataTypes.STRING(150),
      allowNull: true,

      validate: {
        len: {
          args: [
            0,
            150
          ],
          msg: 'O setor deve possuir no máximo 150 caracteres.'
        }
      }
    },

    nucleo: {
      type: DataTypes.STRING(150),
      allowNull: true,

      validate: {
        len: {
          args: [
            0,
            150
          ],
          msg: 'O núcleo deve possuir no máximo 150 caracteres.'
        }
      }
    },

    supervisor: {
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
      }
    },

    coordenador: {
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
      }
    },

    gerente: {
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
      }
    }
  },
  {
    tableName: 'tb_funcionarios',
    timestamps: false,

    indexes: [
      {
        name: 'idx_funcionarios_nome',
        fields: [
          'nome'
        ]
      },

      {
        name: 'idx_funcionarios_setor',
        fields: [
          'setor'
        ]
      }
    ]
  }
);

export default Funcionario;