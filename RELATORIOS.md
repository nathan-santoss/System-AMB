# Relatórios do ambulatório

Na ficha de um funcionário, a seção **Relatórios do funcionário** oferece:

- **Gerar POP**: abre um modelo de Procedimento Operacional Padrão com identificação, vínculos atuais, alertas e histórico completo. Código, revisão, objetivo, responsabilidades, procedimento e referências podem ser preenchidos antes da impressão. Essas edições são temporárias: não ficam salvas no banco.
- **Exportar Excel**: baixa um arquivo `.xlsx` com as abas Funcionário, Atendimentos e Alergias atuais. Datas e temperaturas mantêm os tipos adequados para filtros e cálculos. Matrículas são texto, preservando zeros iniciais.
- **Imprimir ficha / PDF**, em cada atendimento: abre exclusivamente o registro selecionado. Use **Imprimir / Salvar em PDF** e selecione **Salvar em PDF** na janela de impressão do navegador.

Os horários dos relatórios são apresentados no fuso de Brasília. Dados cadastrais e alergias representam o cadastro atual na emissão; os vínculos de liderança de cada atendimento são os registrados na época. Ausência de informação não é substituída por um vínculo atual.

## Lideranças opcionais

No cadastro e na edição, marque **Informar supervisor**, **Informar coordenador** e/ou **Informar gerente** conforme necessário. Qualquer combinação é permitida, inclusive nenhum responsável. Ao marcar um vínculo, preencha seu nome. Ao desmarcá-lo e salvar, o vínculo atual passa a ser nulo; os atendimentos anteriores permanecem intactos.

## Execução

Instale as dependências em `backend` com `npm ci` e inicie com `npm start`, utilizando as configurações de banco e autenticação existentes. A exportação utiliza ExcelJS. Não há novas tabelas ou colunas.

Todas as novas rotas exigem a sessão autenticada existente e retornam conteúdo sem cache:

- `GET /api/funcionarios/:matricula/relatorio-pop`
- `GET /api/funcionarios/:matricula/relatorio-excel`
- `GET /api/funcionarios/:matricula/atendimentos/:id/ficha`

Execute `npm run check` em `backend` para verificar a sintaxe. A implementação também foi validada com 11 testes temporários usando dados fictícios em memória, incluindo autenticação, combinações de liderança, histórico, isolamento da ficha por funcionário, escape de HTML e leitura do XLSX exportado. Os arquivos de teste e demonstração foram removidos após a verificação, conforme solicitado.
