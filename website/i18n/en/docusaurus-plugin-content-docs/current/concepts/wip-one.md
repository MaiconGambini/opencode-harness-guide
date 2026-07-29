---
sidebar_position: 4
---

# WIP=1

WIP=1 means that only one unit of work can be active at a time.
It is the core discipline of the harness.

## Why WIP=1?

| With WIP=1 | Without WIP=1 |
|---|---|
| One feature is completed at a time | Many features are started and none finishes |
| Blockers are recorded with an exact cause | Blockers pile up without a record |
| Each session's scope is clear | The session jumps between tasks |
| Handoff describes exactly one next action | Handoff lists several things "in progress" |

## How it works

The `feature_list.json` keeps the state of each feature:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

- Only one feature can be `in_progress`.
- When it finishes, it goes to `passing` (with evidence) or `blocked` (with an exact reason).

## During execution

If you discover adjacent work during a task:

1. Add the new task as `not_started` in `feature_list.json`.
2. Keep working only on the active task.
3. The new task will be pulled in the next session.

Do not expand the scope silently. If the scope grows, stop, update the
sprint contract, and ask for approval.

## Next step

See [Evidence and Handoff](./evidence-and-handoff) — how a task is proven and
carried over to the next session.
