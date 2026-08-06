---
sidebar_position: 3
---

# PREVC

PREVC is the lifecycle controller. Agents, skills, and plugins provide
limited capabilities; none of them decides on its own that the work is done.

## Phases

```text
OPERADOR FAZ UMA SOLICITACAO
        |
        v
CONTEXT FEEDFORWARD
        |-- le regras, estado, handoff e standards relevantes
        |-- descobre risco, stack e comando de verificacao
        v
PLAN  (v1.1: pipeline size-gate wayfinder -> grill-auto -> to-tickets)
        |-- define objetivo, escopo, nao-escopo e AC observaveis
        |-- afia o plano em modo AUTO e decompoe em tickets = lane table
        v
OPERATOR APPROVAL
        |-- o operador revisa e confirma o plano
        v
REVIEW -> EXECUTE -> VALIDATE -> JUDGE
        |-- cada fase permanece no escopo aprovado
        |-- falha, ambiguidade ou escalacao param o fluxo
        v
AWAITING CONFIRMATION
        |-- o operador revisa a evidencia e recebe o handoff
        v
HANDOFF
```

## How to use it

```text
/prevc Adicionar endpoint de health check
```

In v1.1 PREVC prepares the plan through the `/plan` pipeline (size-gated
`wayfinder`, `grill-with-docs` in AUTO, `to-tickets` = lane table) and stops at
`awaiting_plan_approval`. See [how plans are made](../guides/planning-pipeline).
Once you approve:

```text
/prevc run
```

It executes within the approved scope, validates, and delivers the handoff.

## PREVC rules

- WIP=1 always.
- Completion requires real evidence.
- Do not touch files outside the scope.
- Adjacent work becomes `not_started`.
- If verification fails, the feature is marked `blocked`.
- If the Judge is not Accept, it does not confirm.
