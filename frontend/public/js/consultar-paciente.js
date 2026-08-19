const FUNCIONARIOS_BASE_URL = '/api/funcionarios';
let termoBuscaAtual = '';
let temporizadorMensagem = null;

// Aqui eu inicio os ícones para garantir a interface gráfica adequada.
function atualizarIcones() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Antes de fazer qualquer requisição eu valido se a sessão está mapeada no sistema.
function authSessionEstaDisponivel() {
    if (!window.AuthSession) {
        return false;
    }

    if (typeof window.AuthSession.fetchAutenticado !== 'function') {
        return false;
    }

    return true;
}

// Em seguida eu defino a lógica global para desconectar o usuário e mandá-lo para a tela de login.
async function fazerLogout() {
    if (authSessionEstaDisponivel()) {
        await window.AuthSession.fazerLogout();
        return;
    }

    localStorage.removeItem('token');
    window.location.href = '/login';
}

window.fazerLogout = fazerLogout;

// Nesta parte eu intercepto códigos de erro HTTP relacionados à autenticação.
async function respostaExigeNovoLogin(resposta) {
    if (!resposta) {
        return false;
    }

    if (resposta.status !== 401) {
        if (resposta.status !== 403) {
            return false;
        }
    }

    await fazerLogout();
    return true;
}

// Aqui eu faço o parse seguro da resposta em JSON.
async function lerRespostaJson(resposta) {
    try {
        return await resposta.json();
    } catch (erro) {
        return {};
    }
}

// Agora eu centralizo a obtenção da mensagem de erro devolvida pelo backend.
function obterMensagemErro(dados, mensagemPadrao) {
    if (dados) {
        if (typeof dados.erro === 'string') {
            const mensagemErro = dados.erro.trim();
            if (mensagemErro.length > 0) {
                return mensagemErro;
            }
        }

        if (typeof dados.message === 'string') {
            const mensagem = dados.message.trim();
            if (mensagem.length > 0) {
                return mensagem;
            }
        }

        if (Array.isArray(dados.detalhes)) {
            if (dados.detalhes.length > 0) {
                return dados.detalhes.join(' ');
            }
        }
    }

    return mensagemPadrao;
}

