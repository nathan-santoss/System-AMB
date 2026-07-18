import { Sequelize } from "sequelize";
import 'dotenv/config';
import mysql2 from 'mysql2';

const database = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        dialectModule: mysql2,
        logging: false
    }
);

export default database;