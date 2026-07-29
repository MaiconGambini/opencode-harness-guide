---
name: harness-session-start
description: Generic harness session start. Use at session start to discover instructions, state, task, startup command, and declare active work without repo-specific assumptions.
---

# Harness Session Start

Run at session start. Stop at first hard failure.

## Startup Sequence

1. Read root instructions if present: `AGENTS.md`, `CLAUDE.md`, then `README.md`.
2. Locate progress state in priority order:
   - `.specs/project/STATE.md`
   - `docs/harness/progress.md`
   - `agent-progress.md`
   - none → recommend `/harness-init`.
3. Locate feature state:
   - `feature_list.json`
   - `.specs/features/*/tasks.md`
   - none → use session todo only and recommend state creation.
4. Read handoff if present: `docs/harness/session-handoff.md`.
5. Locate startup command with `harness-startup-path`:
   - `init.ps1`, `init.sh`, `make check`, package script, or documented command.
6. Run the discovered startup command if safe and present. If it fails, record exact error in the progress file when one exists, then stop.
7. Run `git log --oneline -3` when inside a git repo.
8. Select exactly one active task if durable feature state exists. If none exists, declare no durable active task.

## Output

State exactly:

`Active task: [feat-id or session-only] — [title]. AC: [observable criteria].`

If no durable task exists, state:

`Active task: session-only — [objective]. AC: [observable criteria]. Recommended: run /harness-init to create state.`

## Abort Conditions

- Startup command fails.
- Progress or feature state exists but is unreadable.
- More than one task is `in_progress`.

Do not assume `init.ps1`, `feature_list.json`, or `.specs/project/STATE.md` exist.
