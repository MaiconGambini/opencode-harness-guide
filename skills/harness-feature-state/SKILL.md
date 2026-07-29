---
name: harness-feature-state
description: Normalize feature state across feature_list.json and Markdown task files. Enforce WIP=1, evidence for passing, and blocker reasons.
---

# Harness Feature State

Use to create, update, or audit durable task state.

## State Priority

1. `feature_list.json`
2. `.specs/features/*/tasks.md`
3. Create `feature_list.json` only after user approval.

## Required Schema

Every feature must have all fields:

```json
{
  "id": "feat-001",
  "priority": 1,
  "area": "harness",
  "title": "Short feature name",
  "user_visible_behavior": "What should happen when this works, from agent/user perspective",
  "dependencies": [],
  "status": "not_started",
  "verification": "Command or steps that prove it works",
  "evidence": "Actual output captured after passing verification",
  "notes": ""
}
```

## Status Rules

- `not_started` — not yet worked on
- `in_progress` — exactly ONE feature at a time. Two `in_progress` = harness violation.
- `blocked` — requires non-empty `evidence` field with exact blocker reason
- `passing` — requires non-empty `evidence` field with actual command output

## Audit Checklist

Run before any Execute phase:

- [ ] All features have all required fields (no missing keys)
- [ ] Exactly one feature/task is `in_progress` across JSON and Markdown sources
- [ ] All `passing` features have non-empty `evidence`
- [ ] All `blocked` features have non-empty `evidence` (the blocker reason)
- [ ] `dependencies` are respected — no `in_progress` feature has unresolved deps

## Markdown Task Support

For `.specs/features/*/tasks.md`, detect task rows or checklists with statuses such as `not_started`, `in_progress`, `blocked`, and `passing`.

If Markdown format is ambiguous, report the ambiguity and propose normalizing to `feature_list.json`. Do not rewrite without approval.

## Add Feature

When adding a new feature:
1. Assign next `id` in sequence.
2. Set `priority` — lower number = higher priority.
3. Set `area` — matches product/system area (e.g., `harness`, `backend`, `frontend`).
4. Write `user_visible_behavior` as a sentence: "When X, the agent/user sees Y."
5. Write `verification` as a runnable command or observable check.
6. Leave `evidence` empty until verification actually runs.
7. Set `status` to `not_started`.
8. Set `dependencies` to IDs of features that must be `passing` first.

## Rules

- Never mark `passing` without actual evidence.
- Never mark `blocked` without an exact reason.
- Two active tasks is a WIP violation; resolve to WIP=1 before Execute.
