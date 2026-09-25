# System AMB

Sistema web de gerenciamento ambulatorial para organizar cadastros de funcionários, registrar atendimentos e acompanhar a operação por meio de relatórios.

A aplicação reúne identificação, triagem, conduta, prontuário e gestão de usuários em uma interface em português, com exportação de planilhas e documentos para impressão.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Dashboard | Indicadores e visão geral dos atendimentos. |
| Funcionários | Pesquisa por CPF, matrícula ou nome; filtros por equipe, setor, núcleo e situação; inativação e reativação. |
| Atendimento | Fluxo de identificação, triagem, conduta e revisão, com registro de saída e proteção contra envio duplicado. |
| Prontuário | Histórico individual paginado, alergias e impressão da ficha de atendimento. |
| Relatórios | Movimento geral, ranking por liderança, histórico individual, pendências e encaminhamentos. |
| Exportação | Planilhas Excel, impressão e opção de salvar em PDF pelo navegador; modelo POP individual com edição temporária. |
| Usuários | Cadastro, edição, inativação e reativação de contas comuns por administradores. |

Supervisor, coordenador e gerente são campos opcionais e independentes. A inativação de funcionários preserva o histórico e impede novos atendimentos até a reativação.

## Tecnologias

- **Servidor:** Node.js, Express e JavaScript com módulos ES.
- **Interface:** EJS, JavaScript, CSS e Tailwind CSS compilado localmente.
- **Persistência:** PostgreSQL e Sequelize.
- **Autenticação:** JWT, senhas com bcrypt e sessões persistidas no banco.
- **Planilhas:** ExcelJS.
- **Verificação:** executor de testes nativo do Node.js e compilação dos templates EJS.

## Executar localmente

O projeto declara Node.js **20 ou superior** em `backend/package.json`. São necessários npm e uma instância PostgreSQL disponível, com banco e credenciais previamente configurados.

### 1. Obter o projeto e instalar as dependências

```sh
git clone https://github.com/nathan-santoss/System-AMB.git
cd System-AMB/backend
npm ci
```

### 2. Configurar o ambiente

Copie `backend/.env.example` para `backend/.env`. No PowerShell, dentro de `backend`:

```powershell
Copy-Item .env.example .env
```

Edite o arquivo com os valores do seu ambiente:

| Variável | Finalidade |
| --- | --- |
| `NODE_ENV` | Ambiente de execução; use `development` localmente e `production` na implantação. |
| `PORT` | Porta HTTP; padrão `3000`. |
| `DATABASE_URL` | URL completa de conexão com PostgreSQL. |
| `DATABASE_SSL` | Use `false` para PostgreSQL local sem TLS. Nos bancos remotos, use `true` com certificado válido. |
| `JWT_SECRET` | Chave aleatória com pelo menos 32 caracteres. |
| `TRUST_PROXY` | IPs ou sub-redes dos proxies confiáveis, separados por vírgula; deixe vazio sem proxy. |
| `BOOTSTRAP_ADMIN_EMAIL` | E-mail do administrador inicial. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha inicial, com pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. |

Substitua as credenciais de exemplo. Para gerar uma chave aleatória:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Em uma instalação nova, informe as duas variáveis `BOOTSTRAP_ADMIN_*` para criar o primeiro administrador. A criação automática preserva a senha quando a conta já existe. Após a configuração inicial, ambas podem ser removidas do ambiente para desativar essa rotina.

O arquivo `.env` é ignorado pelo Git. Em produção, disponibilize a aplicação por HTTPS: os cookies de autenticação usam a opção `Secure` nesse ambiente.

### 3. Compilar os estilos e iniciar

```sh
npm run build:css
npm start
```

