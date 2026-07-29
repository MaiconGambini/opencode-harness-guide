---
sidebar_position: 3
---

# Artifacts

Files the harness reads and writes during the lifecycle.

## State

| File | Path | Purpose |
|---|---|---|
| `AGENTS.md` | root | Project rules, entry points |
| `feature_list.json` | root | Source of truth for WIP=1 |
| `STATE.md` | `.specs/project/` | Durable progress, blockers, decisions |
| `session-handoff.md` | `docs/harness/` | Handoff between sessions |
| `sprint-contract.md` | `docs/harness/` | Scope, AC, verification plan |

## Feature list

Each feature in `feature_list.json` has 9 fields:

| Field | Description |
|---|---|
| `id` | Unique identifier |
| `priority` | Execution order |
| `area` | Project area |
| `title` | Short name |
| `user_visible_behavior` | What the user/agent sees when it works |
| `dependencies` | IDs of features that must be completed first |
| `status` | `not_started`, `in_progress`, `passing`, or `blocked` |
| `verification` | Command that proves it works |
| `evidence` | Real output captured after verification |
| `notes` | Additional information |

## Status rules

- Only ONE feature `in_progress` at a time.
- `passing` requires `evidence` filled with real output.
- `blocked` requires the exact cause in the `evidence` field.
- No feature `in_progress` with unresolved dependencies.