// Com isso, garanto que o texto inserido no HTML seja seguro contra ataques de XSS.
function escapeHTML(valor) {
    if (valor === null) {
        return '';
    }

    if (valor === undefined) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Para as células da tabela, eu configuro um fallback textual.
function obterTextoExibicao(valor) {
    if (valor === null) {
        return 'Não informado';
    }

    if (valor === undefined) {
        return 'Não informado';
    }

    const texto = String(valor).trim();

    if (texto.length === 0) {
        return 'Não informado';
    }

    return texto;
}

// Aqui eu coleto o valor exato dos campos do formulário para preparar o envio.
function obterValorFormulario(valor) {
    if (valor === null) {
        return '';
    }

    if (valor === undefined) {
        return '';
    }

    return String(valor);
}

// Nesta etapa eu limpo a formatação do CPF garantindo que apenas números trafeguem para a API.
function somenteNumeros(valor) {
    if (typeof valor !== 'string') {
        return '';
    }

    return valor.replace(/\D/g, '');
}

// Em seguida, crio a máscara visual do CPF para exibição ao usuário.
function formatarCpf(valor) {
    const numeros = somenteNumeros(obterValorFormulario(valor)).slice(0, 11);

    if (numeros.length <= 3) {
        return numeros;
    }

    if (numeros.length <= 6) {
        return numeros.replace(/^(\d{3})(\d+)/, '$1.$2');
    }

    if (numeros.length <= 9) {
        return numeros.replace(/^(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    }

    return numeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
}

// Conecto a máscara diretamente ao evento de digitação nos campos de CPF.
function aplicarMascaraCpf(evento) {
    evento.target.value = formatarCpf(evento.target.value);
}

// Agora eu lido com a mensagem flutuante, ocultando-a da tela de forma segura.
function esconderMensagem() {
    const elemento = document.getElementById('mensagem-flutuante');

    if (!elemento) {
        return;
    }

    elemento.classList.add('hidden');
    elemento.innerHTML = '';

    if (temporizadorMensagem) {
        window.clearTimeout(temporizadorMensagem);
        temporizadorMensagem = null;
    }
}

// Aqui eu injeto a mensagem flutuante (toast) e configuro a cor e ícone baseados no tipo do alerta.
function mostrarMensagem(mensagem, tipo) {
    const elemento = document.getElementById('mensagem-flutuante');

    if (!elemento) {
        return;
    }

    if (temporizadorMensagem) {
        window.clearTimeout(temporizadorMensagem);
        temporizadorMensagem = null;
    }

    elemento.className = 'fixed top-5 right-5 z-[70] max-w-sm rounded-xl shadow-xl px-5 py-4 flex items-start gap-3';

    let classesTipo = 'bg-slate-800 text-white';
    let icone = 'info';

    if (tipo === 'sucesso') {
        classesTipo = 'bg-green-600 text-white';
        icone = 'circle-check';
    }

    if (tipo === 'erro') {
        classesTipo = 'bg-red-600 text-white';
        icone = 'circle-alert';
    }

    if (tipo === 'aviso') {
        classesTipo = 'bg-yellow-500 text-yellow-950';
        icone = 'triangle-alert';
    }

    elemento.className += ' ' + classesTipo;

    elemento.innerHTML = `
        <i data-lucide="${icone}" class="w-5 h-5 shrink-0 mt-0.5"></i>
        <div class="flex-1">
            <p class="font-semibold">${escapeHTML(mensagem)}</p>
        </div>
        <button type="button" id="botao-fechar-mensagem" class="opacity-80 hover:opacity-100 transition-opacity" aria-label="Fechar mensagem">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    elemento.classList.remove('hidden');

    const botaoFechar = document.getElementById('botao-fechar-mensagem');

    if (botaoFechar) {
        botaoFechar.addEventListener('click', esconderMensagem);
    }

    atualizarIcones();

    // Por fim eu configuro para a mensagem desaparecer automaticamente após 5 segundos.
    temporizadorMensagem = window.setTimeout(esconderMensagem, 5000);
}

// Aqui eu manipulo o estado visual dos botões de ação para evitar duplos cliques.
function definirBotaoCarregando(botao, carregando, textoNormal, textoCarregando) {
    if (!botao) {
        return;
    }

    if (carregando) {
        botao.disabled = true;
        botao.classList.add('opacity-70', 'cursor-not-allowed');
        botao.innerHTML = `
            <i data-lucide="loader-circle" class="w-5 h-5 animate-spin"></i>
            <span>${escapeHTML(textoCarregando)}</span>
        `;
        atualizarIcones();
        return;
    }

    botao.disabled = false;
    botao.classList.remove('opacity-70', 'cursor-not-allowed');
    botao.innerHTML = `
        <i data-lucide="save" class="w-5 h-5"></i>
        <span>${escapeHTML(textoNormal)}</span>
    `;
    atualizarIcones();
}

// Esta função trava a barra de rolagem do fundo quando um modal é aberto.
function atualizarBloqueioRolagem() {
    const modalCadastro = document.getElementById('modal-cadastrar');
    const modalEditar = document.getElementById('modal-editar');

    let existeModalAberto = false;

    if (modalCadastro) {
        if (!modalCadastro.classList.contains('hidden')) {
            existeModalAberto = true;
        }
    }

    if (modalEditar) {
        if (!modalEditar.classList.contains('hidden')) {
            existeModalAberto = true;
        }
    }

    if (existeModalAberto) {
        document.body.classList.add('overflow-hidden');
        return;
    }

    document.body.classList.remove('overflow-hidden');
}

// Agora eu exibo a interface de cadastro zerando o formulário.
function abrirModalCadastro() {
    const modal = document.getElementById('modal-cadastrar');
    const formulario = document.getElementById('form-cadastrar-paciente');

    if (!modal) {
        return;
    }

    if (!formulario) {
        return;
    }

    formulario.reset();
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    atualizarBloqueioRolagem();
    atualizarIcones();

    const campoMatricula = document.getElementById('cadastro-matricula');

    if (campoMatricula) {
        window.setTimeout(function () {
            campoMatricula.focus();
        }, 100);
    }
}

// Em seguida crio a lógica de fechamento da interface de cadastro.
function fecharModalCadastro() {
    const modal = document.getElementById('modal-cadastrar');

    if (!modal) {
        return;
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    atualizarBloqueioRolagem();
}

window.abrirModalCadastro = abrirModalCadastro;
window.fecharModalCadastro = fecharModalCadastro;

// Neste momento eu preparo o modal de edição preenchendo todos os campos com os dados do banco.
function abrirModalEditar(funcionario) {
    if (!funcionario) {
        mostrarMensagem('Não foi possível identificar o funcionário.', 'erro');
        return;
    }

    if (typeof funcionario !== 'object') {
        mostrarMensagem('Não foi possível identificar o funcionário.', 'erro');
        return;
    }

    const matricula = obterValorFormulario(funcionario.matricula).trim();

    if (matricula.length === 0) {
        mostrarMensagem('O funcionário não possui uma matrícula válida.', 'erro');
        return;
    }

    const modal = document.getElementById('modal-editar');

    if (!modal) {
        return;
    }

    document.getElementById('edit-matricula').value = matricula;
    document.getElementById('edit-matricula-exibicao').value = matricula;
    document.getElementById('edit-nome').value = obterValorFormulario(funcionario.nome);
    document.getElementById('edit-cpf').value = formatarCpf(funcionario.cpf);
    document.getElementById('edit-cargo').value = obterValorFormulario(funcionario.cargo);
    document.getElementById('edit-setor').value = obterValorFormulario(funcionario.setor);
    document.getElementById('edit-nucleo').value = obterValorFormulario(funcionario.nucleo);
    document.getElementById('edit-supervisor').value = obterValorFormulario(funcionario.supervisor);
    document.getElementById('edit-coordenador').value = obterValorFormulario(funcionario.coordenador);
    document.getElementById('edit-gerente').value = obterValorFormulario(funcionario.gerente);

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    atualizarBloqueioRolagem();
    atualizarIcones();

    const campoNome = document.getElementById('edit-nome');

    if (campoNome) {
        window.setTimeout(function () {
            campoNome.focus();
        }, 100);
    }
}

// Crio a função respectiva para fechar e limpar a janela de edição.
function fecharModalEditar() {
    const modal = document.getElementById('modal-editar');

    if (!modal) {
        return;
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    atualizarBloqueioRolagem();
}

window.fecharModalEditar = fecharModalEditar;

// Agora eu indico visualmente na tabela que a busca aos dados está em andamento.
function mostrarTabelaCarregando() {
    const tabela = document.getElementById('tabela-pacientes');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="7" class="py-14 px-6 text-center text-slate-400">
                <i data-lucide="loader-circle" class="w-10 h-10 mx-auto mb-3 animate-spin opacity-60"></i>
                <p>Carregando funcionários...</p>
            </td>
        </tr>
    `;

    atualizarIcones();
}

// Quando o banco não retorna nenhum registro, eu exibo um ícone de fallback amigável.
function mostrarTabelaVazia() {
    const tabela = document.getElementById('tabela-pacientes');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="7" class="py-14 px-6 text-center text-slate-400">
                <i data-lucide="user-search" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p class="font-medium text-slate-500">Nenhum funcionário encontrado.</p>
                <p class="text-sm mt-1">Tente utilizar outro nome, matrícula, CPF ou setor.</p>
            </td>
        </tr>
    `;

    atualizarIcones();
}

// Se ocorrer algum problema com o banco de dados, eu indico o erro para o usuário dentro da tabela.
function mostrarErroTabela(mensagem) {
    const tabela = document.getElementById('tabela-pacientes');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="7" class="py-14 px-6 text-center text-red-500">
                <i data-lucide="circle-alert" class="w-11 h-11 mx-auto mb-3 opacity-70"></i>
                <p class="font-semibold">${escapeHTML(mensagem)}</p>
            </td>
        </tr>
    `;

    atualizarIcones();
}

// Aqui eu mantenho atualizado o indicador de quantos funcionários estão listados na interface.
function atualizarTextoTotal(quantidade) {
    const elemento = document.getElementById('texto-total-funcionarios');

    if (!elemento) {
        return;
    }

    if (quantidade === 0) {
        elemento.textContent = 'Nenhum funcionário encontrado.';
        return;
    }

    if (quantidade === 1) {
        elemento.textContent = '1 funcionário encontrado.';
        return;
    }

    elemento.textContent = quantidade + ' funcionários encontrados.';
}

// Esta função isola a lógica de construção das células HTML da tabela.
function criarCelula(texto, classes) {
    const celula = document.createElement('td');
    celula.className = classes;
    celula.textContent = obterTextoExibicao(texto);
    return celula;
}

// Crio um método dedicado para gerar os botões de ação (editar e excluir) na última coluna.
function criarBotaoAcao(configuracao) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = configuracao.classes;
    botao.title = configuracao.titulo;

    botao.innerHTML = `
        <i data-lucide="${configuracao.icone}" class="w-4 h-4"></i>
        <span>${escapeHTML(configuracao.texto)}</span>
    `;

    botao.addEventListener('click', configuracao.acao);

    return botao;
}

// Neste momento eu elaboro o link de redirecionamento para o prontuário daquele paciente.
function criarLinkProntuario(funcionario) {
    const matricula = obterValorFormulario(funcionario.matricula).trim();

    const link = document.createElement('a');
    link.href = '/ficha-paciente?matricula=' + encodeURIComponent(matricula);
    link.className = 'inline-flex items-center justify-center gap-1.5 bg-azulEscuro hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm';
    link.title = 'Abrir ficha ambulatorial';

    link.innerHTML = `
        <i data-lucide="clipboard-plus" class="w-4 h-4"></i>
        <span>Ficha</span>
    `;

    return link;
}

// Aqui eu concateno todas as informações num formato visual coerente para cada registro inserido na tabela.
function criarLinhaFuncionario(funcionario) {
    const linha = document.createElement('tr');
    linha.className = 'hover:bg-slate-50 transition-colors';

    linha.appendChild(criarCelula(funcionario.matricula, 'py-4 px-6 text-sm text-slate-800 font-bold'));
    linha.appendChild(criarCelula(funcionario.nome, 'py-4 px-6 text-sm text-slate-800 font-medium'));
    linha.appendChild(criarCelula(formatarCpf(funcionario.cpf), 'py-4 px-6 text-sm text-slate-600'));
    linha.appendChild(criarCelula(funcionario.cargo, 'py-4 px-6 text-sm text-slate-600'));
    linha.appendChild(criarCelula(funcionario.setor, 'py-4 px-6 text-sm text-slate-600'));
    linha.appendChild(criarCelula(funcionario.nucleo, 'py-4 px-6 text-sm text-slate-600'));

    const celulaAcoes = document.createElement('td');
    celulaAcoes.className = 'py-4 px-6';

    const containerAcoes = document.createElement('div');
    containerAcoes.className = 'flex items-center justify-center gap-2';

    const linkProntuario = criarLinkProntuario(funcionario);

    const botaoEditar = criarBotaoAcao({
        texto: 'Editar',
        titulo: 'Editar funcionário',
        icone: 'pencil',
        classes: 'inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
        acao: function () {
            abrirModalEditar(funcionario);
        }
    });

    const botaoExcluir = criarBotaoAcao({
        texto: 'Excluir',
        titulo: 'Excluir funcionário',
        icone: 'trash-2',
        classes: 'inline-flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
        acao: function () {
            deletarFuncionario(funcionario);
        }
    });

    containerAcoes.appendChild(linkProntuario);
    containerAcoes.appendChild(botaoEditar);
    containerAcoes.appendChild(botaoExcluir);

    celulaAcoes.appendChild(containerAcoes);
    linha.appendChild(celulaAcoes);

    return linha;
}

// Antes de renderizar um usuário, eu verifico rigorosamente se ele possui o identificador base no objeto.
function funcionarioPossuiMatricula(funcionario) {
    if (!funcionario) {
        return false;
    }

    if (typeof funcionario !== 'object') {
        return false;
    }

    if (funcionario.matricula === null) {
        return false;
    }

    if (funcionario.matricula === undefined) {
        return false;
    }

    const matricula = String(funcionario.matricula).trim();

    if (matricula.length === 0) {
        return false;
    }

    return true;
}

// Agora eu passo a lista da API para a tabela manipulando a renderização na página.
function renderizarFuncionarios(funcionarios) {
    const tabela = document.getElementById('tabela-pacientes');

    if (!tabela) {
        return;
    }

    tabela.innerHTML = '';

    if (!Array.isArray(funcionarios)) {
        atualizarTextoTotal(0);
        mostrarTabelaVazia();
        return;
    }

    const funcionariosValidos = funcionarios.filter(function (funcionario) {
        return funcionarioPossuiMatricula(funcionario);
    });

    atualizarTextoTotal(funcionariosValidos.length);

    if (funcionariosValidos.length === 0) {
        mostrarTabelaVazia();
        return;
    }

    funcionariosValidos.forEach(function (funcionario) {
        tabela.appendChild(criarLinhaFuncionario(funcionario));
    });

    atualizarIcones();
}

// Neste bloco eu realizo a requisição HTTP e obtenho os cadastros armazenados no banco do servidor.
async function buscarFuncionarios(termo) {
    mostrarTabelaCarregando();

    let url = FUNCIONARIOS_BASE_URL;

    if (typeof termo === 'string') {
        const termoNormalizado = termo.trim();

        if (termoNormalizado.length > 0) {
            url += '?busca=' + encodeURIComponent(termoNormalizado);
        }
    }

    try {
        const resposta = await window.AuthSession.fetchAutenticado(url, {
            method: 'GET',
            cache: 'no-store'
        });

        if (await respostaExigeNovoLogin(resposta)) {
            return;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível carregar os funcionários.');
            throw new Error(mensagem);
        }

        renderizarFuncionarios(dados);

    } catch (erro) {
        console.error('Erro ao buscar funcionários:', erro);
        atualizarTextoTotal(0);
        mostrarErroTabela(erro.message);
    }
}

// Concentro aqui a captura dos campos do formulário para preparar o corpo da requisição POST.
function obterDadosCadastro() {
    return {
        matricula: document.getElementById('cadastro-matricula').value.trim(),
        nome: document.getElementById('cadastro-nome').value.trim(),
        cpf: somenteNumeros(document.getElementById('cadastro-cpf').value),
        cargo: document.getElementById('cadastro-cargo').value.trim(),
        setor: document.getElementById('cadastro-setor').value.trim(),
        nucleo: document.getElementById('cadastro-nucleo').value.trim(),
        supervisor: document.getElementById('cadastro-supervisor').value.trim(),
        coordenador: document.getElementById('cadastro-coordenador').value.trim(),
        gerente: document.getElementById('cadastro-gerente').value.trim()
    };
}

// Por segurança, avalio internamente os três campos cruciais antes de enviá-los e tomar tempo do servidor.
function validarDadosFuncionario(dados) {
    if (dados.matricula.length === 0) {
        return 'Informe a matrícula do funcionário.';
    }

    if (dados.matricula.length > 20) {
        return 'A matrícula deve possuir no máximo 20 caracteres.';
    }

    if (dados.nome.length < 2) {
        return 'Informe o nome completo do funcionário.';
    }

    if (dados.nome.length > 150) {
        return 'O nome deve possuir no máximo 150 caracteres.';
    }

    if (dados.cpf.length !== 11) {
        return 'O CPF deve possuir exatamente 11 números.';
    }

    return null;
}

// Agora executo o processo de enviar o JSON do novo paciente e inserir o registro na tabela em tempo real.
async function cadastrarFuncionario(evento) {
    evento.preventDefault();

    const botao = document.getElementById('botao-salvar-cadastro');
    const dadosCadastro = obterDadosCadastro();
    const erroValidacao = validarDadosFuncionario(dadosCadastro);

    if (erroValidacao) {
        mostrarMensagem(erroValidacao, 'aviso');
        return;
    }

    definirBotaoCarregando(botao, true, 'Salvar funcionário', 'Salvando...');

    try {
        const resposta = await window.AuthSession.fetchAutenticado(FUNCIONARIOS_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosCadastro)
        });

        if (await respostaExigeNovoLogin(resposta)) {
            return;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível cadastrar o funcionário.');
            throw new Error(mensagem);
        }

        fecharModalCadastro();
        mostrarMensagem('Funcionário cadastrado com sucesso.', 'sucesso');

        termoBuscaAtual = '';
        const inputBusca = document.getElementById('input-busca');

        if (inputBusca) {
            inputBusca.value = '';
        }

        await buscarFuncionarios('');

    } catch (erro) {
        console.error('Erro ao cadastrar funcionário:', erro);
        mostrarMensagem(erro.message, 'erro');
    } finally {
        definirBotaoCarregando(botao, false, 'Salvar funcionário', 'Salvando...');
    }
}

