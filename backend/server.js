import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import database from './src/config/database.js';
import cors from 'cors';

// Importação dos Modelos
import Funcionario from './src/models/funcionarios.js';
import Atendimento from './src/models/atendimento.js';
import Alergia from './src/models/alergias.js';
import Atestado from './src/models/atestados.js';
import Usuario from './src/models/usuarios.js';

// Importação das Rotas
import funcionarioRoutes from './src/routes/funcionarioRoutes.js';
import atendimentoRoutes from './src/routes/atendimentoRoutes.js';
import alergiaRoutes from './src/routes/alergiaRoutes.js';
import atestadoRoutes from './src/routes/atestadoRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

import { criarUsuarioMaster } from './src/config/masterUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração básica de CORS
app.use(cors({
    origin: '*',
    credentials: true 
}));

app.use(express.json());

// EJS estáticos
const frontendDir = path.join(__dirname, '../frontend');
app.set('view engine', 'ejs');
app.set('views', path.join(frontendDir, 'views'));
app.use(express.static(path.join(frontendDir, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/alergias', alergiaRoutes);
app.use('/api/atestados', atestadoRoutes);

// Rotas EJS
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/consultar-paciente', (req, res) => res.render('consultar-paciente'));
app.get('/ficha-paciente', (req, res) => res.render('ficha-paciente'));

// Rota 404 sendo fallback para rotas inexistentes
app.use('/api/*', (req, res) => res.status(404).json({ message: 'A rota da API não existe.' }));
app.use('*', (req, res) => res.status(404).send('Página não encontrada.'));

// Middleware de erro global para pegar exceções não tratadas
app.use((err, req, res, next) => {
    console.error("Erro interno:", err);
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

async function iniciarServidor() {
    try {
        await database.authenticate();
        console.log("Conexão com o banco estabelecida.");

        await database.sync(); 
        
        await criarUsuarioMaster();

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (erro) {
        console.error("Banco de dados ainda não está pronto. Tentando novamente...", erro);
        setTimeout(iniciarServidor, 5000);
    }
}
iniciarServidor();