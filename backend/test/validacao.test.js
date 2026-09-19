import test from 'node:test';
import assert from 'node:assert/strict';
import { cpfEhValido } from '../src/utils/validadores.js';
import { criarFimDoMes } from '../src/utils/datas.js';
import { obterJwtSecret } from '../src/config/auth.js';

test('fim do mês não avança para o próximo mês em dias 29, 30 ou 31', () => {
    for (const [ano, mes, dia, esperado] of [[2026, 0, 31, 31], [2026, 2, 31, 31], [2024, 1, 29, 29], [2026, 1, 28, 28], [2026, 11, 31, 31], [2026, 3, 30, 30]]) {
        const original = new Date(ano, mes, dia, 12);
        const fim = criarFimDoMes(original);
        assert.equal(fim.getFullYear(), ano);
        assert.equal(fim.getMonth(), mes);
        assert.equal(fim.getDate(), esperado);
        assert.equal(fim.getHours(), 23);
        assert.equal(fim.getMilliseconds(), 999);
        assert.equal(original.getHours(), 12);
    }
});

test('CPF valida os dois dígitos verificadores e rejeita repetições', () => {
    assert.equal(cpfEhValido('52998224725'), true);
    assert.equal(cpfEhValido('11144477735'), true);
    for (const value of ['52998224724', '52998224715', '11111111111', '00000000000', '', null, 52998224725]) {
        assert.equal(cpfEhValido(value), false);
    }
});

test('segredo JWT é normalizado e exige tamanho mínimo', () => {
    const original = process.env.JWT_SECRET;
    try {
        process.env.JWT_SECRET = '  ' + 'a'.repeat(32) + '  ';
        assert.equal(obterJwtSecret(), 'a'.repeat(32));
        process.env.JWT_SECRET = 'curta';
        assert.equal(obterJwtSecret(), null);
    } finally {
        if (original === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = original;
    }
});
