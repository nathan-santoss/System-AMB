import Atendimento from '../models/atendimento.js';
import Funcionario from '../models/funcionarios.js';
import database from '../config/database.js';

export async function criarAtendimento(dados) {
    return database.transaction(async (transaction) => {
        // Serializa os registros desta pessoa sem executar SQL manualmente.
        const funcionario = await Funcionario.findByPk(dados.funcionario_matricula, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        const existente = await Atendimento.findOne({
            where: { chave_registro: dados.chave_registro },
            transaction
        });
        if (existente) {
            for (const campo of [
                'funcionario_matricula',
                'registrado_por',
                'queixa_principal',
                'pressao_arterial',
                'gravidade',
                'acao_tomada',
                'local_encaminhamento'
            ]) {
                if ((existente[campo] || null) !== (dados[campo] || null)) {
                    const erro = new Error(
                        'Este envio já foi utilizado com outros dados. Atualize a ficha antes de continuar.'
                    );
                    erro.status = 409;
                    throw erro;
                }
            }
            if (
                Number(existente.temperatura) !== Number(dados.temperatura) ||
                new Date(existente.data_hora_entrada).getTime() !==
                    new Date(dados.data_hora_entrada).getTime()
            ) {
                const erro = new Error('Este envio já possui uma ficha com dados diferentes.');
                erro.status = 409;
                throw erro;
            }
            return existente;
        }
        if (!funcionario || !funcionario.ativo) {
            const erro = new Error('Selecione um funcionário ativo para registrar o atendimento.');
            erro.status = 400;
            throw erro;
        }
        return Atendimento.create(
            {
                ...dados,
                supervisor_na_epoca: funcionario.supervisor,
                coordenador_na_epoca: funcionario.coordenador,
                gerente_na_epoca: funcionario.gerente
            },
            { transaction }
        );
    });
}

export async function buscarAtendimentosPorFuncionario(matricula) {
    return Atendimento.findAll({
        where: {
            funcionario_matricula: matricula
        },

        order: [['data_hora_entrada', 'DESC']]
    });
}

export async function finalizarAtendimento(id) {
    const [quantidade, registros] = await Atendimento.update(
        { data_hora_saida: new Date() },
        { where: { id_atendimento: id, data_hora_saida: null }, returning: true }
    );
    if (quantidade > 0) return registros[0];
    // Repetir a solicitação não altera o horário de saída já registrado.
    return Atendimento.findByPk(id);
}
