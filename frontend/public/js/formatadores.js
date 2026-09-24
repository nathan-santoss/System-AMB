(() => {
    function escapeHTML(valor) {
        if (valor === null) {
            return '';
        }

        if (valor === undefined) {
            return '';
        }

        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function obterTextoExibicao(valor, textoPadrao = 'Não informado') {
        if (valor === null) {
            return textoPadrao;
        }

        if (valor === undefined) {
            return textoPadrao;
        }

        const texto = String(valor).trim();

        if (texto.length === 0) {
            return textoPadrao;
        }

        return texto;
    }

    async function lerRespostaJson(resposta) {
        try {
            return await resposta.json();
        } catch (erro) {
            return {};
        }
    }

    function obterMensagemErro(dados, mensagemPadrao) {
        if (dados) {
            if (typeof dados.erro === 'string') {
                const mensagemErro = dados.erro.trim();

                if (mensagemErro.length > 0) {
                    return mensagemErro;
                }
            }

            if (typeof dados.message === 'string') {
                const mensagem = dados.message.trim();

                if (mensagem.length > 0) {
                    return mensagem;
                }
            }

            if (Array.isArray(dados.detalhes)) {
                if (dados.detalhes.length > 0) {
                    return dados.detalhes.join(' ');
                }
            }
        }

        return mensagemPadrao;
    }

    function formatarDataHora(valor, textoPadrao = 'Não informado') {
        if (!valor) {
            return textoPadrao;
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return 'Data inválida';
        }

        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    window.AmbFormatadores = {
        escapeHTML,
        obterTextoExibicao,
        lerRespostaJson,
        obterMensagemErro,
        formatarDataHora
    };
})();
