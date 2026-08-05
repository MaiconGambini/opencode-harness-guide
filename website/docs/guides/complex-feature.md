---
sidebar_position: 2
---

# Feature Complexa

Para tarefas multi-componente, frontend + backend, ou com ambiguidade
significativa.

## Quando usar o pipeline completo

- Prompt multi-componente (ex: frontend e backend).
- Ambiguidade nos requisitos.
- Mais de 3 arquivos esperados.

## Exemplo

**Prompt:** `Busca full-text nos produtos com filtros por categoria e preco,
no backend (FastAPI) e frontend (Vue).`

**Fluxo:**

1. `/harness-session-start`

2. `/harness-wip-control`
   - Decompoe em 6 subtasks (feat-020 a feat-025).
   - Marca feat-020 como `in_progress`. Resto: `not_started`.

3. `/harness-role-separation`
   - Planner define scope, AC e verification plan no sprint contract.
   - Generator itera sobre as 6 subtasks.
   - Evaluator aplica rubrica de 6 dimensoes.

4. PREVC itera: Review -> Execute -> Validate -> Judge.

5. Confirm depois que todas as subtasks passam.

6. Handoff registra 6 features `passing` com evidencia, 12 arquivos tocados.

**Tempo:** ~30-45 minutos. **Skills usados:** 7 (+ role-separation,
evaluator-rubric, continuity).

## O sprint contract

Para features complexas, o sprint contract e preenchido ANTES do Execute:

- **Scope In** — o que sera feito.
- **Scope Out** — o que NAO sera feito (ex: ElasticSearch, autocomplete).
- **AC** — criterios de aceite observaveis.
- **Verification Plan** — comandos e condicoes de sucesso para cada check.

Trabalho adjacente descoberto durante a execucao vira uma proxima tarefa,
nao uma extensao silenciosa da tarefa ativa.
