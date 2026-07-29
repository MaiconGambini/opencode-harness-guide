---
sidebar_position: 2
---

# Skills

Skills sao arquivos `SKILL.md` que o OpenCode carrega quando necessario.
Cada skill resolve uma classe especifica de problema no workflow.

## Skills de sessao

| Skill | Quando roda | O que faz |
|---|---|---|
| `harness-session-start` | Inicio de toda sessao | Descobre instrucoes, estado, task ativa |
| `harness-clean-handoff` | Fim de toda sessao | Fecha estado com evidencia e handoff |

## Skills de planejamento

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-wip-control` | Antes de prompt multi-step | Decompoe em WIP=1, define AC, registra non-goals |
| `harness-initializer` | Primeira vez no projeto | Auditoria nao-mutatoria das 5 camadas |

## Skills de verificacao

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-termination-check` | Antes de declarar "pronto" | 3-layer check: static -> runtime -> system |
| `harness-feature-state` | Antes do Execute | Audita feature_list.json |
| `harness-readable-workspace` | Sessao nao orienta | Fresh-session test, mapeia gaps |
| `harness-context-layer` | Decisoes inconsistentes | Audita ARCHITECTURE, PRODUCT, RELIABILITY |

## Skills de qualidade

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-evaluator-rubric` | Antes do Judge | Constroi rubrica task-specific |
| `harness-role-separation` | Tarefas complexas/UI | Planner -> Generator -> Evaluator |
| `harness-continuity` | Trabalho multi-sessao | State machine WIP=1, blocked protocol |

Skills adicionais (seguranca, MCP, worktree, etc.) estao disponiveis no
repositorio mas nao sao necessarias para o fluxo basico.
