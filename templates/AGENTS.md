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

### Quality

- Evidence means the gate report, not a description of one. Run the quality gate at `--mode local`
  before returning any lane, using the absolute global invocation in
  `~/.config/opencode/docs/harness/measured-gates.md`.
- Thresholds and this project's high-risk paths: `agent-os/quality-thresholds.json`. Change a
  threshold only with a dated reason in `agent-os/quality-decisions.md`.
- What the gate cannot see, and what escaped it before: `docs/review.md`.
- A bug fix without a regression test is not a fix.
- `unavailable` is a gap to name, never a pass.

<!-- harness-project-calibration appends this project's measured specifics below this line -->


### Core Commands

- `/harness-bootstrap` — install full harness with confirmation.
- `/harness-session-start` — start session.
- `/prevc` — plan, review, execute, validate, judge, confirm, handoff.
- `/quality` — measured gate + risk tier for the current change.
- `/harness-clean-handoff` — close session.