Acesse [http://localhost:3000](http://localhost:3000) e entre com a conta configurada. O servidor autentica a conexão, sincroniza os modelos e aplica as migrações pendentes antes de aceitar requisições.

O CSS compilado acompanha o repositório. Refaça o build ao alterar classes dos templates ou os estilos compartilhados.

## Banco de dados e atualizações

A persistência utiliza Sequelize, incluindo consultas, transações e alterações de estrutura por QueryInterface. A sincronização não utiliza `force` nem `alter`.

As migrações fazem parte da inicialização e têm sua conclusão registrada em `tb_migracoes`:

| Versão | Alterações |
| --- | --- |
| `001-operacao` | Situação ativa de funcionários, chave de registro e autoria de atendimentos, além de índices de consulta. |
| `002-administracao-usuarios` | Perfil e situação ativa dos usuários, com identificação do administrador existente. |

Uma migração concluída é ignorada nas inicializações seguintes. Os arquivos de migração e o modelo de controle devem permanecer no projeto para permitir instalações novas e atualizações de bases antigas.

Para verificar uma instalação existente, consulte `tb_migracoes` com uma ferramenta de administração do banco e confirme as duas versões com `concluida = true`. A existência desses arquivos no repositório não confirma o estado de um banco específico.

Na atualização de uma base sem administrador, a migração de usuários usa `BOOTSTRAP_ADMIN_EMAIL` para identificar a conta administrativa. Sem essa variável, uma única conta existente é promovida; com várias contas, é necessário informar o e-mail correto. Se utilizar o bootstrap, configure também `BOOTSTRAP_ADMIN_PASSWORD`, pois a inicialização exige o par de variáveis, mesmo quando preserva a senha existente.

## Uso e interpretação dos relatórios

A central de relatórios permite filtrar por período, liderança, vínculo histórico ou atual, matrícula, setor, núcleo, situação e gravidade.

- O ranking contabiliza idas ao ambulatório, pessoas distintas e participação nas idas do período. Cada nível de liderança é analisado separadamente; empates mantêm a posição e registros sem liderança aparecem sem classificação.
- O vínculo histórico usa a liderança registrada no atendimento. Alterações cadastrais não reescrevem esse histórico; setor e núcleo correspondem ao cadastro atual.
- As datas são apresentadas no fuso de Brasília e os filtros diários usam UTC−03:00. O intervalo máximo é de 366 dias; exportações de listas nominais aceitam até 10.000 registros.
- As pendências refletem a situação na emissão, incluindo atendimentos antigos ainda abertos até a data final. A permanência média considera somente atendimentos encerrados com horários válidos.
- Pessoas distintas podem aparecer em mais de um grupo quando há transferência no período. O ranking não representa a proporção de toda a equipe atendida, pois o sistema não dispõe desse denominador.
- Para gerar PDF, use **Imprimir / Salvar em PDF** e selecione **Salvar em PDF** no navegador.
- Os campos editáveis do modelo POP individual são temporários e não são salvos. A rotina POP apresentada é uma orientação administrativa para adaptação pelo responsável.

## Acesso e sessões

A página **Usuários** é restrita a administradores e gerencia contas comuns. A conta administrativa não é editável por essa tela.

Alterações de e-mail ou senha e a desativação de uma conta revogam suas sessões. As sessões expiram após 30 minutos de inatividade ou 12 horas de duração total. Sair também revoga a sessão no servidor.

## Estrutura do projeto

```text
System-AMB/
├── backend/
│   ├── app.js                 # Configuração do Express, páginas e APIs
│   ├── server.js              # Inicialização do banco e do servidor
│   ├── .env.example           # Modelo de configuração
│   ├── scripts/               # Verificações de sintaxe e templates
│   ├── src/
│   │   ├── config/            # Banco, autenticação, bootstrap e migrações
│   │   ├── controllers/       # Tratamento das requisições
│   │   ├── middlewares/       # Autenticação e autorização
│   │   ├── models/            # Modelos Sequelize
│   │   ├── routes/            # Rotas das APIs
│   │   ├── services/          # Regras de negócio e relatórios
│   │   └── utils/             # Validação, normalização e formatação
│   └── tests/                 # Testes de usuários e migração
├── frontend/
│   ├── public/                # JavaScript e CSS servidos ao navegador
│   ├── styles/base.css        # Entrada da compilação Tailwind
│   └── views/                 # Templates EJS e componentes compartilhados
└── README.md
```

## Comandos de desenvolvimento

Execute os comandos dentro de `backend`:

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia a aplicação e a rotina de preparação do banco. |
| `npm run check` | Verifica a sintaxe JavaScript do backend e frontend e compila os templates EJS. |
| `npm test` | Executa os testes automatizados. |
| `npm run build:css` | Gera o CSS minificado do Tailwind. |
| `npm run format` | Formata os arquivos JavaScript e CSS abrangidos pelo script. |

Os testes atuais cobrem gestão de usuários, autorização e migração de usuários com substitutos de banco; não acessam o banco real. Eles não substituem a validação de uma implantação com PostgreSQL.

## Manutenção

Problemas e sugestões podem ser registrados nas [issues do projeto](https://github.com/nathan-santoss/System-AMB/issues). Descreva o comportamento observado, o resultado esperado e os passos para reprodução, sem incluir credenciais ou dados pessoais de funcionários.

Autor informado no pacote: **nathan-santos**.
