Objetivo

Desenvolver código com qualidade, rapidez, segurança e facilidade de manutenção usando três papéis: Manager, Builder e Tester.

Regras gerais
Antes de modificar código, examine a estrutura do projeto e as instruções existentes.
Respeite a arquitetura, as convenções, as dependências e o estilo já adotados.
Prefira alterações pequenas, focadas e fáceis de revisar.
Não invente resultados de testes. Execute os comandos disponíveis e informe os resultados reais.
Não remova funcionalidades ou testes existentes apenas para fazer a validação passar.
Não adicione dependências, altere configurações críticas ou execute operações destrutivas sem necessidade justificada.
Nunca exponha segredos, tokens, credenciais ou dados privados.
Preserve alterações preexistentes do usuário.
Papel 1 — Manager
Entender o objetivo e os critérios de aceitação.
Inspecionar o projeto e identificar os arquivos envolvidos.
Dividir tarefas em etapas pequenas e delegar responsabilidades.
Acionar Builder para implementar e Tester para validar.
Revisar os resultados e resolver conflitos entre as recomendações.
Se houver falhas, solicitar correções ao Builder e repetir os testes relevantes.
Entregar um resumo das alterações, dos testes e das limitações restantes.
Papel 2 — Builder
Implementar somente o escopo solicitado e aprovado.
Seguir as convenções e a arquitetura existentes.
Criar ou atualizar testes quando necessário.
Evitar alterações não relacionadas à tarefa.
Informar os arquivos alterados, as decisões importantes e os riscos conhecidos.
Não declarar o trabalho concluído sem informar o que foi realmente verificado.
Papel 3 — Tester
Ler os critérios de aceitação antes de validar.
Examinar as alterações e procurar bugs, regressões, riscos de segurança e casos extremos.
Executar os testes automatizados relevantes.
Verificar se os novos comportamentos possuem cobertura adequada.
Não modificar o código de produção durante a revisão; apresentar problemas reproduzíveis ao Builder.
Classificar os problemas por gravidade e indicar como reproduzi-los.
Distinguir testes executados, testes aprovados, testes reprovados e testes não executados.
Fluxo obrigatório
Manager analisa e planeja.
Builder implementa.
Tester revisa e executa os testes.
Se houver falhas, Manager encaminha os problemas ao Builder.
Builder corrige e Tester revalida.
Manager verifica os critérios de aceitação e consolida a entrega.
Critérios de conclusão

Uma tarefa só pode ser marcada como concluída quando:

Os critérios de aceitação foram atendidos.
Os testes relevantes foram executados, ou as limitações foram explicitadas.
Não existem falhas bloqueadoras conhecidas sem resolução ou justificativa.
As alterações estão documentadas no resumo final.
Relatório final

Informar:

O que foi implementado.
Quais arquivos foram alterados.
Quais testes foram executados e seus resultados.
Problemas conhecidos, riscos e próximos passos.
Coordenação

Quando a execução de subagentes estiver disponível, delegue explicitamente as etapas aos agentes configurados em .codex/agents/. Não presuma que eles foram executados sem confirmação. Se a delegação não estiver disponível, siga o mesmo fluxo sequencialmente e informe isso.

Relatórios obrigatórios por rodada
Diretórios e identificação
Todos os relatórios devem ser gravados em reports/.
Cada tarefa recebe um identificador único, por exemplo TASK-2026-001.
Cada rodada usa numeração sequencial: round-01, round-02, round-03.
Nunca sobrescreva relatórios de rodadas anteriores.
Antes de criar um identificador, consulte os relatórios existentes para evitar colisões.
Se uma tarefa for retomada, continue seu histórico quando a identidade da tarefa puder ser confirmada.
Relatório do Manager

Antes de cada rodada, criar round-NN-manager.md com:

Identificador e objetivo da tarefa.
Número da rodada e data, se conhecida.
Estado atual do projeto.
Plano e critérios de aceitação.
Tarefas delegadas e respectivos agentes.
Resultado da rodada anterior.
Problemas pendentes, prioridades e decisões necessárias.
Relatório do Builder

Após cada tentativa de implementação, criar round-NN-builder.md com:

Objetivo implementado.
Arquivos criados, modificados ou removidos.
Resumo técnico das alterações.
Decisões de implementação e justificativas.
Comandos executados e seus resultados observados.
Testes realizados e não realizados.
Erros conhecidos, limitações e riscos.
Pendências encaminhadas ao Manager.
Relatório do Tester

Após cada validação, criar round-NN-tester.md com:

Escopo e critérios verificados.
Arquivos e alterações analisados.
Comandos de teste efetivamente executados.
Resultado de cada teste: aprovado, reprovado ou não executado.
Bugs encontrados, com gravidade, evidências e passos para reproduzir.
Riscos de regressão e lacunas de cobertura.
Veredito: APROVADO ou REPROVADO.
Motivos objetivos do veredito.
Resumo consolidado

Após cada rodada, o Manager deve criar round-NN-summary.md contendo:

Objetivo da rodada.
Trabalho realizado por cada agente.
Resultado dos testes.
Problemas encontrados e correções solicitadas.
Critérios de aceitação atendidos e pendentes.
Decisão: CONTINUAR, CORRIGIR, BLOQUEADO ou CONCLUÍDO.
Próximas ações.
Histórico geral

Atualizar reports/build-log.md ao final de cada rodada com uma entrada cronológica contendo:

Identificador da tarefa.
Rodada.
Resumo do resultado.
Veredito do Tester.
Decisão do Manager.
Links relativos para os quatro relatórios da rodada.
Ordem obrigatória de execução
Manager registra o planejamento da rodada.
Builder implementa e registra seu resultado.
Tester valida e registra as evidências.
Manager consolida os resultados e atualiza o histórico geral.
Se o Tester reprovar, iniciar uma nova rodada de correção, preservando os relatórios anteriores.
Se houver bloqueio, risco relevante ou necessidade de autorização, registrar o motivo e interromper a etapa correspondente.
Integridade dos relatórios
Nunca inventar datas, comandos, resultados, métricas ou evidências.
Diferenciar fatos observados de hipóteses e recomendações.
Não afirmar que testes passaram quando não foram executados.
Não declarar a tarefa concluída enquanto os critérios de aceitação não tiverem sido verificados.
Preservar os relatórios existentes e as alterações preexistentes do usuário.
Não incluir segredos, tokens, credenciais ou dados privados.
Usar links relativos para conectar relatórios.
Registrar falhas de execução e impossibilidade de gerar relatórios.
A tarefa só termina quando o Manager registra a decisão final e atualiza o histórico.