---
sidebar_position: 3
---

# PREVC

PREVC é o controlador do ciclo de vida. Agents, skills e plugins fornecem
capacidades limitadas; nenhum deles decide sozinho que o trabalho terminou.

## Fases

```text
OPERADOR FAZ UMA SOLICITAÇÃO
        |
        v
CONTEXT FEEDFORWARD
        |-- lê regras, estado, handoff e standards relevantes
        |-- descobre risco, stack e comando de verificação
        v
PLAN  (v1.1: pipeline size-gate wayfinder -> grill-auto -> to-tickets)
        |-- define objetivo, escopo, não-escopo e AC observáveis
        |-- afia o plano em modo AUTO e decompõe em tickets = lane table
        v
OPERATOR APPROVAL
        |-- o operador revisa e confirma o plano
        v
REVIEW -> EXECUTE -> VALIDATE -> JUDGE
        |-- cada fase permanece no escopo aprovado
        |-- falha, ambiguidade ou escalação param o fluxo
        v
AWAITING CONFIRMATION
        |-- o operador revisa a evidência e recebe o handoff
        v
HANDOFF
```

## Como usar

```text
/prevc Adicionar endpoint de health check
```

Na v1.1 o PREVC prepara o plano pelo pipeline `/plan` (size-gate `wayfinder`,
`grill-with-docs` em AUTO, `to-tickets` = lane table) e para em
`awaiting_plan_approval`. Veja [como os planos são feitos](../guides/planning-pipeline).
Depois que você aprovar:

```text
/prevc run
```

Ele executa dentro do escopo aprovado, válida e entrega o handoff.

## Regras do PREVC

- WIP=1 sempre.
- Conclusão exige evidência real.
- Não tocar arquivos fora do escopo.
- Trabalho adjacente vira `not_started`.
- Se a verificação falhar, a feature é marcada como `blocked`.
- Se o Judge não for Accept, não confirma.
