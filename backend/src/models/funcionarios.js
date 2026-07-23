import { DataTypes } from 'sequelize';
import database from '../config/database.js';


const Funcionario = database.define(
  'Funcionario',
  {
    matricula: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,

      validate: {
        notEmpty: {
          msg: 'A matrícula é obrigatória.'
        },

        len: {
          args: [1, 20],
          msg: 'A matrícula deve possuir entre 1 e 20 caracteres.'
        }
      },

      set(valor) {
        if (typeof valor === 'number') {
          this.setDataValue(
            'matricula',
            String(valor).trim()
          );

          return;
        }

        if (typeof valor === 'string') {
          this.setDataValue(
            'matricula',
            valor.trim()
          );

          return;
        }

        this.setDataValue(
          'matricula',
          valor
        );
      }
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,

      validate: {
        notEmpty: {
          msg: 'O nome do funcionário é obrigatório.'
        },

        len: {
          args: [2, 150],
          msg: 'O nome deve possuir entre 2 e 150 caracteres.'
        }
      },

      set(valor) {
        if (typeof valor === 'string') {
          this.setDataValue(
            'nome',
            valor.trim()
          );

          return;
        }

        this.setDataValue(
          'nome',
          valor
        );
      }
    },

    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,

      validate: {
        notEmpty: {
          msg: 'O CPF é obrigatório.'
        },

        is: {
          args: /^\d{11}$/,
          msg: 'O CPF deve possuir exatamente 11 números.'
        }
      },

      set(valor) {
        if (typeof valor === 'number') {
          this.setDataValue(
            'cpf',
            String(valor).trim()
          );

          return;
        }

        if (typeof valor === 'string') {
          const cpfNormalizado = valor.replace(
            /\D/g,
            ''
          );

          this.setDataValue(
            'cpf',
            cpfNormalizado
          );

          return;
        }

        this.setDataValue(
          'cpf',
          valor
        );
      }
    },

    cargo: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'cargo',
          normalizarTextoOpcional(valor)
        );
      }
    },

    setor: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'setor',
          normalizarTextoOpcional(valor)
        );
      }
    },

    nucleo: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'nucleo',
          normalizarTextoOpcional(valor)
        );
      }
    },

    supervisor: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'supervisor',
          normalizarTextoOpcional(valor)
        );
      }
    },

    coordenador: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'coordenador',
          normalizarTextoOpcional(valor)
        );
      }
    },

    gerente: {
      type: DataTypes.STRING(100),
      allowNull: true,

      set(valor) {
        this.setDataValue(
          'gerente',
          normalizarTextoOpcional(valor)
        );
      }
    }
  },
  {
    tableName: 'tb_funcionarios',
    timestamps: false
  }
);


function normalizarTextoOpcional(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor !== 'string') {
    return valor;
  }

  const valorNormalizado = valor.trim();

  if (valorNormalizado.length === 0) {
    return null;
  }

  return valorNormalizado;
}


export default Funcionario;