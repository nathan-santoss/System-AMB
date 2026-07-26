import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import database, {
    testarConexaoBanco
} from './src/config/database.js';

import './src/models/funcionarios.js';
import './src/models/atendimento.js';
import './src/models/alergias.js';
import './src/models/usuarios.js';

import funcionarioRoutes from './src/routes/funcionarioRoutes.js';
import atendimentoRoutes from './src/routes/atendimentoRoutes.js';
import alergiaRoutes from './src/routes/alergiaRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

import {
    criarUsuarioMaster
} from './src/config/masterUser.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const frontendDir = path.join(
    __dirname,
    '../frontend'
);


function ambienteEhProducao() {
    return process.env.NODE_ENV === 'production';
}


function criarLimitador(configuracao) {
    const {
        mensagem,
        ...opcoesLimitador
    } = configuracao;

    return rateLimit({
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        ...opcoesLimitador,
        handler: function (req, res) {
            return res.status(429).json({
                message: mensagem
            });
        }
    });
}


if (ambienteEhProducao()) {
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');


app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [
                    "'self'"
                ],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    'https://cdn.tailwindcss.com',
                    'https://unpkg.com'
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://fonts.googleapis.com'
                ],
                fontSrc: [
                    "'self'",
                    'https://fonts.gstatic.com',
                    'data:'
                ],
                imgSrc: [
                    "'self'",
                    'data:'
                ],
                connectSrc: [
                    "'self'"
                ],
                objectSrc: [
                    "'none'"
                ],
                baseUri: [
                    "'self'"
                ],
                formAction: [
                    "'self'"
                ],
                frameAncestors: [
                    "'none'"
                ]
            }
        }
    })
);


app.use(
    express.json({
        limit: '100kb'
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '100kb'
    })
);


const limitadorApi = criarLimitador({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    mensagem: 'Muitas requisições foram realizadas. Aguarde alguns minutos e tente novamente.'
});

const limitadorLogin = criarLimitador({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    mensagem: 'Muitas tentativas de login foram realizadas. Aguarde 15 minutos e tente novamente.'
});

const limitadorCadastroUsuario = criarLimitador({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    mensagem: 'Muitos cadastros de usuário foram solicitados. Aguarde e tente novamente.'
});


app.use(
    '/api/auth/login',
    limitadorLogin
);

app.use(
    '/api/auth/cadastrar',
    limitadorCadastroUsuario
);

app.use(
    '/api',
    limitadorApi
);


app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(frontendDir, 'views')
);

app.use(
    express.static(
        path.join(frontendDir, 'public'),
        {
            maxAge: ambienteEhProducao()
                ? '1d'
                : 0,
            etag: true
        }
    )
);


app.get('/api/status', function (req, res) {
    return res.status(200).json({
        status: 'online',
        message: 'API do Sistema AMB funcionando.'
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/alergias', alergiaRoutes);

app.get('/', function (req, res) {
    return res.redirect('/login');
});


app.get('/login', function (req, res) {
    return res.render('login');
});


app.get('/dashboard', function (req, res) {
    return res.render('dashboard');
});


app.get('/consultar-paciente', function (req, res) {
    return res.render('consultar-paciente');
});


app.get('/ficha-paciente', function (req, res) {
    return res.render('ficha-paciente');
});


app.use('/api', function (req, res) {
    return res.status(404).json({
        message: 'A rota da API não existe.',
        metodo: req.method,
        rota: req.originalUrl
    });
});


app.use(function (req, res) {
    return res.status(404).send(
        'Página não encontrada.'
    );
});


app.use(function (erro, req, res, next) {
    console.error(
        'Erro interno:',
        erro
    );

    if (res.headersSent) {
        return next(erro);
    }

    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'O JSON enviado é inválido.'
        });
    }

    if (erro.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'O conteúdo enviado ultrapassa o limite permitido.'
        });
    }

    return res.status(500).json({
        message: 'Ocorreu um erro interno no servidor.'
    });
});


async function iniciarServidor() {
    try {
        await testarConexaoBanco();

        console.log(
            'Sincronizando modelos com o banco de dados...'
        );

        await database.sync({
            alter: false,
            force: false
        });

        console.log(
            'Modelos sincronizados com sucesso.'
        );

        await criarUsuarioMaster();

        app.listen(PORT, function () {
            console.log(
                `Servidor rodando na porta ${PORT}.`
            );
        });
    } catch (erro) {
        console.error(
            'Falha ao iniciar o servidor:',
            erro.message
        );

        process.exit(1);
    }
}


iniciarServidor();