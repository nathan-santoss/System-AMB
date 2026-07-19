const BASE_URL = '/api'; // Rota base corrigida

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    // Redireciona se não tiver token (Item 6: Consistência de rota)
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
        return;
    }
    buscarPacientes();
});

async function buscarPacientes(termo = '') {
    const tabela = document.getElementById('tabela-pacientes');
    tabela.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Buscando...</td></tr>`;

    try {
        const token = localStorage.getItem('token');
        const url = termo ? `${BASE_URL}/funcionarios?busca=${encodeURIComponent(termo)}` : `${BASE_URL}/funcionarios`;

        const resposta = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error('Falha ao carregar dados.');
        }

        const dados = await resposta.json();

        if (dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>`;
            return;
        }

        tabela.innerHTML = ''; // Limpa a tabela antes de preencher

        dados.forEach(paciente => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-100 hover:bg-gray-50 transition-colors";

            tr.innerHTML = `
                <td class="py-4 px-6 text-sm text-gray-800 font-medium">${escapeHTML(paciente.matricula)}</td>
                <td class="py-4 px-6 text-sm text-gray-800">${escapeHTML(paciente.nome)}</td>
                <td class="py-4 px-6 text-sm text-gray-500">${escapeHTML(paciente.cargo)}</td>
                <td class="py-4 px-6 text-sm text-gray-500">${escapeHTML(paciente.setor)}</td>
                <td class="py-4 px-6 text-sm font-medium flex gap-2">
                    <a href="/ficha-paciente?matricula=${encodeURIComponent(paciente.matricula)}" class="bg-azulEscuro hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm">Prontuário</a>
                    <button data-matricula="${escapeHTML(paciente.matricula)}" data-nome="${escapeHTML(paciente.nome)}" data-setor="${escapeHTML(paciente.setor)}" data-cargo="${escapeHTML(paciente.cargo)}" class="btn-editar bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm">Editar</button>
                    <button data-matricula="${escapeHTML(paciente.matricula)}" class="btn-excluir bg-vermelhoAlerta hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);
        });

        // Adiciona eventos aos botões recém-criados
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                abrirModalEditar(e.target.dataset.matricula, e.target.dataset.nome, e.target.dataset.setor, e.target.dataset.cargo);
            });
        });

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deletarPaciente(e.target.dataset.matricula);
            });
        });

    } catch (erro) {
        tabela.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro: ${escapeHTML(erro.message)}</td></tr>`;
    }
}

function abrirModalEditar(matricula, nome, setor, cargo) {
    document.getElementById('edit-matricula').value = matricula;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-setor').value = setor;
    document.getElementById('edit-cargo').value = cargo;
    document.getElementById('modal-editar').classList.remove('hidden');
}

function fecharModalEditar() {
    document.getElementById('modal-editar').classList.add('hidden');
}

// Ouvinte para a busca
document.getElementById('form-busca')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const termo = document.getElementById('input-busca').value;
    buscarPacientes(termo);
});

// Ouvinte para submissão da edição
document.getElementById('form-editar-paciente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = document.getElementById('edit-matricula').value;
    const nome = document.getElementById('edit-nome').value;
    const setor = document.getElementById('edit-setor').value;
    const cargo = document.getElementById('edit-cargo').value;

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/funcionarios/${encodeURIComponent(matricula)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, setor, cargo })
        });

        if (!resposta.ok) {
            const erroData = await resposta.json();
            throw new Error(erroData.erro || erroData.message || 'Erro ao editar');
        }

        alert('Funcionário atualizado com sucesso!');
        fecharModalEditar();
        buscarPacientes(); // recarrega a lista
    } catch (erro) {
        alert('Falha: ' + erro.message);
    }
});

async function deletarPaciente(matricula) {
    if (!confirm(`ATENÇÃO: Deseja realmente excluir o funcionário de matrícula ${matricula}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/funcionarios/${encodeURIComponent(matricula)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) {
            const erroData = await resposta.json();
            throw new Error(erroData.erro || erroData.message || 'Erro ao excluir');
        }

        alert('Funcionário excluído com sucesso.');
        buscarPacientes(); // Atualiza a tabela
    } catch (erro) {
        alert('Falha: ' + erro.message);
    }
}