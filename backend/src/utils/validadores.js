// Eu verifico se o corpo de uma requisição é um objeto JSON válido, e não um array ou outro tipo.
export function corpoEhObjetoValido(corpo) {

    // Se não houver corpo, não é válido.
    if (!corpo) {

        return false;

    }

    // Se não for do tipo 'object', também não é válido.
    if (typeof corpo !== 'object') {

        return false;

    }

    // Eu verifico se é um array, pois não quero aceitar arrays como corpo principal.
    if (Array.isArray(corpo)) {

        return false;

    }

    // Se passou por tudo, é um objeto válido.
    return true;

}


// Eu checo se um determinado campo foi enviado dentro de um objeto.
export function campoFoiEnviado(
    objeto,
    campo
) {

    // Eu uso `hasOwnProperty` para ter certeza que a propriedade pertence ao próprio objeto.
    return Object.prototype.hasOwnProperty.call(
        objeto,
        campo
    );

}


// Eu valido se a matrícula é uma string com um tamanho aceitável.
export function matriculaEhValida(
    matricula
) {

    // Tem que ser uma string.
    if (typeof matricula !== 'string') {

        return false;

    }

    // Não pode ser vazia.
    if (matricula.length < 1) {

        return false;

    }

    // E não pode ser maior que 20 caracteres.
    if (matricula.length > 20) {

        return false;

    }

    // Se estiver tudo certo, é válida.
    return true;

}


// Eu verifico se o CPF é uma string que contém exatamente 11 dígitos numéricos.
export function cpfEhValido(
    cpf
) {

    // Primeiro, garanto que é uma string.
    if (typeof cpf !== 'string') {

        return false;

    }

    // Depois, uso uma expressão regular para checar se tem exatamente 11 números.
    if (!/^\d{11}$/.test(cpf)) {

        return false;

    }

    // Se corresponder, é válido.
    return true;

}


// Eu valido se um ID é um número inteiro, positivo e seguro.
export function identificadorEhValido(
    id
) {

    // Não pode ser nulo ou indefinido.
    if (
        id === undefined ||
        id === null
    ) {

        return false;

    }

    // Eu converto para string e removo espaços para garantir a consistência.
    const idNormalizado =
        String(id).trim();

    // Se ficar vazio, não é válido.
    if (
        idNormalizado.length === 0
    ) {

        return false;

    }

    // Eu verifico se contém apenas dígitos.
    if (!/^\d+$/.test(idNormalizado)) {

        return false;

    }

    // Eu converto para número.
    const idNumerico =
        Number(idNormalizado);

    // O número precisa ser um inteiro seguro (dentro dos limites do JavaScript).
    if (!Number.isSafeInteger(idNumerico)) {

        return false;

    }

    // E precisa ser maior que zero.
    if (idNumerico <= 0) {

        return false;

    }

    // Se passou em tudo, o ID é válido.
    return true;

}


// Eu verifico se um texto não está vazio e se não ultrapassa um tamanho máximo.
export function textoObrigatorioEhValido(
    valor,
    tamanhoMaximo
) {

    // Tem que ser uma string.
    if (typeof valor !== 'string') {

        return false;

    }

    // Não pode ser uma string vazia.
    if (valor.length === 0) {

        return false;

    }

    // E não pode ser maior que o tamanho máximo definido.
    if (
        valor.length > tamanhoMaximo
    ) {

        return false;

    }

    // Se estiver dentro das regras, é válido.
    return true;

}


// Eu faço o mesmo que o `textoObrigatorioEhValido`, mas permito que o valor seja nulo ou indefinido.
export function textoOpcionalEhValido(
    valor,
    tamanhoMaximo
) {

    // Se for nulo ou indefinido, está tudo bem, pois é opcional.
    if (
        valor === null ||
        valor === undefined
    ) {

        return true;

    }

    // Mas se existir, tem que ser uma string.
    if (typeof valor !== 'string') {

        return false;

    }

    // E não pode exceder o tamanho máximo.
    if (
        valor.length > tamanhoMaximo
    ) {

        return false;

    }

    // Se estiver tudo certo, é válido.
    return true;

}


// Eu valido se um termo de busca é uma string e não excede um tamanho máximo.
export function buscaEhValida(
    busca,
    tamanhoMaximo = 150
) {

    // Tem que ser uma string.
    if (typeof busca !== 'string') {

        return false;

    }

    // E não pode ser maior que o tamanho máximo (padrão de 150).
    if (
        busca.length > tamanhoMaximo
    ) {

        return false;

    }

    // Se estiver ok, é válido.
    return true;

}


// Eu verifico se o valor da temperatura é um número válido ou se está vazio.
export function temperaturaEhValida(
    valor
) {

    // Se for nulo ou indefinido, eu aceito, pois pode ser opcional.
    if (
        valor === null ||
        valor === undefined
    ) {

        return true;

    }

    let temperatura = valor;

    // Se for uma string, eu tento converter para número.
    if (typeof temperatura === 'string') {

        const normalizado =
            temperatura.trim();

        // Se a string estiver vazia, eu considero válido.
        if (
            normalizado.length === 0
        ) {

            return true;

        }

        temperatura =
            Number(normalizado);

    }

    // Depois de tratar a string, eu verifico se é um número.
    if (typeof temperatura !== 'number') {

        return false;

    }

    // Não pode ser infinito ou NaN.
    if (!Number.isFinite(temperatura)) {

        return false;

    }

    // Eu defino um intervalo razoável para a temperatura corporal (0 a 100).
    if (
        temperatura < 0 ||
        temperatura > 100
    ) {

        return false;

    }


    return true;

}