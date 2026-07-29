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

## PREVC e `/goal`

`/prevc` organiza o lifecycle. `/goal` armazena o objetivo, o plano aprovado
e a evidência. Trabalham juntos, com responsabilidades diferentes.

```text
/prevc prepare <objetivo>
        v
goal: awaiting_plan_approval
        v
/goal confirm
        v
/prevc run <goal-id>
        v
PREVC: Review -> Execute -> Validate -> Judge
        v
workflow-only awaiting_confirmation
```

| Ação | Resultado |
|---|---|
| `/prevc prepare <objetivo>` | Descobre contexto, classifica risco e prepara o plano. |
| `/goal confirm` | Registra aprovação explícita do plano e libera a execução. |
| `/prevc run <goal-id>` | Executa somente o escopo aprovado, com budgets e gates. |
| `/goal revise <motivo>` | Pede revisão; o motivo não pode ser vazio. |
| `/goal submit-revision <resumo>` | Envia plano revisado para nova aprovação. |
| `/goal abort <motivo>` | Aborta o objetivo com motivo durável. |

## Estados persistidos do goal

O armazenamento atual persiste somente:

- `awaiting_plan_approval`
- `revision_requested`
- `active`
- `aborted`

`awaiting_confirmation` é uma etiqueta de workflow do PREVC, **não** um estado
final persistido. Ela existe para impedir que uma revisão de Judge seja
confundida com uma conclusão durável.

## Por que não há auto-conclusão

Uma mensagem do agente dizendo que rodou um comando **não** é um recibo
confiável do runtime. Os campos de evidência guardam comando, workspace, exit
code e verifier, mas permanecem informativos.

Enquanto não houver recibos confiáveis de execução, nenhuma transição
automática para conclusão final será habilitada. Esse limite é intencional: o
sistema prefere parar em revisão a registrar uma conclusão que não consegue
provar.

## Regras do PREVC

- WIP=1 sempre.
- Conclusão exige evidência real.
- Não tocar arquivos fora do escopo.
- Trabalho adjacente vira `not_started`.
- Se a verificação falhar, a feature é marcada como `blocked`.
- Se o Judge não for Accept, não confirma.
