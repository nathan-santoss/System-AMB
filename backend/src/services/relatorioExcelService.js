import ExcelJS from 'exceljs';
import { formatarDataRelatorio } from './relatorioPopService.js';

// Excel armazena datas sem fuso. Convertemos explicitamente para o horário de
// Brasília e identificamos esse fuso nos cabeçalhos, independente do servidor.
function dataExcel(valor) {
    if (!valor) return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        })
            .formatToParts(data)
            .map((parte) => [parte.type, parte.value])
    );
    return new Date(
        Date.UTC(
            +partes.year,
            +partes.month - 1,
            +partes.day,
            +partes.hour,
            +partes.minute,
            +partes.second
        )
    );
}

function formatarPlanilha(planilha) {
    planilha.views = [{ state: 'frozen', ySplit: 1 }];
    planilha.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    planilha.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    planilha.getRow(1).height = 32;
    planilha.eachRow((linha) => {
        linha.alignment = { vertical: 'top', wrapText: true };
    });
    planilha.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(1, planilha.rowCount), column: planilha.columnCount }
    };
}

export function criarPlanilhaFuncionario(relatorio) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Ambulatório';
    workbook.created = relatorio.emitidoEm;
    const funcionario = workbook.addWorksheet('Funcionário');
    funcionario.columns = [
        { header: 'Campo', key: 'campo', width: 32 },
        { header: 'Valor', key: 'valor', width: 65 }
    ];
    const f = relatorio.funcionario;
    const dados = [
        ['Nome', f.nome],
        ['Matrícula', String(f.matricula)],
        ['Cargo', f.cargo],
        ['Setor', f.setor],
        ['Núcleo', f.nucleo],
        ...relatorio.liderancas.map((l) => [l.cargo + ' atual', l.nome]),
        ['Emissão (Brasília)', formatarDataRelatorio(relatorio.emitidoEm)],
        ['Total de atendimentos', relatorio.atendimentos.length],
        ['Fonte', 'Sistema de Ambulatório — dados na data de emissão']
    ];
    dados
        .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
        .forEach(([campo, valor]) => funcionario.addRow({ campo, valor }));

    const atendimentos = workbook.addWorksheet('Atendimentos');
    const colunas = [
        { header: 'Atendimento', key: 'id', width: 16 },
        { header: 'Matrícula', key: 'matricula', width: 22 },
        {
            header: 'Entrada (Brasília)',
            key: 'entrada',
            width: 24,
            style: { numFmt: 'dd/mm/yyyy hh:mm' }
        },
        {
            header: 'Saída (Brasília)',
            key: 'saida',
            width: 24,
            style: { numFmt: 'dd/mm/yyyy hh:mm' }
        },
        { header: 'Situação', key: 'situacao', width: 18 },
        { header: 'Pressão arterial', key: 'pressao', width: 20 },
        { header: 'Temperatura (°C)', key: 'temperatura', width: 20, style: { numFmt: '0.00' } },
        { header: 'Gravidade', key: 'gravidade', width: 16 },
        { header: 'Queixa principal', key: 'queixa', width: 70 },
        { header: 'Ação tomada', key: 'acao', width: 26 },
        { header: 'Encaminhamento', key: 'encaminhamento', width: 32 }
    ];
    for (const cargo of ['Supervisor', 'Coordenador', 'Gerente']) {
        if (relatorio.atendimentos.some((a) => a.liderancas.some((l) => l.cargo === cargo))) {
            colunas.push({ header: cargo + ' na época', key: cargo, width: 32 });
        }
    }
    atendimentos.columns = colunas;
    for (const a of relatorio.atendimentos) {
        let situacao = 'Em aberto';
        if (a.data_hora_saida) situacao = 'Finalizado';
        let temperatura = null;
        if (a.temperatura != null) temperatura = Number(a.temperatura);
        atendimentos.addRow({
            id: a.id_atendimento,
            matricula: String(f.matricula),
            entrada: dataExcel(a.data_hora_entrada),
            saida: dataExcel(a.data_hora_saida),
            situacao,
            pressao: a.pressao_arterial,
            temperatura,
            gravidade: a.gravidade,
            queixa: a.queixa_principal,
            acao: a.acao_tomada,
            encaminhamento: a.local_encaminhamento,
            ...Object.fromEntries(a.liderancas.map((l) => [l.cargo, l.nome]))
        });
    }
    const alergias = workbook.addWorksheet('Alergias atuais');
    alergias.columns = [
        { header: 'Matrícula', key: 'matricula', width: 22 },
        { header: 'Alergia cadastrada na emissão', key: 'descricao', width: 70 }
    ];
    for (const alergia of relatorio.alergias) {
        alergias.addRow({ matricula: String(f.matricula), descricao: alergia.descricao_alergia });
    }
    workbook.worksheets.forEach(formatarPlanilha);
    return workbook;
}
