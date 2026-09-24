export const CUSTO_BCRYPT = 12;

export function normalizarEmail(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
}

export function emailEhValido(email) {
    return (
        typeof email === 'string' &&
        email.length >= 3 &&
        email.length <= 150 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

export function senhaLoginEhValida(senha) {
    return typeof senha === 'string' && senha.length > 0 && Buffer.byteLength(senha, 'utf8') <= 72;
}

export function senhaEhValida(senha) {
    return senhaLoginEhValida(senha) && senha.length >= 12;
}

export function apresentarUsuario(usuario) {
    return {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo
    };
}
