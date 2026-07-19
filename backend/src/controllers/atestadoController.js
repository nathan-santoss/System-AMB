// Atualizar um atestado
export async function atualizarAtestado(req, res) {
    try {
        const { id } = req.params;
        const [atualizado] = await Atestado.update(req.body, { where: { id_atestado: id } });

        if (!atualizado) {
            return res.status(404).json({ erro: 'Atestado não encontrado' });
        }

        const atestadoAtualizado = await Atestado.findByPk(id);
        res.status(200).json(atestadoAtualizado);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}

// Deletar um atestado
export async function deletarAtestado(req, res) {
    try {
        const { id } = req.params;
        const deletado = await Atestado.destroy({ where: { id_atestado: id } });

        if (!deletado) {
            return res.status(404).json({ erro: 'Atestado não encontrado' });
        }

        res.status(204).send();
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}