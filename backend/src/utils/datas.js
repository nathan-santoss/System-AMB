// Eu verifico se um valor é uma data válida no formato 'AAAA-MM-DD'.
export function dataEhValida(
    valor
) {

    // Primeiro, eu garanto que o valor é uma string.
    if (typeof valor !== 'string') {

        return false;

    }

    // Eu removo espaços em branco do início e do fim.
    const dataNormalizada =
        valor.trim();

    // Se a string estiver vazia, a data não é válida.
    if (
        dataNormalizada.length === 0
    ) {

        return false;

    }

    // Eu divido a data em ano, mês e dia.
    const partes =
        dataNormalizada.split('-');

    // Se não tiver exatamente 3 partes, o formato está errado.
    if (partes.length !== 3) {

        return false;

    }

    // Eu converto cada parte para número.
    const ano =
        Number(partes[0]);

    const mes =
        Number(partes[1]);

    const dia =
        Number(partes[2]);

    // Se alguma parte não for um número inteiro, a data é inválida.
    if (
        !Number.isInteger(ano) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia)
    ) {

        return false;

    }

    // Eu crio um objeto de data para fazer a validação final.
    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    // Eu verifico se o ano, mês e dia correspondem aos valores originais.
    // Isso ajuda a pegar datas inválidas como '2023-02-30'.
    if (
        data.getFullYear() !== ano
    ) {

        return false;

    }

    if (
        data.getMonth() !== mes - 1
    ) {

        return false;

    }

    if (
        data.getDate() !== dia
    ) {

        return false;

    }

    // Se passou por todas as verificações, a data é válida.
    return true;

}


// Eu pego um valor, que geralmente é uma string, e tento convertê-lo em um objeto de data.
export function normalizarData(
    valor
) {

    // Se o valor for nulo ou indefinido, eu simplesmente retorno nulo.
    if (
        valor === null ||
        valor === undefined
    ) {

        return null;

    }

    // Se não for uma string, eu retorno o valor como está.
    if (typeof valor !== 'string') {

        return valor;

    }

    // Eu removo os espaços em branco.
    const dataNormalizada =
        valor.trim();

    // Se a string ficar vazia, eu retorno nulo.
    if (
        dataNormalizada.length === 0
    ) {

        return null;

    }

    // Finalmente, eu crio e retorno um novo objeto de data.
    return new Date(
        dataNormalizada
    );

}


// Eu pego uma data e a ajusto para o primeiro momento daquele dia (00:00:00).
export function criarInicioDoDia(
    data = new Date()
) {

    // Eu crio uma cópia da data para não modificar a original.
    const inicio =
        new Date(data);

    // Eu defino as horas, minutos, segundos e milissegundos para zero.
    inicio.setHours(
        0,
        0,
        0,
        0
    );


    return inicio;

}


// Eu pego uma data e a ajusto para o último momento daquele dia (23:59:59.999).
export function criarFimDoDia(
    data = new Date()
) {

    // Eu crio uma cópia da data.
    const fim =
        new Date(data);

    // Eu defino as horas, minutos, segundos e milissegundos para o final do dia.
    fim.setHours(
        23,
        59,
        59,
        999
    );


    return fim;

}


// Eu pego uma data e a ajusto para o primeiro dia e primeiro momento daquele mês.
export function criarInicioDoMes(
    data = new Date()
) {

    // Eu crio uma cópia da data.
    const inicio =
        new Date(data);

    // Eu defino o dia como 1.
    inicio.setDate(
        1
    );

    // E ajusto o horário para o início do dia.
    inicio.setHours(
        0,
        0,
        0,
        0
    );


    return inicio;

}


// Eu pego uma data e a ajusto para o último dia e último momento daquele mês.
export function criarFimDoMes(
    data = new Date()
) {

    // Eu crio uma cópia da data.
    const fim =
        new Date(data);

    // Eu avanço para o próximo mês.
    fim.setMonth(
        fim.getMonth() + 1
    );

    // Eu defino o dia como 0, o que magicamente me leva para o último dia do mês anterior.
    fim.setDate(
        0
    );

    // E ajusto o horário para o final do dia.
    fim.setHours(
        23,
        59,
        59,
        999
    );


    return fim;

}