---
sidebar_position: 2
---

# Pros and Cons

An honest assessment of what the harness delivers and what it costs. No tool
is free: the harness trades bureaucracy for traceability and continuity.

## Pros

### Continuity between sessions

You open OpenCode tomorrow and it knows exactly what you were doing. You do
not need to re-explain the context, re-read files, or guess what was left
pending. The handoff carries the state from one session to the next.

### Enforced WIP=1

The discipline of one task at a time reduces abandoned parallel work. Each
feature goes all the way to the end or is recorded as blocked, with the exact
cause documented.

### Objective evidence

"It worked" is not enough. The harness requires commands run, output
captured, and three-layer verification before marking a feature as complete.

### Auditability and recovery

Decisions, blockers, and handoffs are recorded in files. If something breaks,
you know when it happened, why, and what the previous state was.

### Planning separated from execution

For complex tasks, the harness separates the planner, generator, and
evaluator roles. This reduces the self-evaluation bias, where the same agent
that wrote the code also decides it is good.

## Cons

### More files

The harness adds `feature_list.json`, `STATE.md`, `session-handoff.md`,
`sprint-contract.md`, and others. For small projects, this can feel like
unnecessary bureaucracy.

### Constant discipline

WIP=1, three-layer verification, and a mandatory handoff require discipline in
every session. Skipping steps reduces the harness's value to almost nothing.

### Maintenance cost

The state files must be kept up to date. If `STATE.md` becomes outdated, the
next session starts with wrong information — which is worse than having no
file at all.

### Does not replace good engineering

The harness guarantees traceability, not code quality. Bad code with pretty
evidence is still bad code.

### Initial learning curve

The first session with the harness requires learning commands, concepts, and
the PREVC flow. The investment pays off on long projects, but it can be
excessive for one-off tasks.
