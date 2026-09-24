import app from './app.js';
import database, { sincronizarBanco } from './src/config/database.js';
import { criarUsuarioMaster } from './src/config/masterUser.js';

let porta = 3000;
if (process.env.PORT) porta = Number(process.env.PORT);

// iniciar servidor

const iniciarServidor = async () => {
    try {
        await sincronizarBanco();

        await criarUsuarioMaster();

        const servidor = app.listen(porta, () => {
            console.log(`Servidor rodando na porta ${porta}`);
        });
        servidor.on('error', async (erro) => {
            console.error('Falha ao abrir a porta do servidor:', erro.message);
            process.exitCode = 1;
            await database.close();
        });
    } catch (erro) {
        process.exitCode = 1;
        await database.close();

        console.error('Falha ao iniciar:', erro.message);
    }
};

iniciarServidor();
