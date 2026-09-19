export function obterJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    return secret && secret.length >= 32 ? secret : null;
}
