(() => {
    // Cria conteúdo como texto para não interpretar dados do cadastro como HTML.
    function elemento(tag, texto, classe) {
        const item = document.createElement(tag);
        if (texto !== undefined && texto !== null) item.textContent = String(texto);
        if (classe) item.className = classe;
        return item;
    }
    function mensagem(texto, erro = false) {
        const alvo = document.getElementById('mensagem-pagina');
        if (!alvo) return;
        alvo.hidden = !texto;
        alvo.textContent = texto;
        alvo.classList.toggle('erro', erro);
    }
    // Compartilha o tratamento de sessão e mensagens entre as novas páginas.
    async function requisitar(url, opcoes = {}) {
        const resposta = await window.AuthSession.fetchAutenticado(url, opcoes);
        let dados = {};
        try {
            dados = await resposta.json();
        } catch {
            /* A mensagem padrão cobre respostas sem JSON. */
        }
        if (!resposta.ok)
            throw new Error(dados.erro || dados.message || 'Não foi possível concluir a operação.');
        return dados;
    }
    function enviar(url, dados, method = 'POST') {
        return requisitar(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
    }
    function dataHora(valor) {
        if (!valor) return 'Em aberto';
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return 'Não informado';
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'America/Sao_Paulo'
        }).format(data);
    }
    function hoje() {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    }
    function vinculo(funcionario) {
        const partes = [];
        for (const cargo of ['supervisor', 'coordenador', 'gerente']) {
            if (funcionario[cargo]) partes.push(cargo + ': ' + funcionario[cargo]);
        }
        if (!partes.length) return 'Nenhuma liderança informada.';
        return partes.join(' • ');
    }
    function linhaVazia(corpo, colunas, texto = 'Nenhum registro encontrado.') {
        corpo.replaceChildren();
        const linha = elemento('tr');
        const celula = elemento('td', texto);
        celula.colSpan = colunas;
        linha.append(celula);
        corpo.append(linha);
    }
    async function baixar(url, nome) {
        const resposta = await window.AuthSession.fetchAutenticado(url);
        if (!resposta.ok) {
            let mensagem = 'Não foi possível exportar.';
            try {
                mensagem = (await resposta.json()).erro || mensagem;
            } catch {
                /* Mantém a mensagem padrão. */
            }
            throw new Error(mensagem);
        }
        const endereco = URL.createObjectURL(await resposta.blob());
        const link = elemento('a');
        link.href = endereco;
        link.download = nome;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(endereco), 3000);
    }
    window.AmbUI = {
        elemento,
        mensagem,
        requisitar,
        enviar,
        dataHora,
        hoje,
        vinculo,
        linhaVazia,
        baixar
    };
})();
