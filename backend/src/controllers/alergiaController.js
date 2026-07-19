// Atualizar uma alergia
export async function atualizarAlergia(req, res) {
    try {
        const { id } = req.params;
        const [atualizado] = await Alergia.update(req.body, { where: { id_alergia: id } });

        if (!atualizado) {
            return res.status(404).json({ erro: 'Alergia não encontrada' });
        }

        const alergiaAtualizada = await Alergia.findByPk(id);
        res.status(200).json(alergiaAtualizada);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}

// Deletar uma alergia
export async function deletarAlergia(req, res) {
    try {
        const { id } = req.params;
        const deletado = await Alergia.destroy({ where: { id_alergia: id } });

        if (!deletado) {
            return res.status(404).json({ erro: 'Alergia não encontrada' });
        }

        res.status(204).send();
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
}