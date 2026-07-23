const BASE_URL = "/api";

// Função para prevenir XSS
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
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const matricula = params.get('matricula');

    if (!matricula) {
        alert('Matrícula não informada.');
        window.location.href = '/consultar-paciente';
        return;
    }

    carregarDadosPaciente(matricula);
    carregarAlergias(matricula);
    carregarHistoricoAtendimentos(matricula);
});

async function carregarDadosPaciente(matricula) {
    try {
        const token = localStorage.getItem('token');
        // CORREÇÃO (Item 12): Rotas apontando para /api
        const resposta = await fetch(`${BASE_URL}/funcionarios/${encodeURIComponent(matricula)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) throw new Error('Paciente não encontrado');

        const paciente = await resposta.json();

        // CORREÇÃO (Item 13): Prevenção XSS
        document.getElementById('info-nome').textContent = paciente.nome || 'Não informado';
        document.getElementById('info-matricula').textContent = paciente.matricula;
        document.getElementById('info-setor').textContent = paciente.setor || 'Não informado';
        document.getElementById('info-cargo').textContent = paciente.cargo || 'Não informado';
    } catch (erro) {
        alert(erro.message);
    }
}

async function carregarAlergias(matricula) {
    const listaAlergias = document.getElementById('lista-alergias');
    listaAlergias.innerHTML = '<p class="text-sm text-gray-500">Carregando...</p>';

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/alergias?funcionario_matricula=${encodeURIComponent(matricula)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) throw new Error('Erro ao carregar alergias');

        const alergias = await resposta.json();

        if (alergias.length === 0) {
            listaAlergias.innerHTML = '<p class="text-sm text-gray-500">Nenhuma alergia registrada.</p>';
            return;
        }

        listaAlergias.innerHTML = '';
        alergias.forEach(alergia => {
            const div = document.createElement('div');
            div.className = "bg-red-50 text-vermelhoAlerta border border-red-100 rounded-lg p-3 text-sm flex justify-between items-center";

            // CORREÇÃO (Item 13): EscapeHTML na descrição da alergia
            div.innerHTML = `
                <span class="font-medium">${escapeHTML(alergia.descricao_alergia)}</span>
                <button onclick="excluirAlergia(${alergia.id_alergia})" class="text-red-400 hover:text-red-700 transition-colors" title="Remover">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            listaAlergias.appendChild(div);
        });

        if (window.lucide) window.lucide.createIcons();
    } catch (erro) {
        listaAlergias.innerHTML = `<p class="text-sm text-red-500">${escapeHTML(erro.message)}</p>`;
    }
}

// Funções de Modal para Alergia
function abrirModalAlergia() {
    document.getElementById('modalAlergia').classList.remove('hidden');
}

function fecharModalAlergia() {
    document.getElementById('modalAlergia').classList.add('hidden');
    document.getElementById('formAlergia').reset();
}

document.getElementById('formAlergia')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const matricula = params.get('matricula');
    const descricao = document.getElementById('descricaoAlergia').value;

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/alergias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                funcionario_matricula: matricula,
                descricao_alergia: descricao
            })
        });

        if (!resposta.ok) {
            const erroData = await resposta.json();
            throw new Error(erroData.message || erroData.erro || 'Erro ao cadastrar alergia');
        }

        fecharModalAlergia();
        carregarAlergias(matricula);
    } catch (erro) {
        alert(erro.message);
    }
});

async function excluirAlergia(idAlergia) {
    if (!confirm('Deseja realmente remover esta alergia?')) return;

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/alergias/${idAlergia}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) throw new Error('Falha ao remover alergia');

        const params = new URLSearchParams(window.location.search);
        carregarAlergias(params.get('matricula'));
    } catch (erro) {
        alert(erro.message);
    }
}

// Registrando Atendimento (Triagem)
document.getElementById('form-triagem')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const matricula = params.get('matricula');

    const pressao = document.getElementById('pressao').value;
    const temperatura = document.getElementById('temperatura').value;
    const queixa = document.getElementById('queixa').value;
    const gravidade = document.querySelector('input[name="gravidade"]:checked')?.value;

    if (!gravidade) {
        alert("Por favor, selecione a gravidade.");
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/atendimentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                funcionario_matricula: matricula,
                pressao_arterial: pressao,
                temperatura: temperatura,
                queixa_principal: queixa,
                gravidade: gravidade,
                data_hora_entrada: new Date().toISOString()
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.message || dados.erro || 'Erro ao registrar atendimento');
        }

        alert('Triagem registrada com sucesso!');
        document.getElementById('form-triagem').reset();
        carregarHistoricoAtendimentos(matricula);

    } catch (erro) {
        alert('Erro: ' + erro.message);
    }
});

async function carregarHistoricoAtendimentos(matricula) {
    // Implementação de carregamento de histórico (caso exista a rota GET /atendimentos/:matricula)
    // Para evitar que a página trave se não houver container, testamos:
    const historicoContainer = document.getElementById('historico-atendimentos');
    if (!historicoContainer) return;

    historicoContainer.innerHTML = '<p class="text-sm text-gray-500">Carregando histórico...</p>';

    try {
        const token = localStorage.getItem('token');
        const resposta = await fetch(`${BASE_URL}/atendimentos/${encodeURIComponent(matricula)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) throw new Error("Falha ao carregar histórico");

        const atendimentos = await resposta.json();

        if (atendimentos.length === 0) {
            historicoContainer.innerHTML = '<p class="text-sm text-gray-500">Nenhum atendimento anterior.</p>';
            return;
        }

        historicoContainer.innerHTML = '';
        atendimentos.sort((a, b) => new Date(b.data_hora_entrada) - new Date(a.data_hora_entrada)).forEach(at => {
            const data = new Date(at.data_hora_entrada).toLocaleDateString('pt-BR');
            const div = document.createElement('div');
            div.className = "border-l-4 border-azulEscuro pl-3 py-1 mb-4 bg-gray-50 rounded-r-lg p-2";
            div.innerHTML = `
                <p class="text-xs text-gray-400 mb-1">Data: ${data} - Gravidade: <span class="font-bold">${escapeHTML(at.gravidade)}</span></p>
                <p class="text-sm text-gray-700">${escapeHTML(at.queixa_principal)}</p>
            `;
            historicoContainer.appendChild(div);
        });
    } catch (erro) {
        historicoContainer.innerHTML = `<p class="text-sm text-red-500">${escapeHTML(erro.message)}</p>`;
    }
}