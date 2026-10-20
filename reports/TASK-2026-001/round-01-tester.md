# TASK-2026-001 — Tester — round-01

Data: 2026-10-19. Plano: [Manager](round-01-manager.md). Entrega: [Builder](round-01-builder.md).

## Escopo e arquivos analisados

Lidos `AGENTS.md`, `.codex/agents/tester.toml`, plano, relatório Builder e `.codex/skills/frontend-design-codex/SKILL.md`. Revisados `server.mjs`, `public/index.html`, `public/styles.css`, `public/app.js`, `package.json`, `test/server.test.mjs` e `README.md`. Nenhum arquivo de produção foi modificado pelo Tester.

Verificados cadastro e campos obrigatórios, identificação única, listagem/detalhes, busca/filtro, edição, confirmação/cancelamento de baixa, preservação do histórico, validação, persistência após reinício, proteções HTTP e responsividade. A skill frontend foi aplicada explicitamente à captura, inspeção visual, controles acessíveis, estados e lint. O runtime `.shared/visual-runtime` não existe; foi criado [harness de QA](browser-qa.mjs) com Node/CDP nativos, sem dependências adicionais.

## Comandos realmente executados e resultados

| Comando | Resultado observado |
| --- | --- |
| `npm test` (escalado, prefixo aprovado) | APROVADO: 5 testes, 0 falhas, saída 0. |
| `node --check server.mjs` | APROVADO: saída 0. |
| `node --check public/app.js` | APROVADO: saída 0. |
| `node reports/TASK-2026-001/browser-qa.mjs` (primeira execução escalada) | REPROVADO: asserção de contraste; [resultado inicial](browser-qa-first-results.json) preservado. |
| Mesmo comando, após ajustar apenas o harness para continuar casos independentes | REPROVADO: 26 verificações funcionais/técnicas aprovadas; 4 ocorrências da mesma falha de contraste. [Resultado completo](browser-qa-results.json). |

O Chrome headless foi iniciado com aprovação, em 1440×1000 e 390×844, com perfil e arquivo de dados temporários dentro de `reports/TASK-2026-001/`, removidos ao final. Servidor importado por `createApp`, porta aleatória, sem usar o inventário real. A única falha de rede registrada foi `net::ERR_INTERNET_DISCONNECTED`, induzida deliberadamente no teste offline. Nenhuma exceção JavaScript foi observada.

### Testes aprovados

- Suíte HTTP: cadastro, consulta por ID/listagem, edição de localização/situação, baixa preservada/repetida, bloqueio de reativação, reinício com persistência; duplicidade no cadastro/edição; campos vazios/longos, valor inválido e data inexistente; registros ausentes; concorrência sem perda de registros; Host/Origin externos rejeitados; JSON inválido, conteúdo incorreto e limite de corpo; arquivos públicos e proteção dos internos; arquivo corrompido preservado.
- Navegador: estado vazio, foco inicial do formulário, validação nativa obrigatória, cadastro, detalhes com responsável/data, edição e atualização da listagem, busca `reuniao` encontrando `reunião`, filtro com resultado vazio, confirmação de baixa com foco inicial em Cancelar, cancelamento preservando situação, confirmação preservando registro com situação Baixado e contagem em uso zerada, detalhes com data da baixa e sem nova ação de baixa, erro de conexão e recuperação por Tentar novamente.
- Casos adicionais HTTP: corpo dividido no meio do UTF-8 `ã` manteve `Identificação São João`; valor `0.29` preservado; valor `1.001` rejeitado com HTTP 400. Não foram confirmadas falhas de decodificação ou precisão de duas casas.
- Lint alternativo: nenhuma rolagem horizontal da página, overflow visível ou controle sem nome nos quatro estados coletados; sem imagens sem alt. Contraste foi o único bloqueio do lint. Pequenas fontes registradas separadamente como recomendação.

## Evidências visuais inspecionadas

