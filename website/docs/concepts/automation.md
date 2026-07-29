---
sidebar_position: 6
---

# Automação: o que existe e o que não existe

O harness é honesto sobre seus limites de automação. Existem quatro níveis;
apenas os dois primeiros estão realmente ativos. Isso é intencional — o
objetivo não é tornar o agente autônomo, e sim tornar cada intervenção
rastreável, limitada e recuperável.

## Os quatro níveis

| Nível | Nome | Estado | O que faz |
|---|---|---|---|
| 1 | **Turn-based** | Ativo | O operador pede uma ação e o agente executa uma interação limitada. |
| 2 | **Goal-based** | Ativo (finalização durável adiada) | `prepare → aprovação explícita → run → awaiting_confirmation`. Não há conclusão automática de goal. |
| 3 | **Time-based** | Desabilitado | A infraestrutura tipada existe, mas nenhum schedule está configurado em `opencode.jsonc`. |
| 4 | **Proactive** | Só biblioteca (source-only) | Não registrado. Pode modelar eventos (falha de CI, achado de scanner, handoff ausente), mas não cria goals nem executa trabalho. |

## Se um schedule for habilitado no futuro

Um schedule só poderá executar report jobs registrados e **somente leitura**:

```text
security-report
context-report
status-report
retention-report
```

Esses jobs não aceitam prompt, não chamam LLM, não executam shell, não
alteram configuração e não modificam worktrees de projetos. Habilitar um
schedule exige mudança explícita de policy — com owner, job allowlisted,
período, cooldown, stop condition, budget, retenção e dry-run observável.

## O nível proactive, em detalhe

A triagem proactive existe apenas como biblioteca não registrada. Ela:

- Aceita eventos de forma estrita, aplica dedupe e budgets.
- Para risco médio, gera **apenas** uma proposta de revisão na fila.
- Para risco alto ou não confiável, registra um alerta e para.
- **Não** cria goals, não inicia PREVC, não aprova planos, não executa
  trabalho e não modifica worktree, configuração ou goal state.

## O que foi deliberadamente removido

Para preservar a regra de execução delimitada e aprovada pelo operador, o
runtime **não inclui**:

- `/loop` genérico.
- Auto-continuidade de sessão ociosa.
- Auto-conclusão de goal.
- Schedulers com jobs habilitados.
- Runtime proactive registrado.
- Prompt, shell ou LLM dentro da automação.

## Posso usar `/loop` para o agente continuar sozinho?

Não. O `/loop` genérico está fora do runtime aprovado — ele viola a regra de
execução delimitada e aprovada pelo operador.

## Próximo passo

Veja como isso se traduz na prática em [Tarefa Pequena](../guides/small-task)
e [Feature Complexa](../guides/complex-feature).
