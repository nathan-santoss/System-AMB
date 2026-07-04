const BASE_URL = "";

document.getElementById('formBusca').addEventListener('submit', async (e) => {
    e.preventDefault();
    buscarDados();
});

async function buscarDados() {
    const termo = document.getElementById('inputBusca').value;
    const tabela = document.getElementById('tabelaPacientes');

    tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></td></tr>`;
    lucide.createIcons();

    try {
        const token = localStorage.getItem('token');
        let url;
        if (termo) {
            url = `${BASE_URL}/funcionarios?busca=${termo}`;
        } else {
            url = `${BASE_URL}/funcionarios`;
        }

        const resposta = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            alert("A sua sessão expirou. Por favor, faça login novamente.");
            fazerLogout();
            return;
        }

        const dados = await resposta.json();

        if (dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-vermelhoAlerta font-medium">Nenhum paciente encontrado.</td></tr>`;
            return;
        }

        tabela.innerHTML = dados.map(paciente => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-4 px-6 font-medium text-slate-700">${paciente.matricula}</td>
                <td class="py-4 px-6 font-bold text-azulEscuro">${paciente.nome}</td>
                <td class="py-4 px-6 text-sm text-slate-500">
                    ${paciente.cargo}<br>
                    <span class="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <i data-lucide="map-pin" class="w-3 h-3"></i> ${paciente.setor}
                    </span>
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex justify-center items-center gap-2">
                        <a href="/ficha-paciente?matricula=${paciente.matricula}" 
                           class="inline-flex items-center gap-2 bg-azulEscuro hover:bg-blue-800 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition-all text-sm" title="Abrir Prontuário">
                            <i data-lucide="folder-open" class="w-4 h-4"></i> Prontuário
                        </a>
                        <button onclick="abrirModalEditar('${paciente.matricula}', '${paciente.nome}', '${paciente.setor}', '${paciente.cargo}')" 
                                class="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-all" title="Editar Funcionário">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deletarPaciente('${paciente.matricula}')" 
                                class="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-all" title="Excluir Funcionário">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();

    } catch (erro) {
        console.error("Erro:", erro);
        tabela.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-red-500">Erro ao comunicar com o servidor.</td></tr>`;
    }
}

async function deletarPaciente(matricula) {
    if (!confirm(`Atenção: Tem certeza que deseja remover o funcionário da matrícula ${matricula}?\nTodos os registros dele serão perdidos.`)) return;

    const token = localStorage.getItem('token');
    try {
        const resposta = await fetch(`${BASE_URL}/funcionarios/${matricula}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
            alert("Funcionário excluído com sucesso!");
            buscarDados();
        } else {
            alert("Erro ao excluir o funcionário.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Falha na conexão ao tentar excluir.");
    }
}

function abrirModalEditar(matricula, nome, setor, cargo) {
    const modal = document.getElementById('modal-editar-paciente');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.getElementById('edit-matricula').value = matricula;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-setor').value = setor;
    document.getElementById('edit-cargo').value = cargo;
}

function fecharModalEditar() {
    const modal = document.getElementById('modal-editar-paciente');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

document.getElementById('form-editar-paciente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const matricula = document.getElementById('edit-matricula').value;

    const dados = {
        nome: document.getElementById('edit-nome').value,
        setor: document.getElementById('edit-setor').value,
        cargo: document.getElementById('edit-cargo').value
    };

    try {
        const resposta = await fetch(`${BASE_URL}/funcionarios/${matricula}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            fecharModalEditar();
            buscarDados();
        } else {
            alert('Erro ao atualizar dados.');
        }
    } catch (erro) {
        console.error(erro);
    }
});