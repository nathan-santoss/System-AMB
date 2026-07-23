import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import 'dotenv/config';


function obterUrlConexao() {

    const variaveisUrl = [
        'MYSQL_URL',
        'DATABASE_URL',
        'MYSQL_PUBLIC_URL'
    ];

    for (const nomeVariavel of variaveisUrl) {

        const valor = process.env[nomeVariavel];

        if (typeof valor === 'string') {

            const urlNormalizada = valor.trim();

            if (urlNormalizada.length > 0) {

                return urlNormalizada;

            }

        }

    }

    return null;

}


function obterConfiguracaoManual() {

    const nomeBanco = process.env.DB_NAME;
    const usuarioBanco = process.env.DB_USER;
    const senhaBanco = process.env.DB_PASS;
    const hostBanco = process.env.DB_HOST;
    const portaBanco = process.env.DB_PORT;

    const variaveisObrigatorias = {
        DB_NAME: nomeBanco,
        DB_USER: usuarioBanco,
        DB_HOST: hostBanco,
        DB_PORT: portaBanco
    };

    const variaveisAusentes = [];

    Object.entries(variaveisObrigatorias).forEach(
        ([nomeVariavel, valorVariavel]) => {

            if (typeof valorVariavel !== 'string') {

                variaveisAusentes.push(nomeVariavel);

                return;

            }

            if (valorVariavel.trim().length === 0) {

                variaveisAusentes.push(nomeVariavel);

            }

        }
    );

    if (variaveisAusentes.length > 0) {

        throw new Error(
            `Variáveis de banco ausentes: ${variaveisAusentes.join(', ')}`
        );

    }

    const portaNumerica = Number(
        portaBanco
    );

    if (!Number.isInteger(portaNumerica)) {

        throw new Error(
            'DB_PORT deve possuir uma porta numérica válida.'
        );

    }

    if (portaNumerica <= 0 || portaNumerica > 65535) {

        throw new Error(
            'DB_PORT deve estar entre 1 e 65535.'
        );

    }

    let senhaNormalizada = '';

    if (typeof senhaBanco === 'string') {

        senhaNormalizada = senhaBanco;

    }

    return {
        nomeBanco: nomeBanco.trim(),
        usuarioBanco: usuarioBanco.trim(),
        senhaBanco: senhaNormalizada,
        hostBanco: hostBanco.trim(),
        portaBanco: portaNumerica
    };

}


function criarInstanciaBanco() {

    const opcoesConexao = {
        dialect: 'mysql',
        dialectModule: mysql2,
        logging: false,
        define: {
            freezeTableName: true
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        retry: {
            max: 3
        }
    };

    const urlConexao = obterUrlConexao();

    if (urlConexao) {

        if (
            !urlConexao.startsWith('mysql://') &&
            !urlConexao.startsWith('mysql2://')
        ) {

            throw new Error(
                'A URL de conexão deve utilizar o protocolo mysql://.'
            );

        }

        let urlNormalizada = urlConexao;

        if (urlNormalizada.startsWith('mysql2://')) {

            urlNormalizada = urlNormalizada.replace(
                'mysql2://',
                'mysql://'
            );

        }

        return new Sequelize(
            urlNormalizada,
            opcoesConexao
        );

    }

    const configuracaoManual = obterConfiguracaoManual();

    return new Sequelize(
        configuracaoManual.nomeBanco,
        configuracaoManual.usuarioBanco,
        configuracaoManual.senhaBanco,
        {
            ...opcoesConexao,
            host: configuracaoManual.hostBanco,
            port: configuracaoManual.portaBanco
        }
    );

}


const database = criarInstanciaBanco();


export async function testarConexaoBanco() {

    try {

        await database.authenticate();

        console.log(
            'Banco de dados conectado com sucesso.'
        );

        return true;

    } catch (erro) {

        console.error(
            'Erro ao conectar ao banco de dados:',
            erro.message
        );

        throw erro;

    }

}


export async function fecharConexaoBanco() {

    try {

        await database.close();

        console.log(
            'Conexão com o banco de dados encerrada.'
        );

    } catch (erro) {

        console.error(
            'Erro ao encerrar a conexão com o banco de dados:',
            erro.message
        );

        throw erro;

    }

}


export default database;