export function validarEscolha(valor, escolhas, padrao) {
    if (valor === undefined || valor === '') return padrao;
    if (!escolhas.includes(valor)) throw new Error('Filtro inválido.');
    return valor;
}

export function validarTextoFiltro(valor, limite = 150) {
    if (valor === undefined) return '';
    if (typeof valor !== 'string' || valor.length > limite)
        throw new Error('Filtro de texto inválido.');
    return valor.trim();
}

export function validarPagina(valor) {
    if (valor === undefined) return 1;
    if (!/^\d+$/.test(String(valor))) throw new Error('Página inválida.');
    const pagina = Number(valor);
    if (!Number.isSafeInteger(pagina) || pagina < 1 || pagina > 100000)
        throw new Error('Página inválida.');
    return pagina;
}

function dataValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const data = new Date(valor + 'T00:00:00Z');
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function prepararFiltros(query, agora = new Date()) {
    const hoje = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(agora);
    const inicio = query.inicio || hoje.slice(0, 7) + '-01';
    const fim = query.fim || hoje;
    if (!dataValida(inicio) || !dataValida(fim) || inicio > fim)
        throw new Error('Informe um período válido.');
    const inicioUtc = new Date(inicio + 'T00:00:00-03:00');
    const fimUtc = new Date(new Date(fim + 'T00:00:00-03:00').getTime() + 86400000);
    if (fimUtc - inicioUtc > 366 * 86400000)
        throw new Error('Selecione um período de até 366 dias.');
    const filtros = {
        inicio,
        fim,
        inicioUtc,
        fimUtc,
        tipo: validarEscolha(
            query.tipo,
            ['movimento', 'ranking', 'individual', 'pendencias', 'encaminhamentos'],
            'movimento'
        ),
        grupo: validarEscolha(query.grupo, ['supervisor', 'coordenador', 'gerente'], 'supervisor'),
        vinculo: validarEscolha(query.vinculo, ['epoca', 'atual'], 'epoca'),
        situacao: validarEscolha(query.situacao, ['aberto', 'finalizado'], ''),
        gravidade: validarEscolha(query.gravidade, ['Baixa', 'Média', 'Alta'], ''),
        matricula: validarTextoFiltro(query.matricula, 20),
        lideranca: validarTextoFiltro(query.lideranca),
        setor: validarTextoFiltro(query.setor),
        nucleo: validarTextoFiltro(query.nucleo),
        pagina: validarPagina(query.pagina)
    };
    if (filtros.tipo === 'individual' && !filtros.matricula)
        throw new Error('Informe a matrícula para o relatório individual.');
    if (filtros.tipo === 'pendencias' && filtros.situacao === 'finalizado') {
        throw new Error('O relatório de pendências inclui apenas atendimentos em aberto.');
    }
    return filtros;
}
