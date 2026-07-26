// Eu pego um texto e removo os espaços em branco do início e do fim.
export function normalizarTexto(valor) {

    // Se o valor não for uma string, eu o retorno como está.
    if (typeof valor !== 'string') {

        return valor;

    }

    // Se for uma string, eu uso o trim() para limpar os espaços.
    return valor.trim();

}


// Eu faço o mesmo que o `normalizarTexto`, mas se o valor for nulo ou vazio, eu retorno nulo.
export function normalizarTextoOpcional(valor) {

    // Se o valor já for nulo ou indefinido, eu não faço nada.
    if (
        valor === null ||
        valor === undefined
    ) {

        return null;

    }

    // Se não for uma string, eu retorno o valor original.
    if (typeof valor !== 'string') {

        return valor;

    }

    // Eu removo os espaços em branco.
    const valorNormalizado =
        valor.trim();

    // Se, após remover os espaços, a string ficar vazia, eu considero como nulo.
    if (
        valorNormalizado.length === 0
    ) {

        return null;

    }

    // Caso contrário, eu retorno o texto limpo.
    return valorNormalizado;

}


// Eu garanto que a matrícula seja uma string sem espaços extras.
export function normalizarMatricula(valor) {

    // Se a matrícula vier como número, eu a converto para string.
    if (typeof valor === 'number') {

        return String(valor).trim();

    }

    // Se já for uma string, eu apenas removo os espaços.
    if (typeof valor === 'string') {

        return valor.trim();

    }

    // Para qualquer outro tipo, eu retorno o valor como está.
    return valor;

}


// Eu pego um CPF e removo tudo que não for número, deixando só os 11 dígitos.
export function normalizarCpf(valor) {

    // Se o CPF vier como número, eu o converto para string.
    if (typeof valor === 'number') {

        return String(valor).trim();

    }

    // Se for uma string, eu uso uma expressão regular para remover pontos, traços, etc.
    if (typeof valor === 'string') {

        return valor
            .replace(/\D/g, '')
            .trim();

    }

    // Se não for nem número nem string, eu retorno o valor original.
    return valor;

}


// Eu pego um e-mail, removo espaços e o converto para letras minúsculas para padronizar.
export function normalizarEmail(valor) {

    // Se não for uma string, eu retorno uma string vazia para evitar erros.
    if (typeof valor !== 'string') {

        return '';

    }

    // Eu limpo os espaços e coloco tudo em minúsculas.
    return valor
        .trim()
        .toLowerCase();

}