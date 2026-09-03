---
sidebar_position: 5
---

# Parallel dispatch

Runs a plan's tasks in parallel agents, each with its own role, under PREVC
lifecycle control. OpenCode implements this flow with its background and
parallelism flags; Oh My Pi provides a native parallel-dispatch engine. The
ownership and evidence contract is shared.

## When to use

- Plans with **independent lanes** — disjoint files and no sequential dependency.
- Multi-component work where distinct parts can advance together, such as
  authorization and persistence layers.

**Do not use it for:** strictly serial WIP=1 plans, lanes touching the same file,
or one-file features. In those cases scheduler overhead does not pay off; use the
[complex-feature flow](./complex-feature) or [small-task flow](./small-task).

## Prerequisites

True parallel dispatch depends on two experimental OpenCode flags. Without them,
subagents run **serially**:

```
OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
OPENCODE_EXPERIMENTAL_PARALLEL=true
```

The `scripts/start-parallel.ps1` script sets both and opens the session in
`spec-lead`:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# options: -Port 4097   -Dir "C:\other\project"
```

## Agents

Each agent's role and permission are defined in `opencode.jsonc`. Models may vary
with configuration and provider availability; this documentation does not fix a
provider or variant as a contract requirement.

| Agent | Role | Configuration | Edits? |
|---|---|---|---|
| `spec-lead` | Scheduler and planning | `opencode.jsonc` | no |
| `explorer` | Read-only reconnaissance | `opencode.jsonc` | no |
| `fixer` | Scoped lane implementation | `opencode.jsonc` | yes |
| `code-reviewer` | Independent evaluation | `opencode.jsonc` | no |
| `test-automation-engineer` | Testing | `opencode.jsonc` | yes |

:::warning Background permissions
Background subagents use only `allow`/`deny`, never `ask`. An `ask` permission
would leave a lane waiting for an approval nobody can see. Per-agent permission
overrides the global plugin setting.
:::

## Auto mode (the default for running a plan)

An instruction to execute a named plan end to end **is** run authorization. It
does not need `/prevc run` or approval in the middle.

```
1. start-parallel.ps1                     -> opens in spec-lead
2. "Execute all tasks in plan <path> ..." -> authorizes the full run
   -> plans lane tables, executes everything, stops ONCE at the end
3. (at the end) awaiting_confirmation      -> you review and confirm
```

:::tip Runs from the prompt to the end
The autonomous run stops once at `awaiting_confirmation` for the whole spec. It
interrupts only for a real blocker: operator/live work, a scope change,
push/deploy, or an unrecoverable validation failure.
:::

## Manual mode (ad hoc work)

When you have **not** provided a named-plan instruction, the normal gate applies:

```
1. start-parallel.ps1  -> opens in spec-lead
2. request the work    -> proposes a plan, stops at awaiting_plan_approval
3. "approved"          -> signals approval
4. /prevc run          -> authorizes Execute
```

:::note Why `/prevc run` in manual mode
PREVC is not a process that keeps running. Without a named-plan instruction,
no one has authorized the run, so `spec-lead` waits. `/prevc run` is the
authorization. In auto mode, the instruction itself authorizes the run.
:::

## Ready-to-use recipe (copy and paste)

**1. Open the session** in the project directory:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# second project at the same time: -Port 4097 -Dir "C:\other\project"
```

**2. Pass the plan** — replace only the path. The instruction authorizes the
entire run and stops once at `awaiting_confirmation`:

