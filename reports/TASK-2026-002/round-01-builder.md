# TASK-2026-002 — Builder

Rodada: round-01. Data: 2026-10-19.

## Objetivo implementado

Preparação dos arquivos para envio ao GitHub, conforme [plano do Manager](round-01-manager.md). Execução confirmada pelo subagente Builder, seguindo `.codex/agents/builder.toml` e `AGENTS.md`.

## Arquivos e alterações

- `.gitignore`: mantidas as exclusões originais `/data/` e `*.tmp`; adicionadas regras para dependências, caches, build, cobertura, logs, configuração privada, chaves, credenciais, estado pessoal de ferramentas e perfis temporários `chrome-qa-*/` usados pelo harness existente.
- `README.md`: acrescentada seção sobre materiais incluídos, dados excluídos e preparação/revisão do primeiro commit, criação de remoto e envio com URL de exemplo.
- `reports/TASK-2026-002/round-01-builder.md`: criado este registro. Nenhum arquivo removido.

## Decisões

Não há regra que exclua `reports/`, extensões PNG/JSON/MJS, `AGENTS.md`, `.codex/agents/` ou `.codex/skills/`. O estado pessoal de `.codex` é tratado por caminhos específicos. Os modelos `.env.example`, variantes terminadas em `.example`, `.sample` ou `.template` permanecem elegíveis. A exclusão de perfis temporários preserva as capturas e os scripts fora desses diretórios. Código da aplicação, dependências e relatórios anteriores não foram modificados.

## Comandos e verificações observadas

- `Get-Content -LiteralPath ... -Encoding UTF8`: lidos `.codex/agents/builder.toml`, plano da rodada, `AGENTS.md`, `.gitignore`, `README.md` e `package.json`, com execução bem-sucedida.
- `rg --files --hidden ...`: inspecionados nomes de arquivos de instruções e configuração, excluindo `data/`, `node_modules/`, `.git/` e relatórios; execução bem-sucedida.
- `apply_patch`: atualizados `.gitignore` e README, e criado este relatório.
- Releitura de `.gitignore` e seção final do README com `Get-Content`: conteúdo salvo confirmado.

## Testes e limitações

Builder não executou testes automatizados nem comandos de inicialização, commit ou push. O Tester fará validação independente das regras com Git em diretório isolado e executará os testes da aplicação, conforme plano. Nenhum conteúdo de `data/` ou de credenciais foi lido. Regras por nome não garantem ausência de dados sensíveis em arquivos permitidos; o README orienta revisão dos materiais e do conteúdo preparado antes do commit. `.gitignore` não retira arquivos já rastreados de um repositório existente.

## Pendências ao Manager

Acionar Tester para verificar os caminhos permitidos e bloqueados, a preservação das evidências e os testes da aplicação. Não há falha conhecida observada pelo Builder; a aprovação depende da validação independente e consolidação do Manager.
