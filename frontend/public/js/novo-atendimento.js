(() => {
    const ui = window.AmbUI;
    const triagem = document.getElementById('form-triagem-etapa');
    const conduta = document.getElementById('form-conduta-etapa');
    let funcionario = null;
    let etapa = 0;
    let alterado = false;
    let salvando = false;
    let chave = crypto.randomUUID();
    let paginaBusca = 1;
    let termoBusca = '';
    let versaoBusca = 0;

    // Alterna apenas a etapa visível; os campos preenchidos permanecem no formulário.
    function mostrarEtapa(numero) {
        etapa = numero;
        document.querySelectorAll('[data-etapa]').forEach((secao) => {
            secao.hidden = Number(secao.dataset.etapa) !== numero;
            if (!secao.hidden) secao.querySelector('h2').focus();
        });
        document.querySelectorAll('.etapas li').forEach((item, indice) => {
            item.removeAttribute('aria-current');
            if (indice === numero) item.setAttribute('aria-current', 'step');
        });
        ui.mensagem('');
    }

    function definirEntrada() {
        const horario = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).format(new Date());
        triagem.entrada.value = ui.hoje() + 'T' + horario;
    }

    async function selecionar(matricula) {
        if (funcionario && funcionario.matricula !== matricula && alterado) {
            if (
                !confirm(
                    'Trocar o funcionário descarta os dados desta ficha ainda não salva. Continuar?'
                )
            )
                return;
        }
        try {
            const dados = await ui.requisitar(
                '/api/funcionarios/' + encodeURIComponent(matricula) + '/identificacao'
            );
            if (!dados.funcionario.ativo)
                throw new Error(
                    'Este funcionário está inativo. Reative o cadastro antes de atender.'
                );
            if (!funcionario || funcionario.matricula !== matricula) {
                triagem.reset();
                conduta.reset();
                chave = crypto.randomUUID();
                alterado = false;
                definirEntrada();
                ajustarDestino();
            }
            funcionario = dados.funcionario;
            document.getElementById('pessoa-nome').textContent =
                funcionario.nome + ' • Matrícula ' + funcionario.matricula;
            document.getElementById('pessoa-vinculos').textContent = ui.vinculo(funcionario);
            let alergias = 'Nenhuma alergia cadastrada.';
            if (dados.alergias.length)
                alergias =
                    'Alergias cadastradas: ' +
                    dados.alergias.map((item) => item.descricao_alergia).join('; ');
            document.getElementById('pessoa-alergias').textContent = alergias;
            document.getElementById('pessoa-selecionada').hidden = false;
            mostrarEtapa(1);
        } catch (erro) {
            ui.mensagem(erro.message, true);
        }
    }

    async function buscarPessoa(acrescentar = false) {
        const versao = ++versaoBusca;
        const destino = document.getElementById('resultado-pessoas');
        if (!acrescentar) destino.replaceChildren();
        ui.mensagem('Buscando funcionário...');
        try {
            const dados = await ui.requisitar(
                '/api/funcionarios?busca=' +
                    encodeURIComponent(termoBusca) +
                    '&pagina=' +
                    paginaBusca
            );
            if (versao !== versaoBusca) return;
            for (const pessoa of dados.registros) {
                const cartao = ui.elemento('div', null, 'resultado-pessoa');
                const texto = ui.elemento('div');
                texto.append(
                    ui.elemento('strong', pessoa.nome),
                    ui.elemento(
                        'p',
                        'Matrícula ' +
                            pessoa.matricula +
                            ' • ' +
                            (pessoa.setor || 'Setor não informado'),
                        'ajuda'
                    )
                );
                const botao = ui.elemento('button', 'Selecionar', 'botao-primario');
                botao.type = 'button';
                botao.onclick = () => selecionar(pessoa.matricula);
                cartao.append(texto, botao);
                destino.append(cartao);
            }
            if (!dados.total)
                destino.append(
                    ui.elemento(
                        'p',
                        'Nenhum funcionário ativo encontrado. Confira os dados ou cadastre abaixo.',
                        'ajuda'
                    )
                );
            document.getElementById('mais-pessoas').hidden = paginaBusca >= dados.totalPaginas;
            ui.mensagem('');
        } catch (erro) {
            ui.mensagem(erro.message, true);
        }
    }

    function ajustarDestino() {
        const encaminhado = conduta.acao_tomada.value === 'Encaminhado UPA';
        document.getElementById('campo-destino').hidden = !encaminhado;
        conduta.local_encaminhamento.required = encaminhado;
    }

    function coletarDados() {
        const dados = Object.fromEntries(new FormData(triagem));
        delete dados.entrada;
        dados.data_hora_entrada = new Date(triagem.entrada.value + ':00-03:00').toISOString();
        dados.temperatura = Number(dados.temperatura);
        dados.funcionario_matricula = funcionario.matricula;
        dados.chave_registro = chave;
        dados.acao_tomada = conduta.acao_tomada.value;
        dados.local_encaminhamento = conduta.local_encaminhamento.value.trim();
        dados.finalizar = conduta.finalizar.checked;
        return dados;
    }

    function revisar() {
        const dados = coletarDados();
        const resumo = document.getElementById('resumo-atendimento');
        let situacao = 'Permanecerá em aberto';
        if (dados.finalizar) situacao = 'Será finalizado ao salvar';
        const campos = [
            ['Funcionário', funcionario.nome],
            ['Matrícula', funcionario.matricula],
            ['Entrada (Brasília)', ui.dataHora(dados.data_hora_entrada)],
            ['Pressão arterial', dados.pressao_arterial],
            ['Temperatura', dados.temperatura + ' °C'],
            ['Gravidade', dados.gravidade],
            ['Queixa principal', dados.queixa_principal],
            ['Ação tomada', dados.acao_tomada],
            ['Situação', situacao]
        ];
        if (dados.acao_tomada === 'Encaminhado UPA')
            campos.push(['Destino', dados.local_encaminhamento]);
        resumo.replaceChildren();
        for (const [rotulo, valor] of campos) {
            const item = ui.elemento('div');
            item.append(ui.elemento('dt', rotulo), ui.elemento('dd', valor));
            resumo.append(item);
        }
        mostrarEtapa(3);
    }

    async function salvar() {
        if (salvando) return;
        salvando = true;
        document.querySelectorAll('[data-voltar], #salvar-atendimento').forEach((botao) => {
            botao.disabled = true;
        });
        ui.mensagem('Salvando atendimento...');
        try {
            const registro = await ui.enviar('/api/atendimentos', coletarDados());
            alterado = false;
            document.querySelectorAll('.etapa').forEach((secao) => {
                secao.hidden = true;
            });
            document.getElementById('atendimento-salvo').hidden = false;
            document.getElementById('mensagem-sucesso').textContent =
                'Ficha #' + registro.id_atendimento + ' registrada para ' + funcionario.nome + '.';
            document.getElementById('imprimir-atendimento').href =
                '/api/funcionarios/' +
                encodeURIComponent(funcionario.matricula) +
                '/atendimentos/' +
                registro.id_atendimento +
                '/ficha';
            ui.mensagem('');
        } catch (erro) {
            ui.mensagem(
                erro.message +
                    ' Em caso de falha de conexão, tente salvar novamente antes de alterar os dados.',
                true
            );
        } finally {
            salvando = false;
            document.querySelectorAll('[data-voltar], #salvar-atendimento').forEach((botao) => {
                botao.disabled = false;
            });
        }
    }

    async function cadastrar(evento) {
        evento.preventDefault();
        const formulario = evento.target;
        const botao = formulario.querySelector('button[type="submit"], button:not([type])');
        botao.disabled = true;
        const dados = Object.fromEntries(new FormData(formulario));
        for (const cargo of ['supervisor', 'coordenador', 'gerente']) {
            dados[cargo] = null;
            if (document.getElementById('novo-informar-' + cargo).checked)
                dados[cargo] = document.getElementById('novo-' + cargo).value.trim();
        }
        try {
            const pessoa = await ui.enviar('/api/funcionarios', dados);
            formulario.reset();
            formulario
                .querySelectorAll('[data-lideranca]')
                .forEach((controle) => controle.onchange());
            await selecionar(pessoa.matricula);
        } catch (erro) {
            ui.mensagem(erro.message, true);
        } finally {
            botao.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const sessao = await window.AuthSession.exigirSessao();
        if (!sessao.autenticado) return ui.mensagem(sessao.mensagem, true);
        document.getElementById('buscar-pessoa').onsubmit = (evento) => {
            evento.preventDefault();
            paginaBusca = 1;
            termoBusca = document.getElementById('busca-pessoa').value.trim();
            buscarPessoa();
        };
        document.getElementById('mais-pessoas').onclick = () => {
            paginaBusca++;
            buscarPessoa(true);
        };
        document.querySelectorAll('[data-voltar]').forEach((botao) => {
            botao.onclick = () => mostrarEtapa(etapa - 1);
        });
        triagem.onsubmit = (evento) => {
            evento.preventDefault();
            if (new Date(triagem.entrada.value + ':00-03:00').getTime() > Date.now())
                return ui.mensagem('O horário de entrada não pode estar no futuro.', true);
            mostrarEtapa(2);
        };
        conduta.onsubmit = (evento) => {
            evento.preventDefault();
            revisar();
        };
        conduta.acao_tomada.onchange = ajustarDestino;
        for (const formulario of [triagem, conduta])
            formulario.addEventListener('input', () => {
                alterado = true;
            });
        document.getElementById('salvar-atendimento').onclick = salvar;
        document.getElementById('form-cadastro-rapido').onsubmit = cadastrar;
        document.querySelectorAll('[data-lideranca]').forEach((controle) => {
            controle.onchange = () => {
                const campo = document.getElementById(controle.dataset.lideranca);
                campo.disabled = !controle.checked;
                campo.required = controle.checked;
            };
        });
        window.addEventListener('beforeunload', (evento) => {
            if (!alterado) return;
            evento.preventDefault();
            evento.returnValue = '';
        });
        window.addEventListener('sessao-encerrada', () => {
            alterado = false;
        });
        try {
            const opcoes = await ui.requisitar('/api/relatorios/opcoes');
            for (const grupo of ['supervisor', 'coordenador', 'gerente', 'setor', 'nucleo']) {
                const lista = ui.elemento('datalist');
                lista.id = 'opcoes-' + grupo;
                for (const item of opcoes) {
                    if (item.campo === grupo) lista.append(new Option(item.valor, item.valor));
                }
                document.getElementById('listas-cadastro').append(lista);
                const campo = document.getElementById('novo-' + grupo);
                if (campo) campo.setAttribute('list', lista.id);
            }
        } catch (erro) {
            ui.mensagem(erro.message, true);
        }
        const matricula = new URLSearchParams(location.search).get('matricula');
        if (matricula) await selecionar(matricula);
    });
})();
