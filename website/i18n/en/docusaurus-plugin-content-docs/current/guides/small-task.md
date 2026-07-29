---
sidebar_position: 1
---

# Small Task

This guide shows the flow for tasks with obvious scope and up to 3 files.

## When to use fast mode

Use it when the prompt has:

- A clear sentence.
- Obvious scope (1-3 files).
- No design ambiguity.

## Example

**Prompt:** `Add a GET /api/health endpoint`

**Flow:**

1. `/harness-session-start` — reads the current state, declares the active task.

2. `/prevc Add a GET /api/health endpoint`
   - Plan: scope (1 file), AC (`curl returns 200`), non-goals.
   - Operator approval: "yes".

3. Execute — creates the file with the endpoint.

4. Validate:
   - Ruff check: OK.
   - Pytest: OK.
   - init.ps1: both stacks OK.
   - Curl /api/health: returns the expected payload.

5. Confirm — the feature moves to `passing` with evidence.

6. Handoff — `session-handoff.md` records the completion.

**Time:** ~2-5 minutes. **Skills used:** 4 (session-start, wip-control,
termination-check, clean-handoff).

## What NOT to do

- Do not skip verification. Even a 2-minute task needs evidence.
- Do not expand the scope. If you realize you need more, stop, plan
  again, and ask for approval.
