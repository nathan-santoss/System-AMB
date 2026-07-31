export function normalizarTexto(valor) {
    if (typeof valor !== 'string') {
        return valor;
    }

    return valor.trim();
}

export function normalizarTextoOpcional(valor) {
    if (valor === null) {
        return null;
    }

    if (valor === undefined) {
        return null;
    }

    if (typeof valor !== 'string') {
        return valor;
    }

    const valorNormalizado = valor.trim();

    if (valorNormalizado.length === 0) {
        return null;
    }

    return valorNormalizado;
}

export function normalizarMatricula(valor) {
    if (typeof valor === 'number') {
        return String(valor).trim();
    }

    if (typeof valor === 'string') {
        return valor.trim();
    }

    return valor;
}

export function normalizarCpf(valor) {
    if (typeof valor === 'number') {
        return String(valor)
            .replace(/\D/g, '')
            .trim();
    }

    if (typeof valor === 'string') {
        return valor
            .replace(/\D/g, '')
            .trim();
    }

    return valor;
}