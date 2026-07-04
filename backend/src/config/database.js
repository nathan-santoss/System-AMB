import { Sequelize } from "sequelize";
import 'dotenv/config';
import mysql2 from 'mysql2'

console.log({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER
});

const database = new Sequelize(
    process.env.MYSQL_PUBLIC_URL,
    {
        dialect: 'mysql',
    }
);

export default database;