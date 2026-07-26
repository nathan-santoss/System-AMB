// Eu recebo um erro e, dependendo do tipo, monto uma resposta padronizada e amigável.
export function responderErroInterno(
    res,
    mensagem,
    erro
) {

    // Eu registro o erro no console para que os desenvolvedores possam investigar.
    console.error(
        mensagem,
        erro
    );

    // Se for um erro de validação do Sequelize (dados inválidos no modelo).
    if (
        erro.name ===
        'SequelizeValidationError'
    ) {

        // Eu extraio as mensagens de erro específicas de cada campo.
        const detalhes =
            erro.errors.map(
                item => {

                    return item.message;

                }
            );

        // E retorno um erro 400 (Bad Request) com os detalhes.
        return res.status(400).json({

            erro:
                'Os dados enviados são inválidos.',

            detalhes

        });

    }


    // Se for um erro de violação de chave única (tentando cadastrar algo que já existe).
    if (
        erro.name ===
        'SequelizeUniqueConstraintError'
    ) {

        // Eu retorno um erro 409 (Conflict) com uma mensagem genérica.
        return res.status(409).json({

            erro:
                'Já existe um registro com os dados informados.'

        });

    }


    // Se for um erro de chave estrangeira (tentando usar um ID que não existe em outra tabela).
    if (
        erro.name ===
        'SequelizeForeignKeyConstraintError'
    ) {

        // Eu retorno um erro 409 (Conflict) informando sobre a dependência.
        return res.status(409).json({

            erro:
                'Não foi possível concluir a operação devido a registros vinculados.'

        });

    }


    // Se for um erro genérico de banco de dados.
    if (
        erro.name ===
        'SequelizeDatabaseError'
    ) {

        // Eu retorno um erro 500 (Internal Server Error) para não expor detalhes do banco.
        return res.status(500).json({

            erro:
                'Erro ao acessar o banco de dados.'

        });

    }

    // Para todos os outros tipos de erro, eu retorno uma mensagem genérica de erro interno.
    return res.status(500).json({

        erro:
            'Ocorreu um erro interno no servidor.'

    });

}