---
sidebar_position: 3
---

# PREVC

PREVC e o controlador do ciclo de vida. Agents, skills e plugins fornecem
capacidades limitadas; nenhum deles decide sozinho que o trabalho terminou.

## Fases

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

## Como usar

```text
/prevc Adicionar endpoint de health check
```

O PREVC prepara o plano e para em `awaiting_plan_approval`. Depois que voce
aprovar:

```text
/prevc run
```

Ele executa dentro do escopo aprovado, valida e entrega o handoff.

## Regras do PREVC

- WIP=1 sempre.
- Conclusao exige evidencia real.
- Nao tocar arquivos fora do escopo.
- Trabalho adjacente vira `not_started`.
- Se a verificacao falhar, a feature e marcada como `blocked`.
- Se o Judge nao for Accept, nao confirma.
