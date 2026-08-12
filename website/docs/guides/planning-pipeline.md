---
sidebar_position: 0
---

# Como os planos são feitos (v1.1)

A partir da v1.1, planejar deixou de ser um passo pesado e virou um **pipeline
fixo** dentro da fase PLAN do PREVC. O resultado é mais consistente, com menos
slop, e mais rápido que o fluxo antigo baseado em `/shape-spec`.

## O problema do fluxo antigo

O `/shape-spec` (Agent OS) produzia `spec.md`, `plan.md`, `tasks.md`,
`decisions.md`, `verification.md` e `evals.md` tudo de uma vez, no começo. Era
lento, e a decomposição em lanes era escrita "na mao" pelo modelo — inconsistente
e propensa a slop. `/shape-spec` continua existindo como **escape hatch manual**,
mas não é mais o caminho padrão.

## O pipeline (`/plan`)

O `spec-lead` planeja em três passos, dimensionando a profundidade ao trabalho:

```text
/plan <objetivo>
        |
        v
1. SIZE-GATE  -> wayfinder  (só trabalho grande/nebuloso/cross-subsystem)
        |          mapa de decision-tickets; resolve as decisões antes
        v
2. SHARPEN    -> grill-with-docs (modo AUTO)
        |          auto-entrevista + domain-modeling, decide sozinho,
        |          rotula assumptions, escreve ADRs/glossário
        v
3. DECOMPOSE  -> to-tickets = a LANE TABLE
        |          tracer-bullet vertical slices com blocking edges
        v
awaiting_plan_approval  (o operador revisa e aprova uma única vez)
```

### 1. Size-gate → wayfinder (só quando grande)

Se o esforço e maior que uma sessão de agente, nebuloso ou cruza subsistemas, o
`wayfinder` desenha um **mapa de decision-tickets** (`tickets/00-map.md`) e resolve
as decisões abertas primeiro. Trabalho normal **pula** esse passo — a própria regra
do wayfinder e "sem fog, sem mapa".

### 2. Sharpen → grill-with-docs (AUTO)

O `grill-with-docs` roda em **modo AUTO**: ele não pausa para perguntar ao operador.
Percorre cada ramo da árvore de decisão e **toma a própria resposta recomendada**,
resolvendo a partir do código, ADRs, `CONTEXT.md` e requisitos. Cada resposta vira
uma decisão; as que ele resolveu por conta própria são **rotuladas como assumptions**
para o operador ver na revisão. ADRs e glossário são escritos via `domain-modeling`.

Ele só escala ao operador em um **blocker real**: ambiguidade que nenhuma fonte
resolve, decisão difícil de reverter sem default defensável, ou mudança de escopo.
E o mesmo critério de parada de um autonomous run.

### 3. Decompose → to-tickets = a lane table

O `to-tickets` quebra o plano afiado em **tracer-bullet vertical slices** dentro de
`agent-os/specs/<slug>/tickets/`, cada um declarando suas blocking edges. **Um
ticket tracer-bullet E uma lane**: vertical, do tamanho de uma janela de contexto,
com um único dono. De cada ticket sai o conjunto exato de arquivos da lane, as
dependências (as blocking edges) e o comando de verificação.

O passo "Quiz the user" do to-tickets **não pausa inline** — ele se dobra no único
gate `awaiting_plan_approval` do PREVC.

## Onde os tickets ficam

Backend local-markdown, sem tracker externo, sem `gh`, sem rede:

```text
agent-os/specs/<YYYY-MM-DD-HHMM-slug>/
  spec.md            # do template agent-os
  tickets/           # A lista canônica de tarefas — um arquivo por ticket
    00-map.md        # mapa do wayfinder (só em esforços grandes)
    01-<slug>.md     # ticket (Blocked by: None)
    02-<slug>.md     # Blocked by: 01
```

O conjunto `tickets/` **e** a lista de tarefas: "todas as tasks do plano" = o
conjunto de tickets, e o scheduler o lê direto como lane table. A convenção completa
está em `docs/harness/matt-pocock-tracker.md` (global, instalado em projeto novo pelo
`/harness-bootstrap`).

## Execute: implement, sem race

Depois da aprovação, o `spec-lead` vira o scheduler (veja
[dispatch paralelo](./parallel-dispatch)). Cada lane é executada por um specialist
que segue a disciplina da skill `implement` — TDD nos seams combinados, typecheck e
testes por arquivo, suite completa no fim, depois code review.

**Specialists não commitam.** Só o scheduler commita, reconciliando todas as lanes
num commit local — assim lanes paralelas nunca correm no git. Uma lane escreve um
arquivo por vez.

## Plan + execute numa sessão só

O `spec-lead` pode planejar **e** executar na mesma sessão:

- Ele pode escrever artefatos de plano (spec, `tickets/`, ADRs, `CONTEXT.md`,
  `feature_list.json`) durante o planejamento.
- Pode editar código-fonte direto quando trabalha **sequencialmente** (ex: fazer a
  task 1 sozinho antes de qualquer dispatch).
- **Nunca edita enquanto specialists paralelos estão no ar** — ali as lanes são donas
  dos arquivos; só elas editam e só o scheduler commita.

## Resumo

| | Antigo (`/shape-spec`) | Novo (`/plan`, v1.1) |
|---|---|---|
| Velocidade | lento (ceremony upfront) | rápido (auto-grill + tickets gerados) |
| Consistência | lanes escritas na mao | tracer-bullet slice = contrato rigido |
| Decisões | mistas | decisions + assumptions rotuladas |
| Lane table | artefato separado | **e** o conjunto de tickets |
| Interação | pausas | um único gate de aprovação |
