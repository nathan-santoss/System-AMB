function dataEhObjetoValido(data) {
    if (!(data instanceof Date)) {
        return false;
    }

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return false;
    }

    return true;
}

function obterDataBase(data) {
    if (data === undefined) {
        return new Date();
    }

    if (!dataEhObjetoValido(data)) {
        throw new TypeError(
            'A data informada é inválida.'
        );
    }

    return new Date(
        data.getTime()
    );
}

export function criarInicioDoDia(data) {
    const inicio = obterDataBase(
        data
    );

    inicio.setHours(
        0,
        0,
        0,
        0
    );

    return inicio;
}

export function criarFimDoDia(data) {
    const fim = obterDataBase(
        data
    );

    fim.setHours(
        23,
        59,
        59,
        999
    );

    return fim;
}

export function criarInicioDoMes(data) {
    const inicio = obterDataBase(
        data
    );

    inicio.setDate(
        1
    );

    inicio.setHours(
        0,
        0,
        0,
        0
    );

    return inicio;
}

export function criarFimDoMes(data) {
    const fim = obterDataBase(
        data
    );

    fim.setMonth(
        fim.getMonth() + 1
    );

    fim.setDate(
        0
    );

    fim.setHours(
        23,
        59,
        59,
        999
    );

    return fim;
}