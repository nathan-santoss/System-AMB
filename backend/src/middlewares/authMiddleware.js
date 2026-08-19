import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarios.js';

// Aqui eu defino as constantes necessárias para validar a emissão estrutural do token.
const EMISSOR_TOKEN = 'system-amb';
const PUBLICO_TOKEN = 'system-amb-web';

// Nesta função eu isolo a responsabilidade de limpar o cookie de sessão do usuário em caso de falhas.
function limparCookieSessao(res) {
    const ambienteEhProducao = process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
        httpOnly: true,
        secure: ambienteEhProducao,
        sameSite: 'strict',
        path: '/'
    });
}

// Agora eu crio um extrator simples para capturar exclusivamente o nosso token dentro do cabeçalho HTTP.
function extrairTokenDoCookie(cabecalhoCookie) {
    if (typeof cabecalhoCookie !== 'string') {
        return null;
    }

    const cookies = cabecalhoCookie.split(';');

    for (const cookie of cookies) {
        const partes = cookie.split('=');
        const nome = partes[0].trim();

        if (nome === 'token') {
            return partes[1].trim();
        }
    }

    return null;
}

// Em seguida eu padronizo a forma como o sistema nega e encerra o acesso em requisições inválidas.
function bloquearAcesso(res, mensagem) {
    limparCookieSessao(res);

    return res.status(401).json({
        erro: mensagem
    });
}

// Aqui eu implemento o middleware principal que atuará como um "guardião" em todas as rotas protegidas.
export async function verificarToken(req, res, next) {
    // Primeiro eu evito que o navegador faça o cache de informações confidenciais trafegadas por segurança.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    try {
        const jwtSecret = process.env.JWT_SECRET;

        // Antes de prosseguir, eu garanto que o servidor possui a chave criptográfica devidamente configurada.
        if (typeof jwtSecret !== 'string') {
            return res.status(500).json({
                erro: 'O servidor não possui uma chave de segurança configurada.'
            });
        }

        // Agora eu tento extrair o token identificador a partir dos cookies da requisição atual.
        const token = extrairTokenDoCookie(req.headers.cookie);

        if (!token) {
            return bloquearAcesso(res, 'Sessão não autenticada.');
        }

        // Neste ponto eu tento decodificar o token. O próprio JWT lançará um erro imediato se for forjado ou expirado.
        const usuarioDecodificado = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
            issuer: EMISSOR_TOKEN,
            audience: PUBLICO_TOKEN
        });

        const idUsuario = Number(usuarioDecodificado.id_usuario);

        // Por segurança, eu vou ao banco de dados confirmar se o usuário que assina o token não foi removido.
        const usuario = await Usuario.findByPk(idUsuario, {
            attributes: ['id_usuario', 'email']
        });

        if (!usuario) {
            return bloquearAcesso(res, 'O usuário da sessão não existe mais.');
        }

        // Com tudo validado, eu armazeno os dados essenciais na requisição e autorizo o seguimento do fluxo.
        req.usuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email
        };

        return next();

    } catch (erro) {
        // Caso ocorra qualquer problema de validação no JWT, eu capturo a exceção e trato com mensagens amigáveis.
        if (erro.name === 'TokenExpiredError') {
            return bloquearAcesso(res, 'Sessão expirada. Faça login novamente.');
        }

        if (erro.name === 'JsonWebTokenError') {
            return bloquearAcesso(res, 'Sessão inválida. Faça login novamente.');
        }

        if (erro.name === 'NotBeforeError') {
            return bloquearAcesso(res, 'A sessão ainda não é válida.');
        }

        console.error('Erro inesperado na autenticação:', erro);

        // Se o erro for algo interno do servidor e não do token, eu devolvo o status 500 genérico.
        return res.status(500).json({
            erro: 'Erro interno ao validar a autenticação.'
        });
    }
}