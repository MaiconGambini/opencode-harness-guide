---
sidebar_position: 5
---

# Evidence and Handoff

The harness requires that every completion has evidence — "it worked on my
machine" is not enough.

## Verification layers

Before declaring a feature complete, three layers are verified:

| Layer | What it verifies |
|---|---|
| **Static** | typecheck and lint pass. |
| **Runtime** | the sprint contract's acceptance criteria are observable, commands were run, and the output was recorded. |
| **System** | the project's verification command exits with code 0, and `feature_list.json` and `STATE.md` reflect the new state. |

Concrete examples by layer:

- **Layer 1 (static):** `typecheck`, `lint`, `format check`, a diff with no
  conflicts or invalid whitespace.
- **Layer 2 (behavior):** unit or integration test for the changed case, an
  HTTP request that proves the AC, a browser flow for a UI change, an
  application command with the expected output.
- **Layer 3 (system/regression):** the project's build or startup path, the
  applicable regression suite, logs/health check, updated state and handoff.

If a layer is not run, that must appear as an **evidence limitation**. Do not
replace an unexecuted command with an optimistic sentence.

## Judge

The Judge compares result, scope, and evidence against the approved spec or
contract. It can **approve, request a revision, or block** — and it should not
be produced in the same step as the implementation when an independent review
is required.

| Dimension | Question |
|---|---|
| **Correctness** | Does the behavior meet the acceptance criteria? |
| **Evidence** | Does the result have observable proof? |
| **Scope** | Were only approved files and behaviors changed? |
| **Security** | Did a new permission, secret, or risk surface appear? |
| **Maintenance** | Does the change follow existing patterns? |
| **Handoff** | Can another session continue without guessing? |

## Evidence example

```json
{
  "id": "feat-005",
  "status": "passing",
  "evidence": "curl /api/health -> 200 OK, ruff check: OK, pytest: 23 passed, init.ps1: ambos stacks OK"
}
```

The evidence contains real output, not a description of what should happen.

## Handoff

Every session ends with `harness-clean-handoff`. It fills in:

| Field | Content |
|---|---|
| **Verified Now** | what was completed in this session. |
| **Changed** | modified files. |
| **Broken** | what broke (if anything broke). |
| **Next Best Step** | the single next action. |

If the work did not finish, the handoff is still produced — the feature goes to
`blocked` with the exact cause, and the `Next Best Step` says exactly what to do.

## Why this is better (with a result)

The context window is finite. Near the limit, the agent rushes and the
decisions and "whys" vanish in the next session — causing rework and silent
drift from requirements. A persisted handoff (state + decisions + commit as a
checkpoint) rebuilds context in minutes.

**Result** (*Learn Harness Engineering* study): without persistence, session 2
spent **15 min** rebuilding context and delivered **7 of 12** features with 43%
hidden defects. With persistence: rebuild dropped to **3 min** (**-78%**), **12
of 12** features complete, and only 8% defects.

## Next step

See [Automation](./automation) — what the harness automates and, more
importantly, what it deliberately does not.
