## Harness

Read this first. These rules apply to every session.

### Session Start

Invoke `harness-session-start` before feature work. It discovers instructions, progress state, feature state, handoff, startup path, recent commits, and declares exactly one active task.

### Session End

Invoke `harness-clean-handoff` before closing. Record verification, blockers, next action, and git status.

### Development Rules

- WIP=1.
- Plan before editing.
- Use standards from `agent-os/standards/`.
- Use `agent-os/specs/` for meaningful work.
- Completion requires evidence, not confidence.
- Secrets stay server-only.

### Core Commands

- `/harness-bootstrap` — install full harness with confirmation.
- `/harness-session-start` — start session.
- `/prevc` — plan, review, execute, validate, judge, confirm, handoff.
- `/harness-clean-handoff` — close session.
