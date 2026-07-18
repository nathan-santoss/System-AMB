document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // Salva no LocalStorage como fallback, mas o navegador já recebeu o Cookie
            localStorage.setItem('token', dados.token);
            window.location.href = '/dashboard';
        } else {
            // Espera dados.message unificado no backend
            if (dados.message) {
                alert('Acesso negado: ' + dados.message);
            } else {
                alert('Credenciais inválidas.');
            }
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao comunicar com o servidor.');
    }
});