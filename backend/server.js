import 'dotenv/config';

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './src/models/usuarios.js';
import './src/models/funcionarios.js';
import './src/models/alergias.js';
import './src/models/atendimento.js';

import { sincronizarBanco } from './src/config/database.js';
import { criarUsuarioMaster } from './src/config/masterUser.js';

import authRoutes from './src/routes/authRoutes.js';
import funcionarioRoutes from './src/routes/funcionarioRoutes.js';
import alergiaRoutes from './src/routes/alergiaRoutes.js';
import atendimentoRoutes from './src/routes/atendimentoRoutes.js';


const app = express();

const __filename = fileURLToString(import.meta.url);
const __dirname = path.dirname(__filename);

let porta = 3000;

if (process.env.PORT) {
    porta = Number(process.env.PORT);
}


app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set(
    'views',
    path.join(__dirname, '..', 'frontend', 'views')
);


app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(
    express.static(
        path.join(__dirname, '..', 'frontend', 'public')
    )
);


// páginas

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login'));

app.get('/dashboard', (req, res) => res.render('dashboard'));

app.get('/consultar-paciente', (req, res) =>
    res.render('consultar-paciente')
);

app.get('/ficha-paciente', (req, res) =>
    res.render('ficha-paciente')
);


// APIs

app.use('/api/auth', authRoutes);

app.use('/api/funcionarios', funcionarioRoutes);

app.use('/api/alergias', alergiaRoutes);

app.use('/api/atendimentos', atendimentoRoutes);


// erros

app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'Rota não encontrada.'
    });
});

app.use((req, res) => {
    res.status(404).send(
        'Página não encontrada.'
    );
});

app.use((erro, req, res, next) => {
    console.error(erro);

    res.status(500).json({
        message: 'Erro interno do servidor.'
    });
});


// iniciar

const iniciarServidor = async () => {

    try {

        await sincronizarBanco();

        await criarUsuarioMaster();

        app.listen(porta, () => {
            console.log(
                `Servidor rodando na porta ${porta}`
            );
        });

    } catch (erro) {

        console.error(
            'Falha ao iniciar:',
            erro.message
        );

    }

};


iniciarServidor();