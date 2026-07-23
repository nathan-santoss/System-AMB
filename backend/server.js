import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import database, {
    testarConexaoBanco
} from './src/config/database.js';

import './src/models/funcionarios.js';
import './src/models/atendimento.js';
import './src/models/alergias.js';
import './src/models/atestados.js';
import './src/models/usuarios.js';

import funcionarioRoutes from './src/routes/funcionarioRoutes.js';
import atendimentoRoutes from './src/routes/atendimentoRoutes.js';
import alergiaRoutes from './src/routes/alergiaRoutes.js';
import atestadoRoutes from './src/routes/atestadoRoutes.js';
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


// Configurações principais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


// Configuração do frontend
app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(frontendDir, 'views')
);

app.use(
    express.static(
        path.join(frontendDir, 'public')
    )
);


// Status da API
app.get('/api/status', (req, res) => {

    return res.status(200).json({
        status: 'online',
        message: 'API do Sistema AMB funcionando.'
    });

});


// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/alergias', alergiaRoutes);
app.use('/api/atestados', atestadoRoutes);


// Rotas das páginas
app.get('/', (req, res) => {

    return res.redirect('/login');

});


app.get('/login', (req, res) => {

    return res.render('login');

});


app.get('/dashboard', (req, res) => {

    return res.render('dashboard');

});


app.get('/consultar-paciente', (req, res) => {

    return res.render('consultar-paciente');

});


app.get('/ficha-paciente', (req, res) => {

    return res.render('ficha-paciente');

});


// Rotas da API não encontradas
app.use('/api', (req, res) => {

    return res.status(404).json({
        message: 'A rota da API não existe.',
        metodo: req.method,
        rota: req.originalUrl
    });

});


// Páginas não encontradas
app.use((req, res) => {

    return res.status(404).send(
        'Página não encontrada.'
    );

});


// Tratamento global de erros
app.use((erro, req, res, next) => {

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

    return res.status(500).json({
        message: 'Ocorreu um erro interno no servidor.'
    });

});


// Inicialização do servidor
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

        console.log(
            'Usuário master verificado com sucesso.'
        );

        app.listen(PORT, () => {

            console.log(
                `Servidor rodando em http://localhost:${PORT}`
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