// Aqui eu realizo o mesmo processo de extração para o formulário específico de edição.
function obterDadosAtualizacao() {
    return {
        nome: document.getElementById('edit-nome').value.trim(),
        cpf: somenteNumeros(document.getElementById('edit-cpf').value),
        cargo: document.getElementById('edit-cargo').value.trim(),
        setor: document.getElementById('edit-setor').value.trim(),
        nucleo: document.getElementById('edit-nucleo').value.trim(),
        supervisor: document.getElementById('edit-supervisor').value.trim(),
        coordenador: document.getElementById('edit-coordenador').value.trim(),
        gerente: document.getElementById('edit-gerente').value.trim()
    };
}

// Eu envio um PATCH ao backend modificando pontualmente os campos fornecidos pelo usuário na interface.
async function atualizarFuncionario(evento) {
    evento.preventDefault();

    const matricula = document.getElementById('edit-matricula').value.trim();
    const botao = document.getElementById('botao-salvar-edicao');
    const dadosAtualizacao = obterDadosAtualizacao();

    if (matricula.length === 0) {
        mostrarMensagem('A matrícula do funcionário não foi encontrada.', 'erro');
        return;
    }

    const dadosParaValidacao = {
        matricula,
        nome: dadosAtualizacao.nome,
        cpf: dadosAtualizacao.cpf
    };

    const erroValidacao = validarDadosFuncionario(dadosParaValidacao);

    if (erroValidacao) {
        mostrarMensagem(erroValidacao, 'aviso');
        return;
    }

    definirBotaoCarregando(botao, true, 'Salvar alterações', 'Salvando...');

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            FUNCIONARIOS_BASE_URL + '/' + encodeURIComponent(matricula),
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosAtualizacao)
            }
        );

        if (await respostaExigeNovoLogin(resposta)) {
            return;
        }

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            const mensagem = obterMensagemErro(dados, 'Não foi possível atualizar o funcionário.');
            throw new Error(mensagem);
        }

        fecharModalEditar();
        mostrarMensagem('Funcionário atualizado com sucesso.', 'sucesso');
        await buscarFuncionarios(termoBuscaAtual);

    } catch (erro) {
        console.error('Erro ao atualizar funcionário:', erro);
        mostrarMensagem(erro.message, 'erro');
    } finally {
        definirBotaoCarregando(botao, false, 'Salvar alterações', 'Salvando...');
    }
}

