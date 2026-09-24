(() => {
    const ui = window.AmbUI;
    let opcoes = [];
    let filtrosAplicados = null;
    let pagina = 1;
    let versao = 0;
    const formulario = document.getElementById('filtros-relatorio');

    function preencherOpcoes(campo, grupo) {
        const select = document.getElementById(campo);
        select.replaceChildren(new Option('Todos', ''));
        for (const opcao of opcoes) {
            if (opcao.campo === grupo) select.add(new Option(opcao.valor, opcao.valor));
        }
    }

    function ajustarTipo() {
        const ranking = formulario.tipo.value === 'ranking';
        document.getElementById('filtro-mes').hidden = !ranking;
        formulario.inicio.readOnly = ranking;
        formulario.fim.readOnly = ranking;
        formulario.matricula.required = formulario.tipo.value === 'individual';
        if (ranking) {
            const mes = document.getElementById('mes-relatorio').value;
            if (!mes) return;
            const [ano, numero] = mes.split('-').map(Number);
            formulario.inicio.value = mes + '-01';
            formulario.fim.value = mes + '-' + new Date(ano, numero, 0).getDate();
        }
    }

    function definirPeriodo() {
        formulario.inicio.value = ui.hoje().slice(0, 7) + '-01';
        formulario.fim.value = ui.hoje();
        document.getElementById('mes-relatorio').value = ui.hoje().slice(0, 7);
        ajustarTipo();
    }

    function renderizar(dados) {
        const indicadores = document.getElementById('indicadores');
        indicadores.replaceChildren();
        for (const [chave, rotulo] of [
            ['total', 'Atendimentos'],
            ['pessoas', 'Pessoas distintas'],
            ['abertos', 'Abertos na emissão'],
            ['encaminhamentos', 'Encaminhamentos']
        ]) {
            const cartao = ui.elemento('div', null, 'indicador');
            cartao.append(ui.elemento('strong', dados.resumo[chave]), ui.elemento('span', rotulo));
            indicadores.append(cartao);
        }
        const ranking = document.getElementById('ranking');
        ranking.replaceChildren();
        if (!dados.ranking.length) ui.linhaVazia(ranking, 5);
        for (const item of dados.ranking) {
            const linha = ui.elemento('tr');
            let participacao = '0%';
            if (dados.resumo.total)
                participacao =
                    ((100 * item.idas) / dados.resumo.total).toFixed(1).replace('.', ',') + '%';
            for (const valor of [
                item.posicao || '—',
                item.lideranca || 'Sem liderança informada',
                item.idas,
                item.pessoas,
                participacao
            ])
                linha.append(ui.elemento('td', valor));
            ranking.append(linha);
        }
        const evolucao = document.getElementById('evolucao');
        evolucao.replaceChildren();
        const maior = Math.max(1, ...dados.evolucao.map((item) => item.total));
        if (!dados.evolucao.length)
            evolucao.append(ui.elemento('p', 'Sem movimento no período.', 'ajuda'));
        for (const item of dados.evolucao) {
            const linha = ui.elemento('div', null, 'dia-movimento');
            const barra = ui.elemento('div', null, 'barra-movimento');
            barra.setAttribute('aria-hidden', 'true');
            const preenchimento = ui.elemento('span');
            preenchimento.style.width = (100 * item.total) / maior + '%';
            barra.append(preenchimento);
            linha.append(
                ui.elemento('span', item.dia.split('-').reverse().join('/')),
                barra,
                ui.elemento('strong', item.total)
            );
            evolucao.append(linha);
        }
        const registros = document.getElementById('registros');
        registros.replaceChildren();
        if (!dados.registros.length) ui.linhaVazia(registros, 5);
        for (const item of dados.registros) {
            const linha = ui.elemento('tr');
            const celula = ui.elemento('td');
            const link = ui.elemento('a', '#' + item.id, 'text-blue-800 underline');
            link.href =
                '/api/funcionarios/' +
                encodeURIComponent(item.matricula) +
                '/atendimentos/' +
                item.id +
                '/ficha';
            link.target = '_blank';
            link.rel = 'noopener';
            celula.append(link);
            linha.append(celula);
            for (const valor of [
                item.nome + ' (' + item.matricula + ')',
                ui.dataHora(item.entrada),
                ui.dataHora(item.saida),
                item.acao
            ])
                linha.append(ui.elemento('td', valor));
            registros.append(linha);
        }
        document.getElementById('pagina-atual').textContent =
            'Página ' + pagina + ' de ' + dados.totalPaginas;
        document.getElementById('pagina-anterior').disabled = pagina <= 1;
        document.getElementById('pagina-proxima').disabled = pagina >= dados.totalPaginas;
        let texto =
            'De ' +
            dados.filtros.inicio +
            ' até ' +
            dados.filtros.fim +
            '. Emissão: ' +
            ui.dataHora(dados.emitidoEm) +
            ' (Brasília).';
        if (dados.filtros.fim >= ui.hoje()) texto += ' Período em andamento: resultado parcial.';
        if (dados.resumo.minutos !== null)
            texto +=
                ' Permanência média registrada: ' +
                dados.resumo.minutos +
                ' min (somente encerrados).';
        document.getElementById('descricao-relatorio').textContent = texto;
        document.getElementById('pdf-relatorio').href =
            '/api/relatorios/imprimir?' + filtrosAplicados;
        document.getElementById('resultado-relatorio').hidden = false;
    }

    // Guarda os filtros consultados para que PDF e Excel reproduzam o mesmo relatório.
    async function consultar(novosFiltros = false) {
        if (novosFiltros) {
            filtrosAplicados = new URLSearchParams(new FormData(formulario));
            pagina = 1;
        }
        const atual = ++versao;
        const parametros = new URLSearchParams(filtrosAplicados);
        parametros.set('pagina', pagina);
        ui.mensagem('Consultando...');
        document.getElementById('resultado-relatorio').hidden = true;
        try {
            const dados = await ui.requisitar('/api/relatorios?' + parametros);
            if (atual !== versao) return;
            renderizar(dados);
            ui.mensagem('');
        } catch (erro) {
            if (atual === versao) ui.mensagem(erro.message, true);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const sessao = await window.AuthSession.exigirSessao();
        if (!sessao.autenticado) return ui.mensagem(sessao.mensagem, true);
        definirPeriodo();
        const iniciais = new URLSearchParams(location.search);
        for (const campo of ['tipo', 'matricula']) {
            if (iniciais.has(campo)) formulario.elements[campo].value = iniciais.get(campo);
        }
        ajustarTipo();
        try {
            opcoes = await ui.requisitar('/api/relatorios/opcoes');
            preencherOpcoes('lideranca', formulario.grupo.value);
            preencherOpcoes('setor', 'setor');
            preencherOpcoes('nucleo', 'nucleo');
        } catch (erro) {
            ui.mensagem(erro.message, true);
        }
        formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();
            consultar(true);
        });
        formulario.addEventListener('reset', () =>
            window.setTimeout(() => {
                definirPeriodo();
                preencherOpcoes('lideranca', 'supervisor');
                consultar(true);
            }, 0)
        );
        formulario.tipo.addEventListener('change', ajustarTipo);
        document.getElementById('mes-relatorio').addEventListener('change', ajustarTipo);
        formulario.grupo.addEventListener('change', () =>
            preencherOpcoes('lideranca', formulario.grupo.value)
        );
        document.getElementById('pagina-anterior').onclick = () => {
            pagina--;
            consultar();
        };
        document.getElementById('pagina-proxima').onclick = () => {
            pagina++;
            consultar();
        };
        document.getElementById('excel-relatorio').onclick = async (evento) => {
            evento.target.disabled = true;
            try {
                await ui.baixar(
                    '/api/relatorios/excel?' + filtrosAplicados,
                    'relatorio-ambulatorio.xlsx'
                );
            } catch (erro) {
                ui.mensagem(erro.message, true);
            } finally {
                evento.target.disabled = false;
            }
        };
        if (formulario.reportValidity()) consultar(true);
    });
})();
