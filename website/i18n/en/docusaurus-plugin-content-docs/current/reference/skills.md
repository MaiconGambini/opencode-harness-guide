---
sidebar_position: 2
---

# Skills

Skills are `SKILL.md` files that OpenCode loads when needed. Each skill
solves a specific class of problem in the workflow.

## Session skills

| Skill | When it runs | What it does |
|---|---|---|
| `harness-session-start` | Start of every session | Discovers instructions, state, active task |
| `harness-clean-handoff` | End of every session | Closes state with evidence and handoff |

## Planning skills

| Skill | When to use | What it does |
|---|---|---|
| `harness-wip-control` | Before a multi-step prompt | Decomposes into WIP=1, defines AC, records non-goals |
| `harness-initializer` | First time in the project | Non-mutating audit of the 5 layers |

## Verification skills

| Skill | When to use | What it does |
|---|---|---|
| `harness-termination-check` | Before declaring "done" | 3-layer check: static -> runtime -> system |
| `harness-feature-state` | Before Execute | Audits feature_list.json |
| `harness-readable-workspace` | Session does not orient | Fresh-session test, maps gaps |
| `harness-context-layer` | Inconsistent decisions | Audits ARCHITECTURE, PRODUCT, RELIABILITY |

## Quality skills

| Skill | When to use | What it does |
|---|---|---|
| `harness-evaluator-rubric` | Before Judge | Builds a task-specific rubric |
| `harness-role-separation` | Complex/UI tasks | Planner -> Generator -> Evaluator |
| `harness-continuity` | Multi-session work | WIP=1 state machine, blocked protocol |

Additional skills (security, MCP, worktree, etc.) are available in the
repository but are not needed for the basic flow.
