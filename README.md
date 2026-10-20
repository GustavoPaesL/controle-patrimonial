# Acervo — controle patrimonial

Aplicativo local para cadastrar, consultar, buscar, filtrar, editar e dar baixa em bens patrimoniais. Interface em português, sem dependências externas ou serviços de terceiros.

## Executar

É necessário **Node.js 22 ou superior**, com npm. Na pasta do projeto:

```powershell
npm start
```

Abra **http://127.0.0.1:3000** no navegador. Encerre com `Ctrl+C`. Não é necessário executar `npm install`. Para usar outra porta no PowerShell:

```powershell
$env:PORT = '3001'
npm start
```

## Usar

1. Clique em **Cadastrar bem** e preencha identificação, descrição, localização, responsável, valor de aquisição em reais, data e situação.
2. Busque por identificação, descrição, localização ou responsável; filtre pela situação.
3. Abra **Ver detalhes** para consultar todos os campos ou editar o cadastro.
4. Use **Dar baixa** e confirme. O registro permanece no histórico e pode ser consultado e ter seus dados corrigidos. A situação “Baixado” permanece; não há exclusão nem reativação.

A identificação deve ser única, inclusive entre bens baixados; maiúsculas/minúsculas e espaços nas extremidades não criam identificações diferentes. Situações: ativo, em manutenção e baixado. Valores aceitam zero e até duas casas decimais. O resumo soma os valores de aquisição de ativos e bens em manutenção, sem calcular valor de mercado ou depreciação.

## Dados e limites

Os dados ficam em `data/assets.json`, criado no primeiro cadastro e preservado entre reinícios. Faça backup desse arquivo com o aplicativo parado. A gravação usa arquivo temporário e substituição do arquivo de dados, com operações serializadas dentro do processo. Um arquivo inválido impede a inicialização para evitar perda silenciosa de dados.

Execute **uma única instância por pasta de dados**. A aplicação foi feita para uso local por uma pessoa: escuta apenas `127.0.0.1`, não possui autenticação e não deve ser exposta à rede ou à internet. Quem tem acesso à sessão local ou ao arquivo de dados pode acessar os registros. Não há sincronização entre abas em tempo real; recarregue para consultar alterações feitas em outra aba. Os registros são carregados integralmente para busca local, adequada a inventários pequenos.

## Verificar

```powershell
npm test
```

Testes de integração usam `node:test` e diretórios temporários, sem alterar o inventário real. Cobrem cadastro, consulta, edição, baixa, validação, identificação duplicada, persistência, concorrência, proteções HTTP e preservação de arquivo corrompido.

## Arquivos

- `server.mjs`: servidor HTTP, API, validação e persistência JSON.
- `public/index.html`: interface e formulários acessíveis.
- `public/styles.css`: tokens visuais, componentes e layout responsivo.
- `public/app.js`: cadastro, consulta, busca, filtros, edição e confirmação de baixa.
- `test/server.test.mjs`: testes automatizados de integração.
- `package.json`: comandos de execução e teste; `.gitignore`: dados locais fora do versionamento.
- `reports/TASK-2026-001/`: planejamento e evidências de implementação/revisão; `reports/build-log.md`: histórico consolidado.

A skill local `frontend-design-codex` foi aplicada à hierarquia visual, tokens, formulários, estados de carregamento/erro/vazio, responsividade e acessibilidade. A skill `wealth-management-advisor` foi avaliada como inaplicável ao cadastro patrimonial, pois trata de aconselhamento financeiro.

## Preparar e enviar ao GitHub

O versionamento inclui código, testes, documentação e materiais do processo de desenvolvimento: `AGENTS.md`, `.codex/agents/`, `.codex/skills/` e `reports/`, incluindo capturas de tela e scripts de validação. O `.gitignore` exclui o inventário real em `data/`, dependências, caches, saídas geradas, logs, credenciais e estado pessoal de ferramentas. Modelos como `.env.example`, `.env.local.example`, `.env.sample` e `.env.template` podem ser incluídos, desde que contenham somente valores fictícios.

Antes de publicar, revise também relatórios e capturas para confirmar que não contêm dados pessoais ou segredos. As regras do `.gitignore` não removem arquivos já rastreados pelo Git.

Se a pasta ainda não for um repositório Git, inicialize-a:

```powershell
git init -b main
```

Prepare os arquivos e revise o conteúdo que entrará no primeiro commit:

```powershell
git add .
git status --short
git diff --cached --stat
git diff --cached
```

Após conferir os arquivos, crie o commit. Crie também um repositório vazio no GitHub e substitua a URL abaixo pela URL desse repositório:

```powershell
git commit -m "Prepara projeto e documenta desenvolvimento"
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Esses comandos são instruções para o envio; a preparação dos arquivos não cria um repositório remoto nem publica o projeto.
