---
sidebar_position: 1
---

# Use Cases

Scenarios where the OpenCode Harness brings the most benefit — and where it
gets in the way more than it helps.

## Multi-session projects

If you work on the same project for several days, the harness keeps each
session from starting from scratch. The handoff records exactly where you
stopped, which files were touched, and what the next action is.

**When to use:** any project with more than one development session.

## Team work

When more than one person works on the same repository, the harness makes the
state visible. The `feature_list.json` shows what is in progress and the
handoff explains decisions and blockers, preventing two developers from
reworking the same thing.

**When to use:** projects with two or more contributors using OpenCode.

## Projects with complex verification

If the project has tests, lint, typecheck, build, and verification scripts,
the harness automates running these commands as gates before declaring
completion. Nothing is marked as `passing` without the verification battery
having run and the output having been captured.

**When to use:** projects with CI/CD or multiple verification commands.

## Ambiguous or long features

For features that take more than 30 minutes or have non-trivial design
decisions, the harness separates planning, execution, and evaluation into
distinct roles. This keeps the agent from judging its own work without
objective criteria.

**When to use:** multi-component features, refactors, and integrations.

## When NOT to use

- One-off two-minute tasks in a new project.
- Exploratory sessions where you are just reading code.
- Projects where you are the only contributor and do not need a handoff.
- When the extra WIP=1 and three-layer verification discipline gets in the
  way more than it helps.
