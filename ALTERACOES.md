# Organização e administração de usuários

- CSS: cada página carrega seu arquivo; estilos do menu ficam em sidebar.css e a base dos documentos imprimíveis em impressao.css. relatorio-pop.css contém a edição específica do POP. global.css reúne a base comum da aplicação; styles/base.css é a fonte dos componentes Tailwind.
- Formatadores e leitura de respostas compartilhados: frontend/public/js/formatadores.js. Validação de credenciais: backend/src/utils/credenciais.js. Não foram introduzidos operadores ternários.
- Removidos o cartão informativo repetido no menu e três arquivos vazios de perfil-funcionario, sem rotas ou referências.
- Relatórios utiliza um SVG local para seu ícone.
- /usuarios permite ao administrador listar, criar, editar e desativar/reativar contas comuns. A API /api/usuarios e a página exigem perfil admin consultado no banco. A conta administrativa não é editável por esta tela.
- Alteração de e-mail, senha ou desativação revoga sessões. A desativação preserva os registros e históricos.

## Atualização de uma instalação existente

Na próxima inicialização, a migração 002-administracao-usuarios acrescenta perfil e ativo sem excluir dados. BOOTSTRAP_ADMIN_EMAIL identifica a conta administrativa existente; sua senha é preservada. Sem essa variável, uma única conta existente é reconhecida como administrador. Com várias contas e sem administrador definido, é necessário informar o e-mail administrativo no ambiente. Não selecione um e-mail de usuário comum.

Em instalações novas, configure BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD conforme backend/.env.example. Os demais usuários são criados pela tela Usuários e não recebem permissão administrativa.

A migração deve ser executada no banco da instalação ao iniciar o servidor. Os testes automatizados usam substitutos de banco; não acessam o banco real.

## Verificação

Execute na pasta backend: npm run check, npm test e npm run build:css.
