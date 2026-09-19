import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function verificar(caminho) {
    if (statSync(caminho).isDirectory()) {
        for (const arquivo of readdirSync(caminho)) verificar(join(caminho, arquivo));
    } else if (/\.(m?js)$/.test(caminho)) {
        const resultado = spawnSync(process.execPath, ['--check', caminho], { stdio: 'inherit' });
        if (resultado.error) throw resultado.error;
        if (resultado.status !== 0) process.exitCode = 1;
    }
}

for (const caminho of process.argv.slice(2)) verificar(caminho);
