# Quality Decisions

Append-only log of every change to `agent-os/quality-thresholds.json`. One dated line per
change, with the reason.

**The gate reads this file.** Lowering a threshold with no new entry here fails the gate
regardless of mode — that is the guard against the ritual of raising the ceiling until the
number stops meaning anything.

Format:

```
- YYYY-MM-DD — <metric>: <old> -> <new>. Reason: <why>. Ratchet-back plan: <when this returns>.
```

Rules:

- A **loosening** (lower `min`, higher `max`) requires a reason a reviewer can argue with.
  "Failing CI" is not a reason; "the mutation adapter cannot see the generated client, tracked
  in #123" is.
- A **tightening** may be recorded in one line with no justification — ratcheting up is the
  intended direction.
- A phase change (`A` -> `B` -> `C`) gets an entry naming the baselines it was set from.
- Never edit or delete a past line. The history is the evidence.

## Log

- (no entries yet — this project is at Phase A, observing)
