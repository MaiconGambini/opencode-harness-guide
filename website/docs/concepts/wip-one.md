---
sidebar_position: 4
---

# WIP=1

WIP=1 significa que apenas uma unidade de trabalho pode estar ativa por vez.
É a disciplina central do harness.

## Por que WIP=1?

| Com WIP=1 | Sem WIP=1 |
|---|---|
| Uma feature é concluída por vez | Várias features são iniciadas e nenhuma termina |
| Bloqueios são registrados com causa exata | Bloqueios se acumulam sem registro |
| O escopo de cada sessão é claro | A sessão pula entre tarefas |
| Handoff descreve exatamente uma próxima ação | Handoff lista várias coisas "em andamento" |

## Como funciona

O `feature_list.json` mantém o estado de cada feature:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

- Apenas uma feature pode estar `in_progress`.
- Quando termina, vai para `passing` (com evidência) ou `blocked` (com razão exata).

## Durante a execução

Se você descobrir trabalho adjacente durante uma tarefa:

1. Adicione a nova tarefa como `not_started` no `feature_list.json`.
2. Continue trabalhando apenas na tarefa ativa.
3. A nova tarefa será puxada na próxima sessão.

Não expanda o escopo silenciosamente. Se o escopo crescer, pare, atualize o
sprint contract e peça aprovação.
