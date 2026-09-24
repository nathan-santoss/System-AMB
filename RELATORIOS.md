# Relatórios e operação do ambulatório

## Relatórios

A aba **Relatórios** fica no menu lateral. Oferece movimento geral, ranking mensal por supervisor/coordenador/gerente, histórico individual, pendências de encerramento e encaminhamentos. Cada consulta aceita período, liderança, vínculo histórico ou atual, matrícula, setor, núcleo, situação e gravidade. Os resultados podem ser exportados em Excel ou impressos/salvos em PDF pelo navegador.

O ranking conta **idas ao ambulatório**, mostra pessoas distintas e participação nas idas do período. Empates conservam a posição. Registros sem liderança aparecem separados, sem posição. Cada nível de liderança é analisado individualmente: não se somam supervisores, coordenadores e gerentes. Sem o cadastro completo das equipes, não há denominador para calcular percentual de funcionários atendidos por equipe. Esses números orientam a conferência operacional e não permitem concluir sobre a saúde ou o desempenho de uma gestão.

Os vínculos históricos vêm dos campos registrados no atendimento. Trocar a liderança atual não modifica os atendimentos anteriores; ausências históricas não são preenchidas retroativamente. Setor e núcleo sempre correspondem ao cadastro atual. Os nomes de liderança são textuais: utilize as sugestões existentes para evitar grafias diferentes para a mesma pessoa.

Datas são apresentadas em Brasília. Os filtros diários usam UTC−03:00. O período aceita até 366 dias e a exportação até 10.000 registros; reduza o intervalo ou selecione uma equipe quando necessário. Meses em andamento têm resultado parcial. A quantidade de pessoas distintas pode se repetir entre grupos se houver transferência no período. Pendências incluem atendimentos antigos ainda abertos até a data final; a situação é a existente **na emissão**, não uma reconstrução retroativa. A permanência média considera somente registros encerrados com horários válidos.

Relatórios gerais e de ranking exportam indicadores agregados; os relatórios individual, de pendências e de encaminhamentos incluem listas nominais para conferência interna. Queixas clínicas e alergias ficam na ficha individual. A rotina orientativa POP na tela propõe: conferir pendências diariamente; revisar ranking e encaminhamentos no mês; verificar alterações cadastrais; registrar ações de acompanhamento fora do sistema. É uma orientação administrativa para adaptação pelo responsável, não um protocolo clínico aprovado.

Na ficha do funcionário continuam disponíveis o modelo POP editável temporariamente, a planilha do histórico completo e a impressão de cada ficha de atendimento. Use **Imprimir / Salvar em PDF** e escolha **Salvar em PDF**. Os campos editáveis do modelo POP não são persistidos.

## Atendimento e funcionários

**Novo atendimento** conduz pelas etapas de identificação, triagem, conduta e revisão. Pesquise por CPF, matrícula ou nome; selecione a pessoa ou faça o cadastro simplificado. É possível voltar sem perder os campos. O sistema mantém uma chave por envio para impedir duplicação em tentativas repetidas. Encaminhamentos exigem destino. A saída pode ser registrada na conclusão ou depois, na aba **Atendimentos**.

A consulta de funcionários permite filtros por equipe, setor, núcleo e situação, com paginação. Supervisor, coordenador e gerente são opcionais e independentes. A inativação preserva alergias e histórico, impede novas fichas e permite reativação. O prontuário também é paginado, com totais do histórico completo.

## Sessões

Cada login cria uma sessão no banco, associada ao usuário e ao token. Após 30 minutos sem interação, o servidor rejeita novas operações; a tela retira os dados, apresenta um aviso e encaminha ao login. A duração máxima de uma sessão é 12 horas. Interações são agrupadas em intervalos de até 15 segundos; consultas automáticas não renovam o prazo. As abas compartilham o estado da mesma sessão. Sair revoga a sessão no servidor. Tokens anteriores à atualização exigem novo login.

## Código e banco de dados

Toda persistência utiliza **Sequelize**: modelos, consultas, agregações, transações e alterações de estrutura via QueryInterface. Não há SQL manual ou procedimentos armazenados. Contagens, agrupamentos e médias são executados no banco por expressões do ORM, evitando carregar o histórico inteiro para calcular indicadores. Índices ajudam consultas por período, liderança e pendências.

A migração `001-operacao` adiciona `ativo` ao funcionário, `chave_registro` e `registrado_por` ao atendimento, além de índices. As tabelas de sessões e controle de migrações são criadas pelos modelos. A versão da migração é confirmada na mesma transação das alterações; reaplicações não duplicam a estrutura. `sync` não utiliza `force` nem `alter`.

`backend/app.js` compõe as rotas e `backend/server.js` inicia banco e servidor. Serviços concentram regras reutilizáveis. Os códigos usam condições explícitas, sem operadores ternários. A formatação usa quatro espaços, aspas simples e Prettier; comentários explicam as regras que precisam de contexto.

Tailwind é compilado localmente em `frontend/public/styles/tailwind.css`. Componentes comuns ficam em `frontend/styles/base.css`, enquanto cada página mantém seu CSS próprio. A aplicação não depende do CDN de desenvolvimento do Tailwind.

## Execução e validação

Dentro de `backend`:

```sh
npm ci
npm run build:css
npm run check
npm start
```

Mantenha a configuração de banco e autenticação do ambiente. A atualização da estrutura é aplicada na inicialização, antes de abrir o servidor. Para formatar: `npm run format`. O CSS compilado acompanha o repositório; refaça o build ao alterar classes ou estilos compartilhados.

Foram executadas 31 verificações de integração com Sequelize e PostgreSQL temporário em memória (PGlite), além da conferência das telas. Foram cobertos migração sobre estrutura antiga, reexecução, agregações, vínculos históricos, filtros, CPF, idempotência, finalização, inativação, paginação, Excel, renderização e sessões. Esse ambiente não reproduz a concorrência de várias conexões de um PostgreSQL de produção. Arquivos, dependências e dados temporários de teste são removidos ao concluir a validação; a base real não é utilizada nos testes.