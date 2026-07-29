---
name: prevc-workflow
description: PREVC lifecycle guidance. Use for planning, approved-plan execution, evidence-based validation, Judge review, operator confirmation, and handoff.
---

# PREVC Workflow

PREVC is the sole lifecycle owner:

```text
prepare -> awaiting_plan_approval -> approved run
-> review -> execute -> validate -> judge
-> awaiting_confirmation -> confirm | revise | abort -> handoff
```

`/goal` owns objective, requirements, and evidence links. Agents and skills are
bounded capabilities; they cannot transition lifecycle state, approve evidence, or
self-confirm completion.

## Prepare

Discover only relevant instructions, state, specs, standards, Judge profiles, and
startup or verification paths. Classify risk as `low`, `medium`, `high`, or
`untrusted`. Produce a reviewable plan with scope, non-goals, acceptance criteria,
files or boundaries affected, validation, rollback notes, and execution budgets.

Stop at `awaiting_plan_approval`. Do not edit before explicit operator approval.

- `low`: proportional plan and fresh objective evidence.
- `medium`: plan, review, declared validation, and context/security evidence or a
  documented skip.
- `high` and `untrusted`: full gates, explicit risk acknowledgement, constrained
  permissions, and rollback considerations before execution.

Use `spec-lead` only for planning/specification input. PREVC retains the plan,
approval, and lifecycle decisions.

## Run

`/prevc run <goal-id>` is valid only when PREVC has recorded explicit approval for
the current plan. Execute only the approved scope and declared permissions, files,
checks, retries, tool, and duration budgets.

A run may automate:

```text
Review -> Execute -> Validate -> Judge
```

Stop immediately as `blocked` or `needs_input` on failed validation, missing
evidence, ambiguity, scope change, permission escalation, or exhausted budget. Do
not start an open-ended repair loop.

After Judge, always transition to `awaiting_confirmation`, including low-risk PREVC
work. Present changed files, a diff summary, validation evidence, Judge verdict,
residual risks, and rollback information for operator review.

## Confirm And Handoff

Only the operator may confirm, request revision, or abort from
`awaiting_confirmation`. Confirmation records the outcome and invokes
`harness-clean-handoff`. Revision returns to planning or review as appropriate.
Abort records the reason and performs no further work.

Commits, pushes, deployments, branch changes, remote Git operations, and permission
elevation are never automatic. Low-risk non-PREVC operational checks may auto-complete
only through their separate, objective evidence policy.

## Current Implementation Boundary

Tasks 3 and 5 are intentionally separated. This skill establishes the lifecycle
contract now; Task 5 adds durable `/goal` states and enforcement for
`awaiting_plan_approval` and `awaiting_confirmation`.
