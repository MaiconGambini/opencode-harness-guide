---
sidebar_position: 1
---

# Use Cases

Scenarios where the OpenCode Harness brings the most benefit.

## Multi-session projects

If you work on the same project for several days, the harness prevents each
session from starting from scratch. The handoff records exactly where you
stopped.

**When to use:** any project with more than one development session.

## Team work

When more than one person works on the same repository, the harness makes
the state visible. `feature_list.json` shows what is in progress, and the
handoff explains decisions and blockers.

**When to use:** projects with 2+ collaborators using OpenCode.

## Projects with complex verification

If the project has tests, lint, typecheck, build and verification scripts,
the harness automates running those commands as gates before declaring
completion.

**When to use:** projects with CI/CD or multiple verification commands.

## Ambiguous or long features

For features that take more than 30 minutes or have non-trivial design
decisions, the harness separates planning, execution and evaluation into
distinct roles. This prevents the agent from judging its own work without
objective criteria.

**When to use:** multi-component features, refactors, integrations.

## When NOT to use

- Single 2-minute tasks in a new project.
- Exploratory sessions where you are only reading code.
- Projects where you are the only contributor and do not need a handoff.
- When the additional discipline of WIP=1 and verification gets in the way
  more than it helps.
