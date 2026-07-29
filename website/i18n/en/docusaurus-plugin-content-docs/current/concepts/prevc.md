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
PLAN
        |-- define objetivo, escopo, nao-escopo e AC observaveis
        |-- divide o trabalho em unidades WIP=1 quando necessario
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

PREVC prepares the plan and stops at `awaiting_plan_approval`. Once you
approve:

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
