---
sidebar_position: 2
---

# Feature Complexa

Para tarefas multi-componente, frontend mais backend, ou com ambiguidade
significativa nos requisitos. Aqui o harness usa o pipeline completo:
decomposição em subtasks, separação de papéis e o sprint contract preenchido
antes de qualquer código.

## Quando usar o pipeline completo

Ative o pipeline completo quando o prompt tem qualquer um destes sinais:

- Prompt multi-componente — por exemplo, mudança que atravessa frontend e
  backend ao mesmo tempo.
- Ambiguidade nos requisitos que exige decisões de design antes de codar.
- Mais de três arquivos esperados, ou impossibilidade de estimar o escopo
  com confiança.

## Fluxo passo a passo

**Prompt:** `Busca full-text nos produtos com filtros por categoria e preço,
no backend (FastAPI) e frontend (Vue).`

### 1. Abrir a sessão

```text
/harness-session-start
```

- Lê o estado atual e roda a verificação de baseline.
- Confirma que não há outra feature `in_progress` — o WIP tem de estar livre.

### 2. Decompor em subtasks

```text
/harness-wip-control
```

- Quebra a feature em seis subtasks rastreáveis (`feat-020` a `feat-025`),
  por exemplo: schema de busca, índice full-text, endpoint de query, filtros
  por categoria, filtros por preço e componente Vue de resultados.
- Marca `feat-020` como `in_progress`. Todas as outras ficam `not_started`.
- Mantém o WIP=1: apenas uma subtask ativa por vez.

### 3. Separar os papéis

```text
/harness-role-separation
```

- **Planner** — define scope, critérios de aceite e o plano de verificação
  no sprint contract. É quem decide o que entra e o que fica de fora.
- **Generator** — implementa, iterando sobre as seis subtasks na ordem
  planejada.
- **Evaluator** — aplica a rubrica de seis dimensões ao resultado, sem ter
  participado da geração. Essa separação reduz o viés de auto-avaliação.

### 4. Rodar o ciclo PREVC em cada subtask

Para cada subtask, o harness itera:

1. **Review** — revisa o contrato e o estado atual.
2. **Execute** — implementa a subtask.
3. **Validate** — roda os comandos de verificação e captura o output.
4. **Judge** — o Evaluator julga contra a rubrica; se reprovar, volta ao
   Execute com a causa registrada.

Só depois que uma subtask passa é que a próxima entra em `in_progress`.

### 5. Confirmar

- A confirmação só acontece depois que **todas** as seis subtasks passam.
- Cada uma carrega sua própria evidência.

### 6. Handoff

```text
/harness-clean-handoff
```

- Registra seis features `passing` com evidência e os doze arquivos tocados.
- Se algo ficou pendente, o handoff descreve o blocker e a próxima ação.

## Resumo

**Tempo típico:** cerca de 30 a 45 minutos.
**Skills usados:** 7 — os quatro do modo rápido mais `role-separation`,
`evaluator-rubric` e `continuity`.

## O sprint contract

Para features complexas, o sprint contract é preenchido ANTES do Execute. Ele
tem quatro seções, e cada uma existe para fechar uma porta de ambiguidade:

- **Scope In** — o que será feito, listado sem ambiguidade.
- **Scope Out** — o que NÃO será feito. No exemplo, ficam de fora
  ElasticSearch, autocomplete e busca fonética. Registrar o que fica de fora
  é tão importante quanto o que entra.
- **AC (Acceptance Criteria)** — critérios de aceite observáveis, do tipo
  "buscar `camiseta` retorna apenas produtos com o termo, ordenados por
  relevância".
- **Verification Plan** — os comandos exatos e as condições de sucesso de
  cada check (lint, testes, build, chamada real ao endpoint).

Trabalho adjacente descoberto durante a execução vira uma próxima tarefa
(`not_started`), nunca uma extensão silenciosa da tarefa ativa. O sprint
contract é o contrato que impede o escopo de crescer sem aprovação.

## Próximo passo

Para aplicar o harness num código que já existe, veja
[Projeto Existente](./existing-project).
