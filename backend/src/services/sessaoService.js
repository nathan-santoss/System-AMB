import { randomUUID } from 'node:crypto';
import { Op, fn, col } from 'sequelize';
import Sessao from '../models/sessoes.js';

export const INATIVIDADE_MS = 30 * 60 * 1000;
export const DURACAO_MAXIMA_MS = 12 * 60 * 60 * 1000;

export async function criarSessao(usuarioId) {
    const agora = new Date();
    return Sessao.create({
        id: randomUUID(),
        usuario_id: usuarioId,
        ultima_atividade: agora,
        expira_em: new Date(agora.getTime() + DURACAO_MAXIMA_MS)
    });
}

export function sessaoEstaValida(sessao, agora = Date.now()) {
    if (!sessao || sessao.revogada) return false;
    if (new Date(sessao.expira_em).getTime() <= agora) return false;
    return new Date(sessao.ultima_atividade).getTime() + INATIVIDADE_MS > agora;
}

export function apresentarSessao(sessao) {
    const limite = Math.min(
        new Date(sessao.expira_em).getTime(),
        new Date(sessao.ultima_atividade).getTime() + INATIVIDADE_MS
    );
    return { id: sessao.id, expiraEm: limite, servidorAgora: Date.now() };
}

export async function registrarAtividade(id, inativoHa = 0) {
    const agora = new Date();
    const ultimaInteracao = new Date(agora.getTime() - inativoHa);
    // A condição impede que uma solicitação atrasada reative uma sessão vencida.
    const [quantidade, sessoes] = await Sessao.update(
        { ultima_atividade: fn('GREATEST', col('ultima_atividade'), ultimaInteracao) },
        {
            where: {
                id,
                revogada: false,
                expira_em: { [Op.gt]: agora },
                ultima_atividade: { [Op.gt]: new Date(agora.getTime() - INATIVIDADE_MS) }
            },
            returning: true
        }
    );
    if (!quantidade) return null;
    return sessoes[0];
}

export async function revogarSessao(id) {
    if (typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) {
        await Sessao.update({ revogada: true }, { where: { id } });
    }
}
