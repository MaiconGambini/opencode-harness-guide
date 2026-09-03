---
sidebar_position: 1
---

# Casos de Uso

Escolha o workflow pelo risco, pelas dependências e pela duração do trabalho,
não apenas pelo número de arquivos. Os gates medem somente as métricas
declaradas em `agent-os/quality-thresholds.json#metrics`; sinal ausente é uma
lacuna, não aprovação.

| Cenário | Seleção recomendada |
|---|---|
| Tarefa simples em um arquivo | Uma lane curta, WIP=1 |
| Bug pequeno | Reprodução, correção mínima e regressão |
| Feature complexa | Spec, contrato, lanes por ownership |
| Multitarefa independente | Lanes paralelas com ownership disjunto |
| Multitarefa dependente | Lanes serializadas por dependência |
| Multi-sessão | Estado e handoff duráveis |
| Alto risco ou segurança | Tier completo e revisão especializada |
| Apenas documentação | Lane de docs e validação de links/fontes |
| Refine e regra aprendida | Judge, Refine e confirmação separada |
| Retomada de sessão / contexto recuperável | Estado durável e postura de qualidade da skill de sessão |
| Loop de ferramenta sem progresso | Logs de atividade redigidos; sem bloqueio automático |
| Calibrar roteamento de esforço | Proposta da skill `harness-benchmark`; sem script incluído |

## Tarefa simples em um arquivo

**Quando usar:** mudança localizada, requisito claro, sem dependência nova,
migração ou efeito em caminho de alto risco.

**Prompt de exemplo:**

```text
/prevc Corrija o texto vazio em src/components/EmptyState.tsx. Altere somente
esse arquivo e rode o teste da área e o gate local.
```

**Comportamento esperado:** PREVC cria uma unidade WIP=1, confirma o escopo,
executa a verificação descoberta e o gate local. O scheduler só escala a
revisão se o risk router ou uma lacuna exigir. O Refine só é acionado quando
há finding tipado recorrente.

**Erros comuns:** abrir uma spec grande; tocar arquivos adjacentes; chamar um
gate verde de prova quando métricas relevantes estão indisponíveis.

## Bug pequeno

**Quando usar:** comportamento reproduzível com causa provável limitada e uma
regressão automatizável.

**Prompt de exemplo:**

```text
/prevc Reproduza o erro de paginação duplicada, adicione um teste de regressão,
faça a menor correção e valide a rota afetada.
```

**Comportamento esperado:** Plan registra reprodução e critério de aceitação;
Execute segue red-green; Validate roda regressão e gates; Judge compara a
correção com o bug original. Uma violação de regra deve voltar como finding
tipado com ponteiro resolvível.

**Erros comuns:** corrigir antes de reproduzir; ampliar a refatoração; registrar
preferência como `rule_violation` sem citar uma regra real.

## Feature complexa

**Quando usar:** múltiplos componentes, decisões de design, mudanças de schema,
integrações ou critérios de aceitação independentes.

**Prompt de exemplo:**

```text
/prevc Projete e implemente exportação de relatórios. Especifique contratos,
separe ownership de API, worker e UI, e peça aprovação antes de executar.
```

**Comportamento esperado:** PREVC produz spec e contrato de avaliação, mapeia
risco e ownership, divide o plano em lanes limitadas e mantém um único objetivo
ativo. O scheduler roda o gate completo, o risk router escolhe a profundidade
de revisão e o Judge usa evidência agregada.

**Erros comuns:** iniciar código antes da aprovação; compartilhar arquivos entre
lanes; usar volume de testes como substituto dos critérios de aceitação.

## Multitarefa independente em paralelo

**Quando usar:** duas ou mais tarefas sem dependência entre si e com conjuntos
de arquivos disjuntos.

**Prompt de exemplo:**

```text
/prevc Execute em paralelo a correção do parser e a atualização do componente
de status. Declare ownership exclusivo e devolva evidência por lane.
```

**Comportamento esperado:** o scheduler cria manifest antes do dispatch, injeta
somente regras ativas que combinam com cada ownership e executa lanes em
paralelo. Cada lane roda seu gate local; o scheduler é o único escritor do
arquivo de findings e executa o gate agregado.

**Erros comuns:** paralelizar tarefas que editam o mesmo arquivo; permitir que
reviewers escrevam findings; misturar resultados sem identificar lane e
capacidade.

## Multitarefa dependente serializada

**Quando usar:** uma tarefa produz contrato, schema ou artefato consumido pela
seguinte.

**Prompt de exemplo:**

```text
/prevc Primeiro estabilize o contrato da API; depois atualize o cliente; por
último adapte a UI. Não inicie uma lane antes da evidência da anterior.
```

**Comportamento esperado:** PREVC representa as arestas de bloqueio e mantém
somente a lane liberada em execução. Cada fronteira valida seu artefato antes
do próximo dispatch; gates agregados e Judge ocorrem quando a cadeia termina.

**Erros comuns:** chamar dependências de paralelas; iniciar consumidores contra
um contrato provisório; esconder blocker para manter a execução avançando.

## Trabalho multi-sessão

**Quando usar:** o objetivo não cabe em uma sessão ou precisa sobreviver a
pausas, troca de agente ou revisão posterior.

**Prompt de exemplo:**

```text
/prevc Continue o objetivo ativo usando STATE.md e session-handoff.md. Confirme
o último gate válido antes de retomar a próxima unidade WIP=1.
```

