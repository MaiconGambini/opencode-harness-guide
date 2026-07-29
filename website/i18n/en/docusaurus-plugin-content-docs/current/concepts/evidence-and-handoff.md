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
