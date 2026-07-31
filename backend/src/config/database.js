import { Sequelize } from "sequelize";
import "dotenv/config";
import pg from 'pg'
import pgHstore from 'pg-hstore'

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
}

const database = new Sequelize(
    process.env.DATABASE_URL,
    {
        dialect: "postgres",

        logging: false,

        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        define: {
            freezeTableName: true
        }
    }
);

export async function sincronizarBanco() {
    try {
        await database.authenticate();

        console.log(
            "Conectado ao PostgreSQL Neon com sucesso."
        );

        await database.sync();

        console.log(
            "Banco sincronizado com sucesso."
        );

    } catch (erro) {
        console.error(
            "Erro ao conectar ao PostgreSQL:",
            erro.message
        );

        throw erro;
    }
}

export default database;