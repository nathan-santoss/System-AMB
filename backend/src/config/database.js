import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import 'dotenv/config';

const VARIAVEIS_URL = [
    'MYSQL_URL',
    'DATABASE_URL',
    'MYSQL_PUBLIC_URL'
];

function textoPreenchido(valor) {
    if (typeof valor !== 'string') {
        return false;
    }

    if (valor.trim().length === 0) {
        return false;
    }

    return true;
}

function obterUrlConexao() {
    for (const nomeVariavel of VARIAVEIS_URL) {
        const valor = process.env[nomeVariavel];

        if (textoPreenchido(valor)) {
            return valor.trim();
        }
    }

    return null;
}

function obterSenhaBanco() {
    const senhaBanco = process.env.DB_PASS;

    if (typeof senhaBanco !== 'string') {
        return '';
    }

    return senhaBanco;
}

function obterConfiguracaoManual() {
    const nomeBanco = process.env.DB_NAME;
    const usuarioBanco = process.env.DB_USER;
    const senhaBanco = obterSenhaBanco();
    const hostBanco = process.env.DB_HOST;
    const portaBancoTexto = process.env.DB_PORT;

    const variaveisAusentes = [];

    if (!textoPreenchido(nomeBanco)) {
        variaveisAusentes.push('DB_NAME');
    }

    if (!textoPreenchido(usuarioBanco)) {
        variaveisAusentes.push('DB_USER');
    }

    if (!textoPreenchido(hostBanco)) {
        variaveisAusentes.push('DB_HOST');
    }

    if (!textoPreenchido(portaBancoTexto)) {
        variaveisAusentes.push('DB_PORT');
    }

    if (variaveisAusentes.length > 0) {
        throw new Error(
            `Variáveis de banco ausentes: ${variaveisAusentes.join(', ')}`
        );
    }

    const portaBanco = Number(portaBancoTexto);

    if (!Number.isInteger(portaBanco)) {
        throw new Error(
            'DB_PORT deve possuir uma porta numérica válida.'
        );
    }

    if (portaBanco <= 0 || portaBanco > 65535) {
        throw new Error(
            'DB_PORT deve possuir uma porta numérica válida.'
        );
    }

    return {
        nomeBanco: nomeBanco.trim(),
        usuarioBanco: usuarioBanco.trim(),
        senhaBanco,
        hostBanco: hostBanco.trim(),
        portaBanco
    };
}

function obterOpcoesConexao() {
    return {
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
}

function normalizarUrlConexao(urlConexao) {
    const utilizaMysql = urlConexao.startsWith('mysql://');
    const utilizaMysql2 = urlConexao.startsWith('mysql2://');

    if (!utilizaMysql && !utilizaMysql2) {
        throw new Error(
            'A URL de conexão deve utilizar o protocolo mysql:// ou mysql2://.'
        );
    }

    if (utilizaMysql2) {
        return urlConexao.replace(
            'mysql2://',
            'mysql://'
        );
    }

    return urlConexao;
}

function criarInstanciaBanco() {
    const opcoesConexao = obterOpcoesConexao();
    const urlConexao = obterUrlConexao();

    if (urlConexao !== null) {
        const urlNormalizada = normalizarUrlConexao(urlConexao);

        return new Sequelize(
            urlNormalizada,
            opcoesConexao
        );
    }

    const configuracao = obterConfiguracaoManual();

    const opcoesConexaoManual = {
        ...opcoesConexao,
        host: configuracao.hostBanco,
        port: configuracao.portaBanco
    };

    return new Sequelize(
        configuracao.nomeBanco,
        configuracao.usuarioBanco,
        configuracao.senhaBanco,
        opcoesConexaoManual
    );
}

const database = criarInstanciaBanco();

export async function sincronizarBanco() {
    try {
        await database.authenticate();
        await database.sync();

        console.log(
            'Banco de dados conectado e sincronizado com sucesso.'
        );
    } catch (erro) {
        console.error(
            'Erro ao conectar ou sincronizar o banco de dados:',
            erro.message
        );

        throw erro;
    }
}

export default database;