(() => {
    const ui = window.AmbUI;
    const form = document.getElementById('form-usuario');
    const editor = document.getElementById('editor-usuario');
    const lista = document.getElementById('lista-usuarios');
    const anterior = document.getElementById('pagina-anterior');
    const seguinte = document.getElementById('pagina-seguinte');
    const salvar = document.getElementById('salvar-usuario');
    let editando = null;
    let pagina = 1;
    let paginas = 1;
    let ocupado = false;

    function definirOcupado(valor) {
        ocupado = valor;
        for (const botao of document.querySelectorAll('.pagina-usuarios button'))
            botao.disabled = valor;
        anterior.disabled = valor || pagina <= 1;
        seguinte.disabled = valor || pagina >= paginas;
    }

    function abrirEditor(usuario = null) {
        editando = usuario;
        form.reset();
        let titulo = 'Novo usuário';
        let rotulo = 'Senha inicial';
        let acao = 'Criar usuário';
        form.elements.senha.required = true;
        if (usuario) {
            titulo = 'Editar usuário';
            rotulo = 'Nova senha (opcional)';
            acao = 'Salvar alterações';
            form.elements.email.value = usuario.email;
            form.elements.senha.required = false;
        }
        document.getElementById('titulo-editor').textContent = titulo;
        document.getElementById('rotulo-senha').textContent = rotulo;
        salvar.textContent = acao;
        editor.hidden = false;
        form.elements.email.focus();
    }

    function fecharEditor() {
        editando = null;
        form.reset();
        editor.hidden = true;
        document.getElementById('novo-usuario').focus();
    }

    function criarLinha(usuario) {
        const linha = ui.elemento('tr');
        let perfil = 'Usuário';
        let situacao = 'Ativo';
        let acao = 'Desativar';
        if (usuario.perfil === 'admin') perfil = 'Administrador';
        if (!usuario.ativo) {
            situacao = 'Inativo';
            acao = 'Reativar';
        }
        const estado = ui.elemento('span', situacao, 'situacao-usuario');
        estado.classList.toggle('inativo', !usuario.ativo);
        const celulaEstado = ui.elemento('td');
        celulaEstado.append(estado);
        const acoes = ui.elemento('td');
        if (usuario.perfil === 'admin') {
            acoes.textContent = 'Conta administrativa';
        } else {
            const grupo = ui.elemento('div', null, 'acoes-usuario');
            const editar = ui.elemento('button', 'Editar', 'botao-secundario');
            editar.type = 'button';
            editar.setAttribute('aria-label', 'Editar ' + usuario.email);
            editar.addEventListener('click', () => abrirEditor(usuario));
            const alternar = ui.elemento('button', acao, 'botao-secundario');
            alternar.type = 'button';
            alternar.setAttribute('aria-label', acao + ' ' + usuario.email);
            alternar.addEventListener('click', () => alterarSituacao(usuario));
            grupo.append(editar, alternar);
            acoes.append(grupo);
        }
        linha.append(
            ui.elemento('td', usuario.email),
            ui.elemento('td', perfil),
            celulaEstado,
            acoes
        );
        return linha;
    }

    async function carregar() {
        const dados = await ui.requisitar('/api/usuarios?pagina=' + pagina);
        paginas = dados.paginas;
        lista.replaceChildren(...dados.usuarios.map(criarLinha));
        if (!dados.usuarios.length) ui.linhaVazia(lista, 4, 'Nenhum usuário cadastrado.');
        document.getElementById('resumo-usuarios').textContent =
            dados.total + ' usuários · Página ' + pagina + ' de ' + paginas;
    }

    async function atualizarLista() {
        if (ocupado) return;
        definirOcupado(true);
        try {
            await carregar();
        } catch (erro) {
            ui.linhaVazia(lista, 4, 'Não foi possível carregar os usuários.');
            ui.mensagem(erro.message, true);
        } finally {
            definirOcupado(false);
        }
    }

    async function alterarSituacao(usuario) {
        if (ocupado) return;
        if (
            usuario.ativo &&
            !window.confirm('Desativar o acesso de ' + usuario.email + ' e encerrar suas sessões?')
        )
            return;
        definirOcupado(true);
        let concluido = false;
        try {
            await ui.enviar(
                '/api/usuarios/' + usuario.id_usuario,
                { ativo: !usuario.ativo },
                'PATCH'
            );
            concluido = true;
            if (editando?.id_usuario === usuario.id_usuario) fecharEditor();
            ui.mensagem('Situação do usuário atualizada.');
            await carregar();
        } catch (erro) {
            let mensagem = erro.message;
            if (concluido)
                mensagem =
                    'A situação foi salva, mas a lista não pôde ser atualizada. Recarregue a página.';
            ui.mensagem(mensagem, true);
        } finally {
            definirOcupado(false);
        }
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (ocupado || !form.reportValidity()) return;
        const dados = { email: form.elements.email.value.trim() };
        const senha = form.elements.senha.value;
        if (senha || !editando) dados.senha = senha;
        if (senha && new TextEncoder().encode(senha).length > 72) {
            ui.mensagem(
                'A senha deve ocupar no máximo 72 bytes. Reduza a quantidade de caracteres.',
                true
            );
            return;
        }
        let url = '/api/usuarios';
        let metodo = 'POST';
        if (editando) {
            url += '/' + editando.id_usuario;
            metodo = 'PATCH';
        }
        definirOcupado(true);
        let concluido = false;
        try {
            await ui.enviar(url, dados, metodo);
            concluido = true;
            fecharEditor();
            ui.mensagem('Usuário salvo com sucesso.');
            await carregar();
        } catch (erro) {
            let mensagem = erro.message;
            if (concluido)
                mensagem =
                    'O usuário foi salvo, mas a lista não pôde ser atualizada. Recarregue a página.';
            ui.mensagem(mensagem, true);
        } finally {
            definirOcupado(false);
        }
    });
    document.getElementById('novo-usuario').addEventListener('click', () => abrirEditor());
    document.getElementById('cancelar-usuario').addEventListener('click', fecharEditor);
    anterior.addEventListener('click', () => {
        pagina -= 1;
        atualizarLista();
    });
    seguinte.addEventListener('click', () => {
        pagina += 1;
        atualizarLista();
    });
    document.addEventListener('DOMContentLoaded', async () => {
        const resultado = await window.AuthSession.exigirSessao();
        if (!resultado.autenticado) return ui.mensagem(resultado.mensagem, true);
        await atualizarLista();
    });
})();
