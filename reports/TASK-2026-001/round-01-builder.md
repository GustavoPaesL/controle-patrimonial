# TASK-2026-001 — Builder — round-01

Data: 2026-10-19. Planejamento: [Manager](round-01-manager.md).

## Objetivo implementado

Aplicação local Acervo para cadastrar, listar, consultar detalhes, buscar/filtrar, editar e dar baixa em bens, com identificação, descrição, localização, responsável, valor, data de aquisição e situação.

## Arquivos criados, modificados ou removidos

Criados: `package.json`, `.gitignore`, `server.mjs`, `public/index.html`, `public/styles.css`, `public/app.js`, `test/server.test.mjs`, `README.md` e este relatório. Nenhum arquivo preexistente foi modificado ou removido.

## Resumo técnico e decisões

- Node.js nativo sem dependências de produção: `npm start` executa servidor restrito a `127.0.0.1:3000`, com porta configurável.
- API HTTP com validação no servidor, identificação única sem distinção de maiúsculas, consulta de registros e baixa por ação própria. Baixa preserva registro e data; edições posteriores preservam a situação baixada.
- Persistência em `data/assets.json`, fila de mutações e substituição por arquivo temporário, evitando perda por concorrência dentro do processo. Arquivo inválido interrompe inicialização sem sobrescrever dados.
- Arquivos públicos explicitamente permitidos, verificação de Host/Origin, limite de corpo, JSON obrigatório e política CSP. Conteúdo fornecido pelo usuário usa `textContent` na interface.
- Interface portuguesa responsiva com resumo, busca, filtro, detalhes, formulário, confirmação de baixa, estados vazio/carregando/erro e feedback de sucesso. Controles nativos, rótulos, foco visível e diálogos modais.
- Skill `frontend-design-codex` lida e aplicada a tokens semânticos de cor/espaçamento/tipografia, hierarquia, layout móvel, acessibilidade e estados do fluxo. Capturas e revisão visual ficam para o Tester; não são declaradas realizadas pelo Builder.
- `wealth-management-advisor` identificada no plano como inaplicável: escopo é cadastro de inventário, sem aconselhamento financeiro. Nenhuma outra skill necessária à implementação.
- README documenta execução, backup manual, arquivo de dados, uso local, uma instância por diretório e ausência de sincronização em tempo real entre abas.

## Comandos executados e resultados observados

1. Leitura de `.codex/agents/builder.toml`, `AGENTS.md`, plano Manager e `frontend-design-codex/SKILL.md`, com inspeção da estrutura: projeto sem código preexistente.
2. `npm test` no sandbox: falhou antes de executar cenários por `spawn EPERM` do isolamento de processos de `node:test`.
3. `npm test` com execução escalada aprovada: quatro cenários aprovados, um reprovado. O cenário de Host usava `fetch`, que não enviou a substituição de Host como esperado; teste corrigido para `http.get` nativo, com cabeçalho explícito.
4. `npm test` escalado após correção: **5 testes aprovados, 0 reprovados**, código de saída 0.
5. `node --check server.mjs` e `node --check public/app.js`: ambos concluídos sem erro, código de saída 0.

O runner padrão foi preservado; nenhuma configuração foi alterada para contornar a restrição do sandbox.

## Testes realizados e não realizados

Executados testes reais de integração HTTP com dados temporários: cadastro, listagem, detalhes, edição, baixa preservada, baixa repetida, impossibilidade de reativação, persistência após reiniciar servidor, duplicidade no cadastro/edição, campos vazios/longos, valor inválido, data inexistente, situação inválida, registro inexistente, mutações concorrentes, origem/Host rejeitados, JSON inválido, limite de corpo, arquivos públicos e proteção de arquivos internos. Arquivo corrompido testado com preservação de conteúdo.

Não executados pelo Builder: navegador, capturas desktop/mobile e lint visual. Esses pontos são encaminhados ao Tester para validação independente.

## Erros conhecidos, limitações e riscos

Nenhum erro bloqueador conhecido após os testes executados. Uso local, sem autenticação; não expor à rede. Serialização é por processo, portanto executar uma única instância por diretório. Listagem inteira em memória apropriada a inventários pequenos. Não há sincronização em tempo real entre abas; recarregar para atualizar. Backup é manual. Falha de escrita pode deixar arquivo temporário sem afetar o último arquivo persistido. Revisão visual ainda pendente e sua qualidade não foi afirmada sem evidências.

## Pendências para o Manager

Acionar Tester após esta entrega para revisar produção sem modificá-la, reexecutar testes, exercitar fluxo no navegador e registrar evidências desktop/mobile e acessibilidade. Consolidar a rodada somente após o relatório Tester, preservando este histórico.
