document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await window.AuthSession.exigirSessao();
    if (!sessao.autenticado) return;
    document.getElementById('imprimir-pop').addEventListener('click', () => window.print());
});
