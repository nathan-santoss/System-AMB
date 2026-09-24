import bcrypt from 'bcryptjs';
import database from '../config/database.js';
import Usuario from '../models/usuarios.js';
import Sessao from '../models/sessoes.js';
import { corpoEhObjetoValido, identificadorEhValido } from '../utils/validadores.js';
import {
    CUSTO_BCRYPT,
    normalizarEmail,
    emailEhValido,
    senhaEhValida,
    apresentarUsuario
} from '../utils/credenciais.js';
import { responderErroInterno } from '../utils/respostas.js';

function validarCadastro(corpo, novo = false) {
    if (!corpoEhObjetoValido(corpo)) return 'Envie um objeto com os dados do usuário.';
    if (Object.keys(corpo).some((campo) => !['email', 'senha', 'ativo'].includes(campo))) {
        return 'Campo não permitido. Novos logins possuem acesso comum.';
    }
    if (novo || corpo.email !== undefined) {
        if (!emailEhValido(normalizarEmail(corpo.email))) return 'Informe um e-mail válido.';
    }
    if (novo || corpo.senha !== undefined) {
        if (!senhaEhValida(corpo.senha))
            return 'A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes em UTF-8.';
    }
    if (corpo.ativo !== undefined && typeof corpo.ativo !== 'boolean')
        return 'Informe uma situação válida.';
    if (!Object.keys(corpo).length) return 'Informe ao menos um campo para atualizar.';
    return '';
}

export async function listarUsuarios(req, res) {
    const pagina = Number(req.query.pagina || 1);
    if (!Number.isSafeInteger(pagina) || pagina < 1 || pagina > 1000000) {
        return res.status(400).json({ erro: 'Página inválida.' });
    }
    try {
        const { rows, count } = await Usuario.findAndCountAll({
            attributes: ['id_usuario', 'email', 'perfil', 'ativo'],
            order: [['id_usuario', 'ASC']],
            limit: 20,
            offset: (pagina - 1) * 20
        });
        return res.json({
            usuarios: rows.map(apresentarUsuario),
            total: count,
            pagina,
            paginas: Math.max(1, Math.ceil(count / 20))
        });
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao listar usuários.', erro);
    }
}

export async function criarUsuario(req, res) {
    const erroValidacao = validarCadastro(req.body, true);
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });
    try {
        const usuario = await Usuario.create({
            email: normalizarEmail(req.body.email),
            senha: await bcrypt.hash(req.body.senha, CUSTO_BCRYPT),
            perfil: 'usuario',
            ativo: true
        });
        return res.status(201).json({ usuario: apresentarUsuario(usuario) });
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao criar usuário.', erro);
    }
}

export async function atualizarUsuario(req, res) {
    if (!identificadorEhValido(req.params.id))
        return res.status(400).json({ erro: 'Usuário inválido.' });
    const erroValidacao = validarCadastro(req.body);
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });
    try {
        const resultado = await database.transaction(async (transaction) => {
            const usuario = await Usuario.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!usuario) return { status: 404, erro: 'Usuário não encontrado.' };
            // Esta tela gerencia os logins comuns e preserva o acesso administrativo.
            if (usuario.perfil === 'admin' || usuario.id_usuario === req.usuario.id_usuario) {
                return {
                    status: 403,
                    erro: 'A conta administrativa não pode ser alterada nesta tela.'
                };
            }
            const alteracoes = {};
            if (req.body.email !== undefined) alteracoes.email = normalizarEmail(req.body.email);
            if (req.body.ativo !== undefined) alteracoes.ativo = req.body.ativo;
            if (req.body.senha !== undefined)
                alteracoes.senha = await bcrypt.hash(req.body.senha, CUSTO_BCRYPT);
            await usuario.update(alteracoes, { transaction });
            if (alteracoes.senha || alteracoes.ativo === false || alteracoes.email) {
                await Sessao.update(
                    { revogada: true },
                    { where: { usuario_id: usuario.id_usuario }, transaction }
                );
            }
            return { usuario: apresentarUsuario(usuario) };
        });
        if (resultado.erro) return res.status(resultado.status).json({ erro: resultado.erro });
        return res.json(resultado);
    } catch (erro) {
        return responderErroInterno(res, 'Erro ao atualizar usuário.', erro);
    }
}
