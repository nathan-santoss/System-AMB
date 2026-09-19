import { Sequelize } from "sequelize";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
}

// O Sequelize lê SSL também pela URL; evita que sslmode=require/no-verify
// sobrescreva a validação do certificado definida pela aplicação.
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('sslmode', process.env.DATABASE_SSL === 'false' ? 'disable' : 'verify-full');

const database = new Sequelize(
    databaseUrl.toString(),
    {
        dialect: "postgres",

        logging: false,

        dialectOptions: {
            ssl: process.env.DATABASE_SSL === 'false' ? false : {
                require: true,
                rejectUnauthorized: true
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
