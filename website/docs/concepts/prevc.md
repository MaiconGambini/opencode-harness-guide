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
PLAN
        |-- define objetivo, escopo, não-escopo e AC observáveis
        |-- divide o trabalho em unidades WIP=1 quando necessário
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

Inicie o PREVC com a descrição da tarefa:

```text
/prevc Adicionar endpoint de health check
```

- Prepara o plano (objetivo, escopo, não-escopo e AC).
- Para em `awaiting_plan_approval` aguardando sua confirmação.

Depois que você aprovar, execute:

```text
/prevc run
```

- Executa dentro do escopo aprovado.
- Valida o resultado e entrega o handoff.

## Regras do PREVC

- WIP=1 sempre.
- Conclusão exige evidência real.
- Não tocar arquivos fora do escopo.
- Trabalho adjacente vira `not_started`.
- Se a verificação falhar, a feature é marcada como `blocked`.
- Se o Judge não for Accept, não confirma.
