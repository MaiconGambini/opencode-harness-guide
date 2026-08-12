---
sidebar_position: 2
---

# Prós e Contras

Uma avaliação honesta do que o harness entrega e do que ele custa.

## Prós

### Continuidade entre sessões

Você abre o OpenCode amanhã e ele sabe exatamente o que estava fazendo.
Não precisa reexplicar o contexto, reler arquivos ou adivinhar o que
ficou pendente.

### WIP=1 forçado

A disciplina de uma tarefa por vez reduz trabalho paralelo abandonado.
Cada feature vai até o fim ou é registrada como bloqueada com causa exata.

### Evidência objetiva

"Funcionou" não é suficiente. O harness exige comandos rodados, output
capturado e verificação em três camadas antes de marcar uma feature como
concluída.

### Auditoria e recuperação

Decisões, blockers e handoffs ficam registrados em arquivos. Se algo
quebrar, você sabe quando, por que e qual era o estado anterior.

### Planejamento separado da execução

Para tarefas complexas, o harness separa os papéis de planner, generator e
evaluator. Isso reduz o viés de auto-avaliação.

## Contras

### Mais arquivos

O harness adiciona `feature_list.json`, `STATE.md`, `session-handoff.md`,
`sprint-contract.md` e outros. Para projetos pequenos, isso pode parecer
burocracia.

### Disciplina constante

WIP=1, verificação em três camadas e handoff obrigatório exigem disciplina
em toda sessão. Pular etapas reduz o valor do harness.

### Custo de manutenção

Os arquivos de estado precisam ser mantidos atualizados. Se o `STATE.md`
ficar desatualizado, a próxima sessão começa com informação errada.

### Não substitui boa engenharia

O harness garante rastreabilidade, não qualidade de código. Um código ruim
com evidências bonitas continua sendo código ruim.

### Curva inicial

A primeira sessão com harness requer aprender comandos, conceitos e o
fluxo PREVC. O investimento se paga em projetos longos, mas pode ser
excessivo para tarefas únicas.
