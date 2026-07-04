import { DataTypes } from "sequelize";
import database from "../config/database.js";

const Funcionario = database.define("Funcionario", {
    matricula: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cpf: {
      type: DataTypes.STRING(11),
      unique: true,
      allowNull: true,
    },
    cargo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    setor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nucleo: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    supervisor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    coordenador: {
      type: DataTypes.STRING(100),
      allowNull: true, 
    },
    gerente: {
      type: DataTypes.STRING(100),
      allowNull: true, 
    }
  }, {
    tableName: "tb_funcionarios",
    timestamps: false,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
)

export default Funcionario;