# Harness Bootstrap

Install a full harness into any project, but only after explicit user approval.

## Full Package

Propose these files:

- `AGENTS.md`
- `feature_list.json`
- `docs/harness/progress.md`
- `docs/harness/session-handoff.md`
- `docs/harness/sprint-contract.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`
- `docs/RELIABILITY.md`
- `agent-os/judges/project-judge.md`
- `agent-os/standards/*`
- `agent-os/specs/_template/*`

## Workflow

1. Detect repo root and existing files.
2. Run `harness-stack-router` to identify stack signals.
3. Run `harness-startup-path` to find startup/verification commands.
4. Compare target files with global templates in `~/.config/opencode/templates`.
5. Print a change plan: create, merge, skip, or preserve.
6. Ask: `Apply this full harness to the current repo? yes/no`.
7. If no: stop with the plan only.
8. If yes: create missing directories, write missing files, and preserve existing files unless user approved overwrite.
9. Run discovered verification if safe.
10. End with next command: `/harness-session-start`.

## Rules

- Never write before confirmation.
- Always install the full package, not minimal modes.
- Preserve project-specific content.
- If a file exists, propose a merge instead of overwriting.
- Do not assume `init.ps1`, `feature_list.json`, or `.specs/project/STATE.md` exist.
