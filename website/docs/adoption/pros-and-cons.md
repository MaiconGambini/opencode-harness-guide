---
sidebar_position: 2
---

# Pros e Contras

Uma avaliacao honesta do que o harness entrega e do que ele custa.

## Pros

### Continuidade entre sessoes

Voce abre o OpenCode amanha e ele sabe exatamente o que estava fazendo.
Nao precisa reexplicar o contexto, reler arquivos ou adivinhar o que
ficou pendente.

### WIP=1 forcado

A disciplina de uma tarefa por vez reduz trabalho paralelo abandonado.
Cada feature vai ate o fim ou e registrada como bloqueada com causa exata.

### Evidencia objetiva

"Funcionou" nao e suficiente. O harness exige comandos rodados, output
capturado e verificacao em tres camadas antes de marcar uma feature como
concluida.

### Auditoria e recuperacao

Decisoes, blockers e handoffs ficam registrados em arquivos. Se algo
quebrar, voce sabe quando, por que e qual era o estado anterior.

### Planejamento separado da execucao

Para tarefas complexas, o harness separa os papeis de planner, generator e
evaluator. Isso reduz o vies de auto-avaliacao.

## Contras

### Mais arquivos

O harness adiciona `feature_list.json`, `STATE.md`, `session-handoff.md`,
`sprint-contract.md` e outros. Para projetos pequenos, isso pode parecer
burocracia.

### Disciplina constante

WIP=1, verificacao em tres camadas e handoff obrigatorio exigem disciplina
em toda sessao. Pular etapas reduz o valor do harness.

### Custo de manutencao

Os arquivos de estado precisam ser mantidos atualizados. Se o `STATE.md`
ficar desatualizado, a proxima sessao comeca com informacao errada.

### Nao substitui boa engenharia

O harness garante rastreabilidade, nao qualidade de codigo. Um codigo ruim
com evidencias bonitas continua sendo codigo ruim.

### Curva inicial

A primeira sessao com harness requer aprender comandos, conceitos e o
fluxo PREVC. O investimento se paga em projetos longos, mas pode ser
excessivo para tarefas unicas.
