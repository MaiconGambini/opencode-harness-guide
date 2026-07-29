---
name: harness-clean-handoff
description: Generic harness clean handoff. Use before ending a session to update evidence, progress, handoff, run discovered verification, and show git status.
---

# Harness Clean Handoff

Run before closing a session. Incomplete work still needs handoff.

## Exit Checklist

1. Identify active task from `feature_list.json`, `.specs/features/*/tasks.md`, or session todo.
2. Collect actual evidence, blockers, and next steps. Suggest a status transition to
   PREVC, but do not write `passing`, `blocked`, or any lifecycle status.
3. Prepare progress notes for `.specs/project/STATE.md`, `docs/harness/progress.md`,
   or `agent-progress.md` when present. PREVC decides whether and how to persist
   lifecycle status.
4. Create or update `docs/harness/session-handoff.md` when a harness docs folder
   exists or the user approves creating it.
5. Run discovered startup verification only when PREVC includes it in the approved
   handoff scope. If skipped, record why.
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

- Invoke this as a PREVC handoff subroutine after PREVC and the operator determine
  the lifecycle outcome.
- Do not transition lifecycle state, accept evidence, or declare completion. PREVC
  owns those decisions.
- When invoked directly, return a handoff report only. Do not persist lifecycle
  status or infer operator confirmation.
- Do not claim done if verification failed or was skipped without reason.
- Do not require `.specs/project/STATE.md`; use alternate progress files.
- Do not require `init.ps1`; use the discovered startup command.
- Never delete files during handoff.
