import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ejs from 'ejs';

function verificar(caminho) {
    if (statSync(caminho).isDirectory()) {
        for (const arquivo of readdirSync(caminho)) verificar(join(caminho, arquivo));
    } else if (/\.(m?js)$/.test(caminho)) {
        const resultado = spawnSync(process.execPath, ['--check', caminho], { stdio: 'inherit' });
        if (resultado.error) throw resultado.error;
        if (resultado.status !== 0) process.exitCode = 1;
    } else if (caminho.endsWith('.ejs')) {
        // Compila sem acessar o banco e detecta marcadores corrompidos por formatadores.
        const conteudo = readFileSync(caminho, 'utf8');
        if (conteudo.includes('<!=') || conteudo.includes('!>')) {
            throw new Error('Marcador de template inválido em ' + caminho);
        }
        ejs.compile(conteudo, { filename: caminho });
    }
}

for (const caminho of process.argv.slice(2)) verificar(caminho);
