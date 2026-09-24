let logoutSidebarEmAndamento = false;

function obterSidebar() {
    return document.getElementById('sidebar-principal');
}

function obterBackdropSidebar() {
    return document.getElementById('sidebar-backdrop');
}

function obterBotaoAbrirSidebar() {
    return document.getElementById('botao-abrir-sidebar');
}

function atualizarEstadoAcessibilidadeSidebar(aberto) {
    const botaoAbrir = obterBotaoAbrirSidebar();
    const backdrop = obterBackdropSidebar();
    if (botaoAbrir) botaoAbrir.setAttribute('aria-expanded', String(aberto));
    if (backdrop) backdrop.setAttribute('aria-hidden', String(!aberto));
}

function abrirSidebar() {
    const sidebar = obterSidebar();

    const backdrop = obterBackdropSidebar();

    if (sidebar) {
        sidebar.classList.remove('-translate-x-full');

        sidebar.classList.add('translate-x-0');
    }

    if (backdrop) {
        backdrop.classList.remove('hidden');
    }

    document.body.classList.add('overflow-hidden');

    atualizarEstadoAcessibilidadeSidebar(true);
}

function fecharSidebar() {
    const sidebar = obterSidebar();

    const backdrop = obterBackdropSidebar();

    if (sidebar) {
        sidebar.classList.remove('translate-x-0');

        sidebar.classList.add('-translate-x-full');
    }

    if (backdrop) {
        backdrop.classList.add('hidden');
    }

    const modalAberto = Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
        (modal) => !modal.classList.contains('hidden')
    );
    document.body.classList.toggle('overflow-hidden', modalAberto);

    atualizarEstadoAcessibilidadeSidebar(false);
}

function definirLogoutCarregando(carregando) {
    const botaoLogout = document.getElementById('botao-logout-sidebar');

    const textoLogout = document.getElementById('texto-logout-sidebar');

    if (botaoLogout) {
        botaoLogout.disabled = carregando;
    }

    if (!textoLogout) {
        return;
    }

    if (carregando) {
        textoLogout.textContent = 'Saindo...';

        return;
    }

    textoLogout.textContent = 'Sair do sistema';
}

function moduloAutenticacaoEstaDisponivel() {
    if (!window.AuthSession) {
        return false;
    }

    if (typeof window.AuthSession.fazerLogout !== 'function') {
        return false;
    }

    return true;
}

async function executarLogoutSidebar() {
    if (logoutSidebarEmAndamento) {
        return;
    }

    logoutSidebarEmAndamento = true;

    definirLogoutCarregando(true);

    if (!moduloAutenticacaoEstaDisponivel()) {
        console.error('O módulo de autenticação não foi carregado.');

        window.alert('Não foi possível sair. Recarregue a página e tente novamente.');
        logoutSidebarEmAndamento = false;
        definirLogoutCarregando(false);

        return;
    }

    try {
        await window.AuthSession.fazerLogout();
    } finally {
        logoutSidebarEmAndamento = false;
        definirLogoutCarregando(false);
    }
}

function itemMenuEstaAtivo(tipoMenu, caminhoAtual) {
    if (tipoMenu === 'funcionarios') {
        return ['/consultar-paciente', '/ficha-paciente'].includes(caminhoAtual);
    }
    return caminhoAtual === '/' + tipoMenu;
}

function destacarMenuAtual() {
    const caminhoAtual = window.location.pathname;

    const itensMenu = document.querySelectorAll('.item-menu-sidebar');

    itensMenu.forEach(function (item) {
        const tipoMenu = item.getAttribute('data-menu');

        const menuAtivo = itemMenuEstaAtivo(tipoMenu, caminhoAtual);

        if (menuAtivo) {
            item.classList.remove('text-blue-100');

            item.classList.add('bg-blue-800', 'text-white', 'shadow-inner');

            item.setAttribute('aria-current', 'page');

            return;
        }

        item.classList.remove('bg-blue-800', 'text-white', 'shadow-inner');

        item.classList.add('text-blue-100');

        item.removeAttribute('aria-current');
    });
}

function configurarEventosSidebar() {
    const botaoAbrir = obterBotaoAbrirSidebar();

    const botaoFechar = document.getElementById('botao-fechar-sidebar');

    const botaoLogout = document.getElementById('botao-logout-sidebar');

    const backdrop = obterBackdropSidebar();

    const itensMenu = document.querySelectorAll('.item-menu-sidebar');

    if (botaoAbrir) {
        botaoAbrir.addEventListener('click', abrirSidebar);
    }

    if (botaoFechar) {
        botaoFechar.addEventListener('click', fecharSidebar);
    }

    if (botaoLogout) {
        botaoLogout.addEventListener('click', executarLogoutSidebar);
    }

    if (backdrop) {
        backdrop.addEventListener('click', fecharSidebar);
    }

    itensMenu.forEach(function (item) {
        item.addEventListener('click', function () {
            if (window.innerWidth < 768) {
                fecharSidebar();
            }
        });
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharSidebar();
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth < 768) {
            return;
        }

        fecharSidebar();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    destacarMenuAtual();
    configurarEventosSidebar();
    atualizarEstadoAcessibilidadeSidebar(false);

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
