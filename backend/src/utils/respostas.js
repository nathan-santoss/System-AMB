function erroPossuiNome(
    erro,
    nome
) {
    if (!erro) {
        return false;
    }

    if (typeof erro !== 'object') {
        return false;
    }

    if (erro.name !== nome) {
        return false;
    }

    return true;
}

function extrairDetalhesValidacao(
    erro
) {
    const detalhes = [];

    if (!Array.isArray(erro.errors)) {
        return detalhes;
    }

    for (const item of erro.errors) {
        if (!item) {
            continue;
        }

        if (typeof item.message !== 'string') {
            continue;
        }

        const mensagem =
            item.message.trim();

        if (mensagem.length === 0) {
            continue;
        }

        detalhes.push(
            mensagem
        );
    }

    return detalhes;
}

export function responderErroInterno(
    res,
    mensagem,
    erro
) {
    console.error(
        mensagem,
        erro
    );

    if (
        erroPossuiNome(
            erro,
            'SequelizeValidationError'
        )
    ) {
        const detalhes =
            extrairDetalhesValidacao(
                erro
            );

        const resposta = {
            erro: 'Os dados enviados são inválidos.'
        };

        if (detalhes.length > 0) {
            resposta.detalhes =
                detalhes;
        }

        return res.status(400).json(
            resposta
        );
    }

    if (
        erroPossuiNome(
            erro,
            'SequelizeUniqueConstraintError'
        )
    ) {
        return res.status(409).json({
            erro: 'Já existe um registro com os dados informados.'
        });
    }

    if (
        erroPossuiNome(
            erro,
            'SequelizeForeignKeyConstraintError'
        )
    ) {
        return res.status(409).json({
            erro: 'Não foi possível concluir a operação devido a registros vinculados.'
        });
    }

    if (
        erroPossuiNome(
            erro,
            'SequelizeDatabaseError'
        )
    ) {
        return res.status(500).json({
            erro: 'Erro ao acessar o banco de dados.'
        });
    }

    return res.status(500).json({
        erro: 'Ocorreu um erro interno no servidor.'
    });
}