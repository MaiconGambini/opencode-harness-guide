---
sidebar_position: 6
---

# Automation: what exists and what does not

The harness is honest about the limits of its automation. There are four
levels; only the first two are actually active. This is intentional — the
goal is not to make the agent autonomous, but to make every intervention
traceable, bounded, and recoverable.

## The four levels

| Level | Name | State | What it does |
|---|---|---|---|
| 1 | **Turn-based** | Active | The operator requests an action and the agent runs one bounded interaction. |
| 2 | **Goal-based** | Active (durable finalization deferred) | `prepare → explicit approval → run → awaiting_confirmation`. There is no automatic goal completion. |
| 3 | **Time-based** | Disabled | The typed infrastructure exists, but no schedule is configured in `opencode.jsonc`. |
| 4 | **Proactive** | Library only (source-only) | Not registered. It can model events (CI failure, scanner finding, missing handoff), but it does not create goals or run work. |

## If a schedule is enabled in the future

A schedule will only be able to run registered, **read-only** report jobs:

```text
security-report
context-report
status-report
retention-report
```

These jobs accept no prompt, call no LLM, run no shell, change no
configuration, and modify no project worktrees. Enabling a schedule requires
an explicit policy change — with owner, allowlisted job, period, cooldown,
stop condition, budget, retention, and an observable dry-run.

## The proactive level, in detail

Proactive triage exists only as an unregistered library. It:

- Accepts events strictly, applies dedupe and budgets.
- For medium risk, generates **only** a review proposal in the queue.
- For high or untrusted risk, logs an alert and stops.
- Does **not** create goals, does not start PREVC, does not approve plans,
  does not run work, and does not modify worktree, configuration, or goal
  state.

## What was deliberately removed

To preserve the rule of bounded, operator-approved execution, the runtime
**does not include**:

- A generic `/loop`.
- Auto-continuation of an idle session.
- Automatic goal completion.
- Schedulers with jobs enabled.
- A registered proactive runtime.
- Prompt, shell, or LLM inside the automation.

## Can I use `/loop` to have the agent continue on its own?

No. The generic `/loop` is outside the approved runtime — it violates the
rule of bounded, operator-approved execution.

## Next step

See how this translates into practice in [Small Task](../guides/small-task)
and [Complex Feature](../guides/complex-feature).