As oito PNG foram abertas e examinadas pelo Tester:

- [Desktop vazio](desktop-empty.png), [formulário desktop](desktop-form.png), [inventário desktop](desktop-inventory.png).
- [Inventário celular](mobile-inventory.png), [detalhes celular](mobile-details.png), [formulário celular](mobile-form.png), [confirmação de baixa celular](mobile-retire.png), [erro de conexão celular](mobile-error.png).

Hierarquia, espaçamento, cores e campos estão coerentes; tabela adapta-se para cartões no celular, sem corte horizontal. Formulário celular é mais alto que a janela e usa rolagem interna do diálogo; rodapé de ações requer rolar. As capturas móveis de inventário/erro incluem toast de sucesso temporário sobre parte do conteúdo, consequência de ações imediatamente anteriores, não perda de conteúdo. A legenda em contraste insuficiente e textos auxiliares muito pequenos reduzem legibilidade.

## Problemas encontrados

### MÉDIO — Contraste da legenda no cartão de valor abaixo do mínimo AA

Evidência: `public/styles.css`, combinação de `--muted: #65716e` e fundo `.value-metric`/`--soft: #eaf2ed`. Texto “Sem incluir bens baixados” resulta em **4,449222108342618:1**, inferior a 4,5:1 para texto normal. O lint detecta a mesma combinação nos quatro estados; são quatro observações do mesmo defeito, não quatro bugs.

Reprodução: iniciar aplicativo, abrir tela inicial e inspecionar a legenda no cartão Valor de aquisição em uso; executar o harness e consultar `lint.desktop.contrast` e `lint.mobile.contrast`. Evidência visual: [inventário desktop](desktop-inventory.png), [inventário celular](mobile-inventory.png). Correção recomendada ao Builder: escurecer token `--muted` ou o texto específico e repetir o lint. Não foi corrigido pelo Tester.

### BAIXO — Texto auxiliar e ações pequenas

Lint registra 12 elementos de texto abaixo de 12px no inventário desktop e 12 no inventário celular, incluindo o ponto decorativo. Marca secundária 9px/8px, títulos auxiliares 10px, cabeçalhos 10px, badges 11px/10px e ação Ver detalhes 11px no celular. Rótulos dos detalhes também têm 11px. Recomendação: elevar texto informativo para pelo menos 12px, revisar encaixe da marca e cartões; o ponto decorativo não precisa aumentar. Este achado isolado não impede os fluxos funcionais.

### BAIXO — Manutenção de HTML/CSS compactados

HTML com blocos extensos na mesma linha e CSS inteiro em uma linha dificultam revisão e diagnóstico. Recomendação de formatação sem alteração de comportamento. Não constitui falha funcional nem motivo independente para reprovação.

## Riscos e lacunas

Revisão de segurança confirmou uso de `textContent`, CSP, allowlist de estáticos, restrição de Host/Origin e persistência serializada por processo. O escopo local sem autenticação e uma instância por diretório está documentado; não se avaliou implantação em rede, volume elevado, múltiplos processos ou falha física de disco. Não há tais requisitos no plano.

Não executados: leitores de tela, aparelho móvel físico, outros navegadores e auditoria completa WCAG. O lint alternativo cobre contraste, tamanho, overflow, nomes e alt de estados coletados, sem pretender substituir auditoria completa. Não há comandos de build/lint do projeto além de `npm test`; checagem sintática foi executada. `npm start` não foi invocado pelo Tester; a mesma implementação foi executada via `createApp` com dados isolados e o script npm foi inspecionado.

## Veredito

**REPROVADO.** Fluxos funcionais, validação e persistência executados passaram. A revisão exigida pela skill encontrou contraste abaixo de AA, com reprodução e medida objetiva. Encaminhar correção visual ao Builder em nova rodada, preservando estes resultados e capturas; revalidar contraste e layout após ajuste.
