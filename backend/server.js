import 'dotenv/config';

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './src/models/usuarios.js';
import './src/models/funcionarios.js';
import './src/models/alergias.js';
import './src/models/atendimento.js';

import {
    sincronizarBanco
} from './src/config/database.js';

import {
    criarUsuarioMaster
} from './src/config/masterUser.js';

import authRoutes from './src/routes/authRoutes.js';
import funcionarioRoutes from './src/routes/funcionarioRoutes.js';
import alergiaRoutes from './src/routes/alergiaRoutes.js';
import atendimentoRoutes from './src/routes/atendimentoRoutes.js';

const caminhoArquivoAtual = fileURLToPath(
    import.meta.url
);

const diretorioRaiz = path.dirname(
    caminhoArquivoAtual
);

const app = express();

function obterPortaServidor() {
    const portaPadrao = 3000;
    const portaConfigurada = process.env.PORT;

    if (
        typeof portaConfigurada !== 'string' ||
        portaConfigurada.trim().length === 0
    ) {
        return portaPadrao;
    }

    const porta = Number(
        portaConfigurada
    );

    if (
        !Number.isInteger(porta) ||
        porta <= 0 ||
        porta > 65535
    ) {
        throw new Error(
            'PORT deve possuir uma porta numérica válida.'
        );
    }

    return porta;
}

function renderizarPagina(nomePagina) {
    return function (req, res) {
        res.set(
            'Cache-Control',
            'no-store'
        );

        return res.render(
            nomePagina
        );
    };
}

app.disable(
    'x-powered-by'
);

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(
        diretorioRaiz,
        'src',
        'views'
    )
);

app.use(
    express.json({
        limit: '1mb'
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: '1mb'
    })
);

app.use(
    express.static(
        path.join(
            diretorioRaiz,
            'public'
        )
    )
);

app.get(
    '/',
    function (req, res) {
        return res.redirect(
            '/login'
        );
    }
);

app.get(
    '/login',
    renderizarPagina(
        'login'
    )
);

app.get(
    '/dashboard',
    renderizarPagina(
        'dashboard'
    )
);

app.get(
    '/consultar-paciente',
    renderizarPagina(
        'consultar-paciente'
    )
);

app.get(
    '/ficha-paciente',
    renderizarPagina(
        'ficha-paciente'
    )
);

app.use(
    '/api/auth',
    authRoutes
);

app.use(
    '/api/funcionarios',
    funcionarioRoutes
);

app.use(
    '/api/alergias',
    alergiaRoutes
);

app.use(
    '/api/atendimentos',
    atendimentoRoutes
);

app.use(
    '/api',
    function (req, res) {
        return res.status(404).json({
            message: 'Rota da API não encontrada.'
        });
    }
);

app.use(
    function (req, res) {
        return res.status(404).send(
            'Página não encontrada.'
        );
    }
);

app.use(
    function (erro, req, res, next) {
        console.error(
            'Erro não tratado na aplicação:',
            erro
        );

        if (res.headersSent) {
            return next(
                erro
            );
        }

        if (
            req.originalUrl.startsWith(
                '/api/'
            )
        ) {
            return res.status(500).json({
                message: 'Erro interno do servidor.'
            });
        }

        return res.status(500).send(
            'Erro interno do servidor.'
        );
    }
);

async function iniciarServidor() {
    try {
        const porta = obterPortaServidor();

        await sincronizarBanco();

        await criarUsuarioMaster();

        app.listen(
            porta,
            function () {
                console.log(
                    `Servidor executando na porta ${porta}.`
                );
            }
        );
    } catch (erro) {
        console.error(
            'Erro ao iniciar o servidor:',
            erro
        );

        process.exit(1);
    }
}

iniciarServidor();