---
name: harness-termination-check
description: Generic three-layer Done check before claiming completion or setting any task to passing. Uses discovered verification and durable evidence.
---

# Harness Termination Check

Run before saying "done", "complete", or setting any durable status to `passing`.

## Layer 1 — Static

- [ ] Static checks from sprint contract or discovered stack pass.
- [ ] Lint/typecheck commands are either run or explicitly not applicable.
- [ ] No new warnings vs baseline.

## Layer 2 — Runtime Behavior

- [ ] Acceptance criteria from sprint contract are observable, not assumed.
- [ ] Commands were run and output recorded, not inferred or remembered.
- [ ] Regression checks for previously passing work were run or scoped out with reason.

## Layer 3 — System Confirmation

- [ ] Startup command from `harness-startup-path` exits 0 or skipped reason is recorded.
- [ ] Feature state/progress state answer what changed for a new session.
- [ ] Evidence contains actual command output, not a description.

## Fail Protocol

If any layer fails:

1. Record exact failure: command, exit code, and output.
2. Set task to `blocked` in the available feature state with reason.
3. Document in the available progress file Blockers.
4. Do not claim done. Do not write completed handoff.
