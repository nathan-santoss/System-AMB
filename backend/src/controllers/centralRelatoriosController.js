import ExcelJS from 'exceljs';
import { prepararFiltros } from '../utils/filtrosRelatorio.js';
import { consultarRelatorio, consultarOpcoes } from '../services/centralRelatoriosService.js';
import { formatarDataRelatorio } from '../services/relatorioPopService.js';

export const TITULOS = {
    movimento: 'Movimento do ambulatório',
    ranking: 'Ranking por liderança',
    individual: 'Histórico individual',
    pendencias: 'Pendências de encerramento',
    encaminhamentos: 'Encaminhamentos'
};

function adicionarAba(workbook, nome, cabecalhos, registros) {
    const aba = workbook.addWorksheet(nome);
    aba.columns = cabecalhos.map((header) => ({ header, width: 26 }));
    aba.addRows(registros);
    aba.views = [{ state: 'frozen', ySplit: 1 }];
    aba.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    aba.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    aba.eachRow((linha) => {
        linha.alignment = { vertical: 'top', wrapText: true };
    });
    aba.autoFilter = { from: 'A1', to: { row: 1, column: cabecalhos.length } };
    return aba;
}

export async function gerarExcelCentral(relatorio) {
    const livro = new ExcelJS.Workbook();
    livro.creator = 'Sistema de Ambulatório';
    const f = relatorio.filtros;
    adicionarAba(
        livro,
        'Resumo',
        ['Informação', 'Valor'],
        [
            ['Relatório', TITULOS[f.tipo]],
            ['Início', f.inicio],
            ['Fim', f.fim],
            ['Agrupamento', f.grupo],
            ['Vínculo', f.vinculo],
            ['Liderança', f.lideranca || 'Todas'],
            ['Matrícula', f.matricula || 'Todas'],
            ['Setor atual', f.setor || 'Todos'],
            ['Núcleo atual', f.nucleo || 'Todos'],
            ['Situação', f.situacao || 'Todas'],
            ['Gravidade', f.gravidade || 'Todas'],
            ['Emissão (Brasília)', formatarDataRelatorio(relatorio.emitidoEm)],
            ['Atendimentos', relatorio.resumo.total],
            ['Pessoas distintas', relatorio.resumo.pessoas],
            ['Abertos na emissão', relatorio.resumo.abertos],
            ['Encaminhamentos', relatorio.resumo.encaminhamentos],
            ['Permanência média (min)', relatorio.resumo.minutos],
            [
                'Critério',
                'Data de entrada; pendências incluem entradas anteriores ao início. Setor e núcleo são atuais.'
            ],
            [
                'Interpretação',
                'Participação representa idas, não percentual de funcionários da equipe.'
            ]
        ]
    );
    const ranking = adicionarAba(
        livro,
        'Ranking',
        ['Posição', 'Liderança', 'Idas', 'Pessoas atendidas', 'Participação nas idas'],
        relatorio.ranking.map((item) => {
            let participacao = 0;
            if (relatorio.resumo.total) participacao = item.idas / relatorio.resumo.total;
            return [
                item.posicao,
                item.lideranca || 'Sem liderança informada',
                item.idas,
                item.pessoas,
                participacao
            ];
        })
    );
    ranking.getColumn(5).numFmt = '0.0%';
    adicionarAba(
        livro,
        'Movimento diário',
        ['Dia (Brasília)', 'Idas'],
        relatorio.evolucao.map((item) => [item.dia, item.total])
    );
    // Planilhas gerais priorizam indicadores; listas nominais atendem à conferência interna.
    if (['individual', 'pendencias', 'encaminhamentos'].includes(f.tipo)) {
        adicionarAba(
            livro,
            'Registros',
            [
                'Atendimento',
                'Matrícula',
                'Funcionário',
                'Entrada (Brasília)',
                'Saída (Brasília)',
                'Gravidade',
                'Ação',
                'Destino',
                'Liderança'
            ],
            relatorio.registros.map((item) => [
                item.id,
                item.matricula,
                item.nome,
                formatarDataRelatorio(item.entrada),
                formatarDataRelatorio(item.saida),
                item.gravidade,
                item.acao,
                item.destino,
                item.lideranca
            ])
        );
    }
    return Buffer.from(await livro.xlsx.writeBuffer());
}

export async function obterRelatorio(req, res, next) {
    let filtros;
    try {
        filtros = prepararFiltros(req.query);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
    try {
        const exportar = req.params.formato === 'excel' || req.params.formato === 'imprimir';
        const relatorio = await consultarRelatorio(filtros, exportar);
        res.setHeader('Cache-Control', 'no-store, private');
        res.setHeader('Referrer-Policy', 'no-referrer');
        if (req.params.formato === 'excel') {
            res.attachment('relatorio-ambulatorio.xlsx');
            return res.send(await gerarExcelCentral(relatorio));
        }
        if (req.params.formato === 'imprimir') {
            return res.render('relatorio-operacional', {
                relatorio,
                titulo: TITULOS[filtros.tipo],
                formatarData: formatarDataRelatorio
            });
        }
        return res.json(relatorio);
    } catch (erro) {
        if (erro.status === 400) return res.status(400).json({ erro: erro.message });
        next(erro);
    }
}

export async function obterOpcoes(req, res, next) {
    try {
        res.json(await consultarOpcoes());
    } catch (erro) {
        next(erro);
    }
}
