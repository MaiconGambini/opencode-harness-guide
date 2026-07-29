---
sidebar_position: 4
---

# WIP=1

WIP=1 significa que apenas uma unidade de trabalho pode estar ativa por vez.
E a disciplina central do harness.

## Por que WIP=1?

| Com WIP=1 | Sem WIP=1 |
|---|---|
| Uma feature e concluida por vez | Varias features sao iniciadas e nenhuma termina |
| Bloqueios sao registrados com causa exata | Bloqueios se acumulam sem registro |
| O escopo de cada sessao e claro | A sessao pula entre tarefas |
| Handoff descreve exatamente uma proxima acao | Handoff lista varias coisas "em andamento" |

## Como funciona

O `feature_list.json` mantem o estado de cada feature:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

Apenas uma feature pode estar `in_progress`. Quando termina, vai para
`passing` (com evidencia) ou `blocked` (com razao exata).

## Durante a execucao

Se voce descobrir trabalho adjacente durante uma tarefa:

1. Adicione a nova tarefa como `not_started` no `feature_list.json`.
2. Continue trabalhando apenas na tarefa ativa.
3. A nova tarefa sera puxada na proxima sessao.

Nao expanda o escopo silenciosamente. Se o escopo crescer, pare, atualize o
sprint contract e peca aprovacao.