```text
Execute all tasks in plan agent-os/specs/<PLAN-FOLDER> end to end under PREVC —
this authorizes a full autonomous run.
Propose a lane table per phase; parallelize independent lanes,
serialize lanes sharing a file. Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel
over the diff; both must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

**3. Confirm at the end** — when the plan finishes, it stops at
`awaiting_confirmation` with changed files and evidence. Review and confirm.

:::tip Plans with operator or live gates
If a plan requires a physical machine, credential, or real traffic, the
autonomous run stops at the first gate and reports `blocked`. To be explicit:

```text
Execute only the agent-implementable tasks in plan <path> under PREVC,
and STOP at <Task N> (operator/live).
```

A plan without such gates runs without stopping. Use the reviewer pair specified
by the spec; if it does not specify one, use `code-reviewer` and
`architecture-reviewer`.
:::

## The lane table

Before dispatching, `spec-lead` builds a lane table. Each lane declares file
ownership — **one write-capable lane per file at a time**.

```
┌──────┬─────────────────────────┬──────────────────────────┬──────┬──────────────┐
│ Lane │ Objective               │ Ownership (files)        │ Dep  │ Capability   │
├──────┼─────────────────────────┼──────────────────────────┼──────┼──────────────┤
│ L1   │ Authorization layer     │ authorization/, routes/  │ —    │ fixer        │
│ L2   │ Persistence layer       │ area_bindings/sql_*.py   │ —    │ fixer        │
│ L3   │ L1+L2 tests             │ tests/...                │ L1,2 │ test-eng     │
└──────┴─────────────────────────┴──────────────────────────┴──────┴──────────────┘
```

Overlapping ownership means lanes are **not** independent: serialize or merge
them. Ownership is a prompt rule, not a lock; two lanes on the same file silently
overwrite one another.

## Practical example: Refactoring four modules and sharding tests

### 1. Concurrent dispatch through the scheduler

`spec-lead` dispatches four independent lanes in parallel, each with strict
ownership of its file directory:

```text
Lane 1 (Auth):          fixer -> src/auth/schemas.py, tests/test_auth.py
Lane 2 (Billing):       fixer -> src/billing/schemas.py, tests/test_billing.py
Lane 3 (Catalog):       fixer -> src/catalog/schemas.py, tests/test_catalog.py
Lane 4 (Notifications): fixer -> src/notifications/schemas.py, tests/test_notifications.py
```

### 2. Observable evidence trail

Each subagent returns its result with runtime and exit code:

```text
[Lane 1 - Auth]          completed in 31.4s -> pytest tests/test_auth.py: 42 passed (exit 0)
[Lane 2 - Billing]       completed in 32.0s -> pytest tests/test_billing.py: 38 passed (exit 0)
[Lane 3 - Catalog]       completed in 29.8s -> pytest tests/test_catalog.py: 55 passed (exit 0)
[Lane 4 - Notifications] completed in 30.5s -> pytest tests/test_notifications.py: 27 passed (exit 0)
Tree reconciliation: 4 lanes merged with 0 file conflicts.
Full gate over the reconciled tree: PASS in 4.2s.
```

### 3. Illustrative example, not performance evidence

The numbers below are didactic. They show how to calculate wall-clock in a
hypothetical scenario; they are not measurements of this project and do not
support a performance promise.

| Metric | Sequential execution | Parallel dispatch (4 lanes) |
|---|---:|---:|
| Shard 1 (Auth) | 32.0 s | 31.4 s |
| Shard 2 (Billing) | 32.0 s | 32.0 s |
| Shard 3 (Catalog) | 32.0 s | 29.8 s |
| Shard 4 (Notifications) | 32.0 s | 30.5 s |
| Coordination overhead | 0.0 s | 0.0 s |
| **Total wall-clock** | **128.0 s** | **32.0 s** |

```text
Reduction = (T_sequential - T_parallel) / T_sequential
          = (128.0s - 32.0s) / 128.0s
          = 75.0%
```

The 75.0% comes exclusively from the table's artificial assumptions. To claim a
real gain, publish reproducible measurements, environment, run count, and
variability; this example is not performance evidence.

## Watch a worker live

`task_status` returns only `running | completed | cancelled`, with no partial
output. To watch a lane, open another terminal and attach to the child session:

```powershell
opencode session list
opencode attach http://127.0.0.1:4096 --session <childId>
```

## Run two projects at once

Each OpenCode server occupies a port. For a second project, use another port and
directory:

```powershell
# project A
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1" -Port 4096 -Dir "C:\project-a"
# project B
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1" -Port 4097 -Dir "C:\project-b"
```

| Scenario | Safe? |
|---|---|
| 2 sessions, different projects, different ports | yes |
| 2 sessions, same project, different worktrees | yes |
| 2 sessions, **same folder** | no — file collision; schedulers do not share ownership |

Two schedulers mean 2x background subagents and 2x provider load. A dense plan
can saturate alone; two may hit a rate limit without going faster.

## Known limits

- Without the environment flags, dispatch is **serial** — always use the script.
- `--yolo` / `--auto` **do not speed this up**: they remove permission prompts,
  not PREVC conversational gates. They also auto-approve the lane table and lose
  ownership control. Avoid them for production plans.
- `Ctrl+C` in `spec-lead` does **not** kill background children.
- File ownership is a prompt rule, not a lock; for real isolation between
  colliding lanes, use [Git worktrees](./portability).
