# TASK-2026-001 — Aplicativo de controle patrimonial

Rodada: round-01. Data: 2026-10-19.

## Estado observado

Projeto contém AGENTS.md, configurações de Manager/Builder/Tester e duas skills locais. Não há código, dependências, relatórios anteriores ou repositório Git. Node v24.21.0, npm 11.19.0 e Chrome/Edge disponíveis. `.shared/visual-runtime` não existe no projeto.

## Objetivo e plano

Entregar aplicação local executável para registrar, consultar, editar e dar baixa em bens. Usar Node.js e APIs nativas, sem dependências de produção, servidor restrito a loopback e persistência JSON local. Não incluir aconselhamento financeiro, autenticação, implantação ou funcionalidades alheias ao cadastro.

1. Builder implementa servidor, validação, armazenamento, interface, testes relevantes e README.
2. Builder registra resultados em round-01-builder.md.
3. Tester revisa e executa testes, incluindo navegador e capturas desktop/mobile quando possível, sem alterar produção; registra round-01-tester.md.
4. Manager avalia critérios, registra resumo e atualiza build-log. Se reprovado, abrir nova rodada sem sobrescrever relatórios.

## Critérios de aceitação

- Executar com `npm start`, sem instalação de dependências de produção.
- Cadastrar identificação única, descrição, localização, responsável, valor, data de aquisição e situação.
- Consultar listagem e detalhes, buscar/filtrar, editar, confirmar baixa preservando registro.
- Persistir dados após reiniciar aplicação; validar campos e apresentar erros compreensíveis.
- Interface em português com estados vazio/carregando/erro, controles acessíveis e layout utilizável em desktop e celular.
- Testes efetivamente executados de cadastro, duplicidade, edição, baixa, consulta, validação e persistência; evidências visuais e limitações explicitadas.
- README com execução, armazenamento, limitações e arquivos; todos os relatórios obrigatórios preservados.

## Delegação e skills

Manager: agente principal, seguindo `.codex/agents/manager.toml`; não modifica código de produção.
Builder: subagente builder, instruído a seguir `.codex/agents/builder.toml` e este plano.
Tester: subagente tester, acionado após entrega do Builder e instruído a seguir `.codex/agents/tester.toml`.

Aplicar `.codex/skills/frontend-design-codex/SKILL.md` a tokens, fluxo de cadastro/consulta, responsividade, acessibilidade e revisão visual. A skill local wealth-management-advisor foi identificada e avaliada como inaplicável: trata de orientação financeira, não desenvolvimento de inventário. Skills de sistema imagegen, openai-docs, skill-creator e skill-installer não são necessárias ao escopo.

## Rodada anterior e pendências

Primeira rodada, sem resultado anterior. Runtime visual compartilhado ausente: procurar instalação existente ou usar alternativa local, registrando limitações reais. Nenhuma autorização adicional necessária para implementação local reversível. Não modificar instruções/configurações existentes.
