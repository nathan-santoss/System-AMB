export function obterJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (secret && secret.length >= 32) return secret;
    return null;
}
