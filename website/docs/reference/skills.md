---
sidebar_position: 2
---

# Skills

Skills são arquivos `SKILL.md` que o OpenCode carrega quando necessário.
Cada skill resolve uma classe específica de problema no workflow.

## Skills de sessão

| Skill | Quando roda | O que faz |
|---|---|---|
| `harness-session-start` | Início de toda sessão | Descobre instruções, estado, task ativa |
| `harness-clean-handoff` | Fim de toda sessão | Fecha estado com evidência e handoff |

## Skills de planejamento

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-wip-control` | Antes de prompt multi-step | Decompoe em WIP=1, define AC, registra non-goals |
| `harness-initializer` | Primeira vez no projeto | Auditoria não-mutatória das 5 camadas |

### Pipeline de planejamento (v1.1)

O caminho padrão de criar planos usa estas skills, orquestradas pelo `/plan`. Veja
[como os planos são feitos](../guides/planning-pipeline).

| Skill | Quando usar | O que faz |
|---|---|---|
| `wayfinder` | Trabalho grande/nebuloso | Mapa de decision-tickets; resolve decisões antes de decompor |
| `grill-with-docs` | Afiar o plano | Entrevista + domain-modeling. Modo AUTO: decide sozinho, rotula assumptions, escreve ADRs |
| `to-tickets` | Decompor o plano | Quebra em tracer-bullet vertical slices com blocking edges = a lane table |
| `implement` | Executar uma lane | TDD, typecheck, testes, code review. Specialist dispatched **não commita** |

## Skills de verificação

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-termination-check` | Antes de declarar "pronto" | 3-layer check: static -> runtime -> system |
| `harness-feature-state` | Antes do Execute | Audita feature_list.json |
| `harness-readable-workspace` | Sessão não orienta | Fresh-session test, mapeia gaps |
| `harness-context-layer` | Decisões inconsistentes | Audita ARCHITECTURE, PRODUCT, RELIABILITY |

## Skills de qualidade

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-evaluator-rubric` | Antes do Judge | Constroi rubrica task-specific |
| `harness-role-separation` | Tarefas complexas/UI | Planner -> Generator -> Evaluator |
| `harness-continuity` | Trabalho multi-sessão | State machine WIP=1, blocked protocol |

Skills adicionais (segurança, MCP, worktree, etc.) estão disponíveis no
repositório mas não são necessárias para o fluxo básico.
