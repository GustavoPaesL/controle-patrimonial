# TASK-2026-002 — preparação para GitHub

Rodada: round-01. Data: 2026-10-19.

## Objetivo e estado observado

Preparar o versionamento do projeto, preservando os materiais que mostram o desenvolvimento. O `.gitignore` existente contém somente `/data/` e `*.tmp`. Código, testes, documentação, relatórios, capturas e configurações locais dos agentes estão presentes. `git status --short` retornou que a pasta não é um repositório Git; não há histórico disponível para comparar alterações preexistentes. TASK-2026-001 pertence à implementação da aplicação e será preservada.

## Plano e critérios de aceitação

1. Builder revisará `.gitignore` para excluir dados reais, credenciais, dependências, caches e resíduos locais, mantendo código, testes, exemplos de configuração, relatórios, evidências e instruções dos agentes elegíveis para versionamento.
2. Builder documentará no README o conteúdo versionável e os passos de inicialização e primeiro envio, sem efetuar commit, criar repositório remoto ou publicar.
3. Tester validará regras com Git em repositório temporário isolado, executará `npm test` e examinará os arquivos elegíveis em busca de sinais de credenciais sem reproduzir valores sensíveis.
4. Manager consolidará os resultados e atualizará o histórico.

Aceitação: evidências do desenvolvimento permanecem visíveis; dados locais e segredos comuns são ignorados; regras verificadas; aplicação preservada; limitações sobre publicação e ausência de repositório documentadas.

## Delegação

Manager: agente principal, seguindo `.codex/agents/manager.toml`. Builder: subagente Builder, seguindo `.codex/agents/builder.toml`. Tester: subagente Tester, seguindo `.codex/agents/tester.toml`, acionado após o Builder. Cada agente deve confirmar sua execução e produzir seu relatório da rodada.

## Rodada anterior e pendências

Primeira rodada desta tarefa. Nenhuma rodada anterior. O remoto GitHub não foi informado; a tarefa atual prepara os arquivos e as instruções, sem envio externo. Não alterar código da aplicação, dependências ou relatórios anteriores. Não expor o conteúdo de `data/`.
