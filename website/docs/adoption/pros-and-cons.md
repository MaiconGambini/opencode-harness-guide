---
sidebar_position: 2
---

# Prós e Contras

Uma avaliação honesta do que o harness entrega e do que ele custa. Nenhuma
ferramenta é gratuita: o harness troca burocracia por rastreabilidade e
continuidade.

## Prós

### Continuidade entre sessões

Você abre o OpenCode amanhã e ele sabe exatamente o que estava fazendo. Não
precisa reexplicar o contexto, reler arquivos ou adivinhar o que ficou
pendente. O handoff carrega o estado de uma sessão para a próxima.

### WIP=1 forçado

A disciplina de uma tarefa por vez reduz trabalho paralelo abandonado. Cada
feature vai até o fim ou é registrada como bloqueada, com a causa exata
documentada.

### Evidência objetiva

"Funcionou" não é suficiente. O harness exige comandos rodados, output
capturado e verificação em três camadas antes de marcar uma feature como
concluída.

### Auditoria e recuperação

Decisões, blockers e handoffs ficam registrados em arquivos. Se algo quebrar,
você sabe quando aconteceu, por quê e qual era o estado anterior.

### Planejamento separado da execução

Para tarefas complexas, o harness separa os papéis de planner, generator e
evaluator. Isso reduz o viés de auto-avaliação, em que o mesmo agente que
escreveu o código também decide que ele está bom.

## Contras

### Mais arquivos

O harness adiciona `feature_list.json`, `STATE.md`, `session-handoff.md`,
`sprint-contract.md` e outros. Para projetos pequenos, isso pode parecer
burocracia desnecessária.

### Disciplina constante

WIP=1, verificação em três camadas e handoff obrigatório exigem disciplina em
toda sessão. Pular etapas reduz o valor do harness a quase nada.

### Custo de manutenção

Os arquivos de estado precisam ser mantidos atualizados. Se o `STATE.md`
ficar desatualizado, a próxima sessão começa com informação errada — o que é
pior do que não ter arquivo nenhum.

### Não substitui boa engenharia

O harness garante rastreabilidade, não qualidade de código. Um código ruim
com evidências bonitas continua sendo código ruim.

### Curva inicial

A primeira sessão com harness exige aprender comandos, conceitos e o fluxo
PREVC. O investimento se paga em projetos longos, mas pode ser excessivo para
tarefas únicas.
