export function corpoEhObjetoValido(corpo) {
    if (!corpo) {
        return false;
    }

    if (typeof corpo !== 'object') {
        return false;
    }

    if (Array.isArray(corpo)) {
        return false;
    }

    return true;
}

export function campoFoiEnviado(
    objeto,
    campo
) {
    if (!objeto) {
        return false;
    }

    if (typeof objeto !== 'object') {
        return false;
    }

    if (Array.isArray(objeto)) {
        return false;
    }

    if (typeof campo !== 'string') {
        return false;
    }

    if (campo.length === 0) {
        return false;
    }

    return Object.prototype.hasOwnProperty.call(
        objeto,
        campo
    );
}

export function matriculaEhValida(
    matricula
) {
    if (typeof matricula !== 'string') {
        return false;
    }

    if (matricula.length < 1) {
        return false;
    }

    if (matricula.length > 20) {
        return false;
    }

    return true;
}

export function cpfEhValido(cpf) {
    if (typeof cpf !== 'string') {
        return false;
    }

    if (!/^\d{11}$/.test(cpf)) {
        return false;
    }

    return true;
}

export function identificadorEhValido(id) {
    if (id === undefined) {
        return false;
    }

    if (id === null) {
        return false;
    }

    const idNormalizado = String(id).trim();

    if (idNormalizado.length === 0) {
        return false;
    }

    if (!/^\d+$/.test(idNormalizado)) {
        return false;
    }

    const idNumerico = Number(
        idNormalizado
    );

    if (!Number.isSafeInteger(idNumerico)) {
        return false;
    }

    if (idNumerico <= 0) {
        return false;
    }

    return true;
}

function tamanhoMaximoEhValido(
    tamanhoMaximo
) {
    if (
        !Number.isSafeInteger(
            tamanhoMaximo
        )
    ) {
        return false;
    }

    if (tamanhoMaximo <= 0) {
        return false;
    }

    return true;
}

export function textoObrigatorioEhValido(
    valor,
    tamanhoMaximo
) {
    if (
        !tamanhoMaximoEhValido(
            tamanhoMaximo
        )
    ) {
        return false;
    }

    if (typeof valor !== 'string') {
        return false;
    }

    if (valor.length === 0) {
        return false;
    }

    if (valor.length > tamanhoMaximo) {
        return false;
    }

    return true;
}

export function textoOpcionalEhValido(
    valor,
    tamanhoMaximo
) {
    if (
        !tamanhoMaximoEhValido(
            tamanhoMaximo
        )
    ) {
        return false;
    }

    if (valor === null) {
        return true;
    }

    if (valor === undefined) {
        return true;
    }

    if (typeof valor !== 'string') {
        return false;
    }

    if (valor.length > tamanhoMaximo) {
        return false;
    }

    return true;
}

export function buscaEhValida(
    busca,
    tamanhoMaximo = 150
) {
    if (
        !tamanhoMaximoEhValido(
            tamanhoMaximo
        )
    ) {
        return false;
    }

    if (typeof busca !== 'string') {
        return false;
    }

    if (busca.length > tamanhoMaximo) {
        return false;
    }

    return true;
}

export function temperaturaEhValida(valor) {
    if (valor === null) {
        return true;
    }

    if (valor === undefined) {
        return true;
    }

    let temperatura = valor;

    if (typeof temperatura === 'string') {
        const temperaturaNormalizada = temperatura
            .trim()
            .replace(',', '.');

        if (
            temperaturaNormalizada.length === 0
        ) {
            return true;
        }

        temperatura = Number(
            temperaturaNormalizada
        );
    }

    if (typeof temperatura !== 'number') {
        return false;
    }

    if (!Number.isFinite(temperatura)) {
        return false;
    }

    if (temperatura < 0) {
        return false;
    }

    if (temperatura > 100) {
        return false;
    }

    return true;
}