// cadastrar funcionário
export async function cadastrarFuncionario(req, res) {
    try {
        if (!req.body.nome || !req.body.matricula) {
            return res.status(400).json({ erro: 'Nome e matrícula são obrigatórios.' });
        }
        const novoFuncionario = await Funcionario.create(req.body);
        res.status(201).json(novoFuncionario);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}

// Atualizar um funcionário
export async function atualizarFuncionario(req, res) {
    try {
        const { matricula } = req.params;
        const [atualizado] = await Funcionario.update(req.body, { where: { matricula } });

        if (!atualizado) {
            return res.status(404).json({ erro: 'Funcionário não encontrado' });
        }

        const funcionarioAtualizado = await Funcionario.findOne({ where: { matricula } });
        res.status(200).json(funcionarioAtualizado);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}

// Deletar um funcionário
export async function deletarFuncionario(req, res) {
    try {
        const { matricula } = req.params;
        const deletado = await Funcionario.destroy({ where: { matricula } });

        if (!deletado) {
            return res.status(404).json({ erro: 'Funcionário não encontrado' });
        }

        res.status(204).send();
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}