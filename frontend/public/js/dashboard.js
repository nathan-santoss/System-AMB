// Ferramenta anti-XSS para proteger as listas (Erro 13 da auditoria)
function escapeHTML(str) {
    if (!str) return 'Não informado';
    return str.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// Função de logout global (acessível pelo botão do EJS)
window.fazerLogout = function () {
    localStorage.removeItem('token');
    window.location.href = '/login';
};

// Lógica principal ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Apontando para a rota de API correta do backend
        const resposta = await fetch('/api/atendimentos/dashboard', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Se o token expirar ou a rota for proibida, expulsa pro login
        if (resposta.status === 401 || resposta.status === 403) {
            fazerLogout();
            return;
        }

        if (!resposta.ok) {
            throw new Error('Erro ao carregar dados do dashboard');
        }

        const dados = await resposta.json();

        // Contador Principal
        document.getElementById('contador-hoje').innerText = dados.totalHoje || 0;

        // Gravidades
        if (dados.gravidadeHoje) {
            document.getElementById('count-normal').innerText = dados.gravidadeHoje.baixa || 0;
            document.getElementById('count-medio').innerText = dados.gravidadeHoje.media || 0;
            document.getElementById('count-grave').innerText = dados.gravidadeHoje.alta || 0;
        }

        // Últimos Atendimentos
        const tabela = document.getElementById('lista-ultimos-atendimentos');
        const ultimos = dados.ultimosAtendimentos || [];

        if (ultimos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-gray-400">Nenhum atendimento recente.</td></tr>`;
        } else {
            tabela.innerHTML = ultimos.map(a => {
                // Formata a data se existir, senão põe um traço
                const dataFormatada = a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--/--/----';

                // Define a cor da badge de gravidade
                let corGravidade = 'bg-green-50 text-green-600 border-green-200'; // Normal/Baixa
                if (a.gravidade === 'Alta') corGravidade = 'bg-red-50 text-red-600 border-red-200';
                else if (a.gravidade === 'Média') corGravidade = 'bg-yellow-50 text-yellow-600 border-yellow-200';

                return `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-3 font-medium text-azulEscuro">${escapeHTML(a.queixa_principal || 'Sem queixa registrada')}</td>
                    <td class="py-3 text-center">
                        <span class="px-2 py-1 text-xs font-bold rounded-full border ${corGravidade}">
                            ${escapeHTML(a.gravidade)}
                        </span>
                    </td>
                    <td class="py-3 text-center text-gray-500 text-xs">${dataFormatada}</td>
                </tr>
                `;
            }).join('');
        }

        // Ranking de Setores
        const setoresDiv = document.getElementById('lista-setores');
        const setoresData = dados.atendimentosPorSetor || [];

        if (setoresData.length === 0) {
            setoresDiv.innerHTML = `<div class="text-gray-400 text-center py-4">Sem dados de setores.</div>`;
        } else {
            setoresDiv.innerHTML = setoresData.map(s => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span class="font-medium text-gray-700">${escapeHTML(s.setor)}</span>
                    <span class="font-bold text-azulEscuro bg-blue-100 px-3 py-1 rounded-full text-xs">${s.quantidade}</span>
                </div>
            `).join('');
        }

    } catch (erro) {
        console.error("Erro no Dashboard:", erro);
        document.getElementById('contador-hoje').innerText = "Erro";
    }
});