// Nesta lógica de deleção, primeiramente aplico um alert nativo evitando acidentes irreversíveis na operação de CRUD.
async function deletarFuncionario(funcionario) {
    if (!funcionarioPossuiMatricula(funcionario)) {
        mostrarMensagem('O funcionário não possui uma matrícula válida.', 'erro');
        return;
    }

    const nome = obterTextoExibicao(funcionario.nome);
    const matricula = String(funcionario.matricula).trim();

    const confirmado = window.confirm(
        'Deseja realmente excluir o funcionário "' + nome + '" de matrícula ' + matricula + '?\n\nEsta ação poderá ser desfeita.'
    );

    if (!confirmado) {
        return;
    }

    try {
        const resposta = await window.AuthSession.fetchAutenticado(
            FUNCIONARIOS_BASE_URL + '/' + encodeURIComponent(matricula),
            {
                method: 'DELETE'
            }
        );

        if (await respostaExigeNovoLogin(resposta)) {
            return;
        }

        if (!resposta.ok) {
            const dados = await lerRespostaJson(resposta);
            const mensagem = obterMensagemErro(dados, 'Não foi possível excluir o funcionário.');
            throw new Error(mensagem);
        }

        mostrarMensagem('Funcionário excluído com sucesso.', 'sucesso');
        await buscarFuncionarios(termoBuscaAtual);

    } catch (erro) {
        console.error('Erro ao excluir funcionário:', erro);
        mostrarMensagem(erro.message, 'erro');
    }
}

