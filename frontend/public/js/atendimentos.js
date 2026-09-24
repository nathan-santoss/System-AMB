(() => {
    const ui = window.AmbUI;
    const formulario = document.getElementById('filtros-atendimentos');
    let pagina = 1;
    let filtros;
    let versao = 0;

    async function finalizar(id, botao) {
        if (!confirm('Finalizar esta ficha e registrar a saída agora?')) return;
        botao.disabled = true;
        try {
            await ui.enviar('/api/atendimentos/' + id + '/finalizar', {}, 'PATCH');
            await consultar();
        } catch (erro) {
            ui.mensagem(erro.message, true);
        } finally {
            botao.disabled = false;
        }
    }

    async function consultar(redefinir = false) {
        if (redefinir) {
            pagina = 1;
            filtros = new URLSearchParams(new FormData(formulario));
            filtros.set('tipo', 'movimento');
            if (formulario.situacao.value === 'aberto') filtros.set('tipo', 'pendencias');
        }
        const atual = ++versao;
        const parametros = new URLSearchParams(filtros);
        parametros.set('pagina', pagina);
        const corpo = document.getElementById('lista-atendimentos');
        ui.linhaVazia(corpo, 7, 'Carregando...');
        try {
            const dados = await ui.requisitar('/api/relatorios?' + parametros);
            if (atual !== versao) return;
            corpo.replaceChildren();
            if (!dados.registros.length) ui.linhaVazia(corpo, 7);
            for (const item of dados.registros) {
                const linha = ui.elemento('tr');
                for (const valor of [
                    item.id,
                    item.nome + ' (' + item.matricula + ')',
                    ui.dataHora(item.entrada),
                    ui.dataHora(item.saida),
                    item.gravidade,
                    item.acao
                ])
                    linha.append(ui.elemento('td', valor));
                const celula = ui.elemento('td');
                const acoes = ui.elemento('div', null, 'opcoes-atendimento');
                const ficha = ui.elemento('a', 'Ficha / PDF', 'botao-secundario');
                ficha.href =
                    '/api/funcionarios/' +
                    encodeURIComponent(item.matricula) +
                    '/atendimentos/' +
                    item.id +
                    '/ficha';
                ficha.target = '_blank';
                ficha.rel = 'noopener';
                acoes.append(ficha);
                if (!item.saida) {
                    const botao = ui.elemento('button', 'Finalizar', 'botao-primario');
                    botao.onclick = () => finalizar(item.id, botao);
                    acoes.append(botao);
                }
                celula.append(acoes);
                linha.append(celula);
                corpo.append(linha);
            }
            document.getElementById('total-atendimentos').textContent =
                dados.resumo.total + ' atendimento(s)';
            document.getElementById('pagina-atendimentos').textContent =
                'Página ' + pagina + ' de ' + dados.totalPaginas;
            document.getElementById('anterior').disabled = pagina <= 1;
            document.getElementById('proxima').disabled = pagina >= dados.totalPaginas;
            ui.mensagem('');
        } catch (erro) {
            if (atual === versao) {
                ui.mensagem(erro.message, true);
                ui.linhaVazia(corpo, 7, 'Consulta indisponível. Tente novamente.');
            }
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const sessao = await window.AuthSession.exigirSessao();
        if (!sessao.autenticado) return ui.mensagem(sessao.mensagem, true);
        formulario.inicio.value = ui.hoje().slice(0, 7) + '-01';
        formulario.fim.value = ui.hoje();
        formulario.matricula.value = new URLSearchParams(location.search).get('matricula') || '';
        formulario.onsubmit = (evento) => {
            evento.preventDefault();
            consultar(true);
        };
        document.getElementById('anterior').onclick = () => {
            pagina--;
            consultar();
        };
        document.getElementById('proxima').onclick = () => {
            pagina++;
            consultar();
        };
        consultar(true);
    });
})();