**Comportamento esperado:** goal, estado, findings, ledger e handoff persistem
no repositório. A nova sessão relê contexto e verifica se a evidência ainda é
válida; relatórios stale ou ausentes falham fechados.

**Erros comuns:** confiar no histórico do chat; marcar `passing` sem output;
reusar relatório cuja fonte mudou.

## Alto risco ou segurança

**Quando usar:** autenticação, credenciais, pagamentos, permissões, migrações,
infraestrutura ou caminhos que combinam com `high_risk_paths`.

**Prompt de exemplo:**

```text
/prevc Corrija a validação de sessão. Classifique como alto risco, limite o
escopo a auth, inclua testes de abuso e exija revisão de segurança completa.
```

**Comportamento esperado:** o risk router seleciona revisão completa; métricas
indisponíveis impedem downgrade; reviewers especializados retornam findings
tipados. Uma proposta Refine com efeito de alto risco preserva a confirmação
do operador antes de virar regra.

**Erros comuns:** tratar permissions como sandbox; reduzir o tier porque os
testes unitários passaram; colocar segredo em evidence ou finding.

## Apenas documentação

**Quando usar:** conteúdo, navegação ou exemplos sem alteração de runtime.

**Prompt de exemplo:**

```text
/prevc Atualize o guia bilíngue de instalação, valide links e build, não altere
runtime nem declare números governantes na prosa.
```

**Comportamento esperado:** PREVC mantém ownership nos docs, roda validação de
fontes, links e build, e registra lacunas. Números governantes continuam nas
chaves de `quality-thresholds.json`, não na documentação.

**Erros comuns:** pular build por ser docs-only; duplicar valores de config na
prosa; afirmar que uma capacidade configurada já foi aceita ao vivo.

## Ciclo Refine e regra aprendida

**Quando usar:** findings tipados mostram uma falha recorrente e o Judge já
terminou. Use `/refine --note` quando o operador quiser registrar uma correção
manual como evidência.

**Prompt de exemplo:**

```text
/refine
```

**Comportamento esperado:** Refine lê a janela vinculada ao gate e o ledger,
propõe no máximo uma melhoria por componente e não escreve. A proposta literal
é mostrada em `awaiting_confirmation`; regras que podem bloquear exigem
aprovação do operador e entram em mudança separada. Na próxima execução, regras
ativas são injetadas nas lanes compatíveis.

**Erros comuns:** tratar proposta como aprovação; deixar o refiner editar o
ledger; dar voto de Judge ao Refine; afirmar auto-ativação. Ela vem desabilitada
em `learned_rules.auto_activate_prose_observe` até aceitação ao vivo e restart.

## Retomada de sessão / contexto recuperável

**Quando usar:** uma sessão nova, uma troca de agente ou logo após a compaction,
quando reler todos os arquivos de estado é caro e o risco é injetar contexto
desatualizado.

**Prompt de exemplo:**

```text
/harness-session-start
```

**Comportamento esperado:** `harness-session-start` relê as instruções raiz,
localiza o estado de progresso e de feature, lê `docs/harness/session-handoff.md`
quando presente, descobre o startup seguro e lê `agent-os/quality-thresholds.json`
e o relatório mais recente em `docs/harness/quality/*.json`. Estado ou relatório
ausente, stale ou ilegível é uma lacuna a nomear; a skill não gera briefing
executável nem transforma silêncio em passe.

**Erros comuns:** confiar no histórico do chat em vez do estado durável; ignorar
a postura de qualidade; tratar a ausência de `progress.md` como "nada pendente".

## Loop de ferramenta sem progresso

**Quando usar:** você precisa investigar chamadas e resultados de ferramentas
durante uma sessão sem expor segredos nos registros. O log é observacional; não
é um detector de loop nem um mecanismo de bloqueio.
**Prompt de exemplo:** nenhum especial — o plugin registra atividade durante a
sessão, mas não há lembrete automático de loop implementado.

**Comportamento esperado:** o plugin de tool-activity redige e grava cada
chamada e seu resultado em `.opencode/state/tool-activity.jsonl`, com retenção
limitada. Os logs ajudam no diagnóstico; não provam conclusão nem bloqueiam a
chamada.

**Erros comuns:** tratar log como gate; repetir cegamente uma operação cujo
resultado ficou desconhecido; inferir progresso apenas porque existe um registro.

## Calibrar roteamento de esforço

**Quando usar:** você quer decidir o esforço do modelo por classe de tarefa com
evidência de tempo, não por palpite — por exemplo, se `max` numa correção de um
arquivo compra algo.

**Prompt de exemplo:** não há comando de benchmark implementado neste
repositório. Use a skill `harness-benchmark` apenas para propor um benchmark
específico do projeto, com caminho crítico, métrica, limiar e comando.

**Comportamento esperado:** a skill produz uma proposta documental e exige
aprovação antes de criar scripts. Este repositório não inclui implementação de
benchmark nem grava um arquivo de estado de benchmark. Duração pode ser definida
como advisory em uma proposta, mas não é um gate implementado por esta
documentação.

**Erros comuns:** tratar uma proposta como implementação; transformar duração
em gate sem aprovação; escolher `variant` no escuro.

Veja [Harness Contínuo (baseline v1.3)](../concepts/continual-harness-v1-3) para
o contrato completo do loop.
