---
sidebar_position: 1
---

# Commands

Global commands available in OpenCode after installing the harness.

## Session

| Command | When to use | What it does |
|---|---|---|
| `/harness-session-start` | Start of every session | Reads state, handoff, feature list, checks baseline, declares the active task |
| `/harness-clean-handoff` | End of every session | Records evidence, blockers, next action and shows git status |

## Project

| Command | When to use | What it does |
|---|---|---|
| `/harness-init` | First time in the project | Audits without writing; produces a gap report |
| `/harness-bootstrap` | Install the full package | Proposes the full harness with confirmation and detects the stack |

## Work

| Command | When to use | What it does |
|---|---|---|
| `/prevc` | Any significant work | Controls the lifecycle: plan, review, execute, validate, judge, confirm, handoff |
| `/prevc run` | Ad-hoc work, after approval | Authorizes the Execute phase. In [auto mode](../guides/parallel-dispatch) (running a named plan) it is not needed — the instruction already authorizes |
| `/plan` | Create a plan (v1.1) | Planning pipeline: size-gated `wayfinder`, `grill-with-docs` in AUTO, `to-tickets` = lane table. Stops at `awaiting_plan_approval`. See [how plans are made](../guides/planning-pipeline) |
| `/harness-standards` | Before planning | Detects the stack and lists relevant standards and skills |
| `/harness-spec` | Medium/large feature | Creates an Agent OS spec in `agent-os/specs/` |
| `/shape-spec` | Manual escape hatch | Heavy Agent OS flow. Prefer `/plan` for the default path |

## Security and diagnostics

| Command | When to use | What it does |
|---|---|---|
| `/harness-security-scan` | Audit the security surface | Scans for secrets, supply-chain, permissions |
| `/harness-status` | Check readiness | Git, PREVC, goal, handoff, context |
| `/harness-context-budget` | Audit context load | Skills, plugins, commands, MCPs |
