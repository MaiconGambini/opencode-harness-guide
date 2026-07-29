---
name: harness-clean-handoff
description: Generic harness clean handoff. Use before ending a session to update evidence, progress, handoff, run discovered verification, and show git status.
---

# Harness Clean Handoff

Run before closing a session. Incomplete work still needs handoff.

## Exit Checklist

1. Identify active task from `feature_list.json`, `.specs/features/*/tasks.md`, or session todo.
2. Update feature state if it exists:
   - `passing` requires actual evidence.
   - `blocked` requires exact blocker reason.
   - incomplete work remains `in_progress` or `blocked`.
3. Update progress file if it exists:
   - `.specs/project/STATE.md`
   - `docs/harness/progress.md`
   - `agent-progress.md`
4. Create or update `docs/harness/session-handoff.md` when a harness docs folder exists or user approves creating it.
5. Run discovered startup verification from `harness-startup-path`. If skipped, record why.
6. Run `git status` in git repos.

## Handoff Sections

Use these headings:

- `## Verified Now`
- `## Changed This Session`
- `## Broken Or Unverified`
- `## Decisions Made`
- `## Next Best Step`
- `## Commands`

## Rules

- Do not claim done if verification failed or was skipped without reason.
- Do not require `.specs/project/STATE.md`; use alternate progress files.
- Do not require `init.ps1`; use the discovered startup command.
- Never delete files during handoff.
