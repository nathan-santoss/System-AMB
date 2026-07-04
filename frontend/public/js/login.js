document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem('token', dados.token);
            window.location.href = '/dashboard';
        } else {
            if (dados.erro) {
                alert('Acesso negado: ' + dados.erro);
            } else {
                alert('Acesso negado: Credenciais inválidas.');
            }
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert('Erro ao conectar com o servidor. Verifique se o Back-end está rodando.');
    }
});