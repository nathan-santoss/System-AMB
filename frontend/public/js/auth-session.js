(() => {
    let sessao = null;
    let encerrando = false;
    let enviando = false;
    let conferindo = false;
    let atividadePendente = false;
    let ultimaComunicacao = 0;
    let ultimaInteracao = 0;
    let intervalo = null;

    function compartilhar(dados) {
        try {
            localStorage.setItem('amb-sessao', JSON.stringify(dados));
        } catch {
            /* O servidor mantém a validação. */
        }
    }

    function atualizarSessao(dados) {
        if (!dados) return;
        sessao = { id: dados.id, limite: Date.now() + dados.expiraEm - dados.servidorAgora };
        compartilhar(sessao);
        if (!intervalo && location.pathname !== '/login') {
            intervalo = window.setInterval(conferirPrazo, 1000);
        }
    }

    function irLogin() {
        location.replace('/login?motivo=inatividade');
    }

    function avisarExpiracao() {
        if (encerrando || location.pathname === '/login') return;
        encerrando = true;
        window.clearInterval(intervalo);
        compartilhar({ id: sessao?.id, encerrada: true });
        // Retira os dados da tela antes de apresentar o aviso.
        window.dispatchEvent(new Event('sessao-encerrada'));
        document.body.replaceChildren();
        const painel = document.createElement('div');
        painel.className = 'aviso-sessao';
        painel.setAttribute('role', 'alertdialog');
        painel.setAttribute('aria-modal', 'true');
        const titulo = document.createElement('h1');
        titulo.textContent = 'Sessão encerrada';
        const texto = document.createElement('p');
        texto.textContent =
            'Sua sessão expirou após 30 minutos sem atividade ou ao atingir o limite de duração. Faça login novamente.';
        const botao = document.createElement('button');
        botao.className = 'botao-primario';
        botao.textContent = 'Ir para o login';
        botao.onclick = irLogin;
        painel.append(titulo, texto, botao);
        document.body.append(painel);
        botao.focus();
        window.setTimeout(irLogin, 4000);
    }

    async function fetchAutenticado(url, opcoes = {}) {
        const resposta = await fetch(url, {
            ...opcoes,
            credentials: 'same-origin',
            cache: 'no-store'
        });
        if (resposta.status === 401) avisarExpiracao();
        return resposta;
    }

    async function verificarSessao() {
        try {
            const resposta = await fetchAutenticado('/api/auth/verificar');
            const dados = await resposta.json();
            if (!resposta.ok) {
                return {
                    autenticado: false,
                    status: resposta.status,
                    mensagem: dados.erro || 'Sessão indisponível.'
                };
            }
            atualizarSessao(dados.sessao);
            return { autenticado: true, status: 200, usuario: dados.usuario };
        } catch {
            return {
                autenticado: false,
                status: 0,
                mensagem: 'Não foi possível verificar a sessão. Confira sua conexão.'
            };
        }
    }

    async function conferirPrazo() {
        if (!sessao || encerrando || conferindo) return;
        if (Date.now() >= sessao.limite) {
            conferindo = true;
            // Outra aba pode ter renovado a mesma sessão.
            const resultado = await verificarSessao();
            conferindo = false;
            if (!resultado.autenticado || Date.now() >= sessao.limite) avisarExpiracao();
        }
    }

    async function enviarAtividade() {
        if (!sessao || enviando || encerrando || !atividadePendente) return;
        if (Date.now() - ultimaInteracao > 60000) {
            atividadePendente = false;
            return;
        }
        if (Date.now() >= sessao.limite) {
            await conferirPrazo();
            if (encerrando) return;
        }
        enviando = true;
        atividadePendente = false;
        ultimaComunicacao = Date.now();
        try {
            // O envio agrupado conserva o horário da última ação, sem ampliar o prazo parado.
            const inativoHa = Math.min(60000, Date.now() - ultimaInteracao);
            const resposta = await fetchAutenticado('/api/auth/atividade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inativoHa })
            });
            if (resposta.ok) atualizarSessao((await resposta.json()).sessao);
        } catch {
            /* Uma falha de rede não renova o prazo local. */
        } finally {
            enviando = false;
        }
    }

    function registrarInteracao(evento) {
        if (!evento.isTrusted || !sessao || encerrando) return;
        atividadePendente = true;
        ultimaInteracao = Date.now();
        if (Date.now() - ultimaComunicacao >= 15000) enviarAtividade();
    }

    async function fazerLogout() {
        if (encerrando) return false;
        try {
            const resposta = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
            if (!resposta.ok) throw new Error();
            compartilhar({ id: sessao?.id, encerrada: true });
            window.dispatchEvent(new Event('sessao-encerrada'));
            location.replace('/login');
            return true;
        } catch {
            alert('Não foi possível encerrar a sessão. Tente novamente.');
            return false;
        }
    }

    window.addEventListener('storage', (evento) => {
        if (evento.key !== 'amb-sessao' || !evento.newValue || !sessao) return;
        try {
            const dados = JSON.parse(evento.newValue);
            if (dados.id !== sessao.id) return;
            if (dados.encerrada) return avisarExpiracao();
            sessao.limite = Math.max(sessao.limite, dados.limite);
        } catch {
            /* Ignora mensagens inválidas. */
        }
    });
    for (const evento of ['pointerdown', 'keydown', 'input', 'scroll']) {
        document.addEventListener(evento, registrarInteracao, { passive: true, capture: true });
    }
    document.addEventListener('visibilitychange', conferirPrazo);
    window.setInterval(() => {
        if (atividadePendente && Date.now() - ultimaComunicacao >= 15000) enviarAtividade();
    }, 1000);
    window.AuthSession = {
        fetchAutenticado,
        verificarSessao,
        exigirSessao: verificarSessao,
        fazerLogout,
        avisarExpiracao,
        async verificarSessaoNaTelaLogin() {
            const resultado = await verificarSessao();
            if (resultado.autenticado) location.replace('/dashboard');
            return resultado;
        }
    };
})();
