---
sidebar_position: 1
---

# Small Task

This guide shows the flow for tasks with obvious scope and up to three files. It
is the shortest path in the harness: no sprint contract, no decomposition into
subtasks, but still with mandatory verification and handoff.

## When to use fast mode

Use fast mode when the prompt has, all at once:

- A clear sentence and a single intent.
- Obvious scope, typically one to three files.
- No design ambiguity to resolve before starting.

If any of these points fails — the prompt asks for several things, you don't
know which files to touch, or there is a pending architecture decision — stop and
go to the [Complex Feature](./complex-feature.md) guide.

## Step-by-step flow

The example below covers a real end-to-end task.

**Prompt:** `Add a GET /api/health endpoint`

### 1. Open the session

```text
/harness-session-start
```

- Reads the current project state (`STATE.md`, `feature_list.json`).
- Declares which task is active and confirms that WIP is at 1.
- Runs the baseline verification to ensure the project is healthy
  before any change.

### 2. Plan with PREVC

```text
/prevc Add a GET /api/health endpoint
```

- **Plan** — defines the scope (one file), the acceptance criteria (`curl`
  returns `200`), and the non-goals (no authentication, metrics, or database).
- **Operator approval** — the harness presents the plan and waits for your "yes"
  before touching any file.

A good plan for a small task fits in a few lines. If the plan starts
to grow, that's a sign the task wasn't small.

### 3. Execute

- Creates the file with the endpoint and nothing else.
- Keeps the change within the approved scope.

### 4. Validate

Validation is mandatory even for two-minute tasks. Each command is
run and its output is captured as evidence:

```text
ruff check .
pytest
./init.ps1
curl http://localhost:8000/api/health
```

- **Ruff check** — no lint errors.
- **Pytest** — all tests pass.
- **init.ps1** — both stacks come up without errors.
- **Curl `/api/health`** — returns the expected payload with status `200`.

### 5. Confirm

- The feature moves to the `passing` state, accompanied by the evidence collected
  in the previous step.
- Without evidence, there is no confirmation.

### 6. Handoff

```text
/harness-clean-handoff
```

- The `session-handoff.md` records the completion, the files touched, and the
  verification result.

## Summary

**Typical time:** about 2 to 5 minutes.
**Skills used:** 4 — `session-start`, `wip-control`, `termination-check`, and
`clean-handoff`.

## What NOT to do

- **Do not skip verification.** Even a two-minute task needs objective
  evidence. "It seems to work" is not evidence.
- **Do not expand the scope midway.** If you realize the task is
  larger than it seemed, stop, plan again, and ask for new approval. Adjacent
  work discovered becomes a next task, never a silent extension
  of the active task.
- **Do not leave the handoff for later.** The handoff is what lets you resume
  the context on another day — skipping it means losing continuity.
