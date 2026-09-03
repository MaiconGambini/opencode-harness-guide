---
sidebar_position: 4
---

# WIP=1

WIP=1 means that only one atomic unit of work can be active at a time. It is
the harness's core discipline and its main safeguard against model drift.

## Cognitive constraint for language models

A model's context window behaves like a developer's working memory:

- When several objectives compete, attention shifts between scopes and
  restrictions become easier to miss.
- With WIP=1, the model works against one bounded contract and knows what it may
  touch and how completion will be proved.

## With versus without WIP=1

| With WIP=1 | Without WIP=1 |
|---|---|
| One feature is completed with real evidence | Many features are started and none finishes |
| Blockers are recorded with an exact cause | Blockers pile up without a record |
| Each session's scope is clear and predictable | The session jumps between tasks and creates chaotic diffs |
| Handoff describes exactly one next action | Handoff lists several vague items "in progress" |

## How it works

The `feature_list.json` keeps the state of each feature:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

Only one feature can be `in_progress`. When it finishes, it goes to `passing`
(with evidence) or `blocked` (with an exact reason).

## During execution

If you discover adjacent work during a task:

1. Add the new task as `not_started` in `feature_list.json`.
2. Keep working only on the active task.
3. The new task will be pulled in the next session.

Do not expand the scope silently. If the scope grows, stop, update the sprint
contract, and ask for approval.

## OpenCode and Oh My Pi with WIP=1

- **Shared contract:** WIP=1 limits each active unit and requires disjoint
  ownership when lanes run in parallel.
- **OpenCode:** `feature_list.json` and `progress.md` preserve the active unit
  and next action between sessions.
- **Oh My Pi:** `todo` keeps the active unit and the scheduler dispatches
  independent lanes through `tasks[]`.

Overlapping lanes must be serialized or merged. Ownership is a prompt rule, not
a lock; use worktrees when real isolation is required.

## Next step

See [Evidence and Handoff](./evidence-and-handoff) to understand what counts as
completion.