// Aqui eu amarro os ouvintes do Javascript em cada input form, botão e tecla gerando interatividade total do sistema com a API.
function configurarEventos() {
    const formularioBusca = document.getElementById('form-busca');
    const botaoLimpar = document.getElementById('botao-limpar-busca');
    const botaoAtualizar = document.getElementById('botao-atualizar-lista');
    const formularioCadastro = document.getElementById('form-cadastrar-paciente');
    const formularioEdicao = document.getElementById('form-editar-paciente');
    const campoCpfCadastro = document.getElementById('cadastro-cpf');
    const campoCpfEdicao = document.getElementById('edit-cpf');
    const modalCadastro = document.getElementById('modal-cadastrar');
    const modalEditar = document.getElementById('modal-editar');

    if (formularioBusca) {
        formularioBusca.addEventListener('submit', function (evento) {
            evento.preventDefault();
            const campoBusca = document.getElementById('input-busca');
            termoBuscaAtual = '';

            if (campoBusca) {
                termoBuscaAtual = campoBusca.value.trim();
            }

            buscarFuncionarios(termoBuscaAtual);
        });
    }

    if (botaoLimpar) {
        botaoLimpar.addEventListener('click', function () {
            const campoBusca = document.getElementById('input-busca');
            termoBuscaAtual = '';

            if (campoBusca) {
                campoBusca.value = '';
                campoBusca.focus();
            }

            buscarFuncionarios('');
        });
    }

    if (botaoAtualizar) {
        botaoAtualizar.addEventListener('click', function () {
            buscarFuncionarios(termoBuscaAtual);
        });
    }

    if (formularioCadastro) {
        formularioCadastro.addEventListener('submit', cadastrarFuncionario);
    }

    if (formularioEdicao) {
        formularioEdicao.addEventListener('submit', atualizarFuncionario);
    }

    if (campoCpfCadastro) {
        campoCpfCadastro.addEventListener('input', aplicarMascaraCpf);
    }

    if (campoCpfEdicao) {
        campoCpfEdicao.addEventListener('input', aplicarMascaraCpf);
    }

    if (modalCadastro) {
        modalCadastro.addEventListener('click', function (evento) {
            if (evento.target === modalCadastro) {
                fecharModalCadastro();
            }
        });
    }

    if (modalEditar) {
        modalEditar.addEventListener('click', function (evento) {
            if (evento.target === modalEditar) {
                fecharModalEditar();
            }
        });
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharModalCadastro();
            fecharModalEditar();
        }
    });
}

// Por fim, executo a checagem de integridade e inicio a popular a DOM listando todos os funcionários salvos na aplicação.
async function inicializarPaginaFuncionarios() {
    if (!authSessionEstaDisponivel()) {
        console.error('O arquivo auth-session.js não foi carregado.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    mostrarTabelaCarregando();
    atualizarIcones();

    const resultadoSessao = await window.AuthSession.exigirSessao();

    if (!resultadoSessao.autenticado) {
        if (resultadoSessao.status === 0) {
            atualizarTextoTotal(0);
            mostrarErroTabela(resultadoSessao.mensagem);
        }
        return;
    }

    configurarEventos();
    await buscarFuncionarios('');
}

document.addEventListener('DOMContentLoaded', inicializarPaginaFuncionarios);