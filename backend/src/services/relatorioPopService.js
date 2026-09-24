const cargosLideranca = [
    ['supervisor', 'Supervisor'],
    ['coordenador', 'Coordenador'],
    ['gerente', 'Gerente']
];

export function obterLiderancas(dados, sufixo = '') {
    return cargosLideranca.flatMap(([campo, cargo]) => {
        const nome = dados[campo + sufixo];
        if (typeof nome === 'string' && nome.trim()) return [{ cargo, nome: nome.trim() }];
        return [];
    });
}

// Os vínculos históricos vêm exclusivamente do atendimento, sem substituir
// ausências pelo cadastro atual do funcionário.
export function montarRelatorioPop(prontuario, emitidoEm = new Date()) {
    const funcionario = prontuario.funcionario.toJSON?.() ?? prontuario.funcionario;
    return {
        funcionario,
        emitidoEm,
        liderancas: obterLiderancas(funcionario),
        alergias: prontuario.alergias,
        atendimentos: prontuario.atendimentos.map((atendimento) => ({
            ...atendimento,
            liderancas: obterLiderancas(atendimento, '_na_epoca')
        }))
    };
}

export function formatarDataRelatorio(valor) {
    if (!valor) return 'Não informado';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return 'Não informado';
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo'
    }).format(data);
}
