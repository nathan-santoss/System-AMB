const BASE_URL = "/api";

// Ferramenta de Sanitização (XSS)
function escapeHTML(str) {
    if (!str) return 'Não informado';
    return str.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

document.getElementById('formBusca').addEventListener('submit', async (e) => {
    e.preventDefault();
    buscarDados();
});

async function buscarDados() {
    const termo = document.getElementById('inputBusca').value;
    const tabela = document.getElementById('tabelaPacientes');
    const token = localStorage.getItem('token');

    tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></td></tr>`;
    lucide.createIcons();

    try {
        let url = termo ? `${BASE_URL}/funcionarios?busca=${encodeURIComponent(termo)}` : `${BASE_URL}/funcionarios`;

        const resposta = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });

        if (resposta.status === 401 || resposta.status === 403) {
            alert("A sua sessão expirou.");
            // redirecionament padronizado
            window.location.href = '/login';
            return;
        }

        const dados = await resposta.json();

        if (dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-vermelhoAlerta font-medium">Nenhum paciente encontrado.</td></tr>`;
            return;
        }

        tabela.innerHTML = dados.map(paciente => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-4 px-6 font-medium text-slate-700">${escapeHTML(paciente.matricula)}</td>
                <td class="py-4 px-6 font-bold text-azulEscuro">${escapeHTML(paciente.nome)}</td>
                <td class="py-4 px-6 text-sm text-slate-500">
                    ${escapeHTML(paciente.cargo)}<br>
                    <span class="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <i data-lucide="map-pin" class="w-3 h-3"></i> ${escapeHTML(paciente.setor)}
                    </span>
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex justify-center items-center gap-2">
                        <a href="/ficha-paciente?matricula=${encodeURIComponent(paciente.matricula)}" 
                           class="inline-flex items-center gap-2 bg-azulEscuro text-white py-2 px-3 rounded-lg">
                            <i data-lucide="folder-open" class="w-4 h-4"></i> Prontuário
                        </a>
                        <button class="btn-editar inline-flex items-center gap-2 bg-slate-100 text-slate-600 py-2 px-3 rounded-lg"
                                data-matricula="${escapeHTML(paciente.matricula)}"
                                data-nome="${escapeHTML(paciente.nome)}"
                                data-setor="${escapeHTML(paciente.setor)}"
                                data-cargo="${escapeHTML(paciente.cargo)}">
                            <i data-lucide="edit-3" class="w-4 h-4"></i> Editar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const b = e.currentTarget;
                abrirModalEditar(b.dataset.matricula, b.dataset.nome, b.dataset.setor, b.dataset.cargo);
            });
        });

        lucide.createIcons();
    } catch (erro) {
        console.error(erro);
        tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-vermelhoAlerta font-medium">Falha ao buscar dados.</td></tr>`;
    }
}