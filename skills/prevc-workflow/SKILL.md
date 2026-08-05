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

Use `spec-lead` for planning/specification input, and — after approval — as the
Execute-phase scheduler. PREVC retains the plan, approval, and lifecycle decisions.

When a plan proposes parallel execution, it must declare a lane table: lane ID,
objective, exact file ownership set, dependencies, verification command, and owning
capability. One write-capable lane owns a file at a time; lanes with intersecting
ownership sets are not independent. The lane table is reviewed before approval, not
decided at dispatch time.

## Run

`/prevc run <goal-id>` is valid only when PREVC has recorded explicit approval for
the current plan. Execute only the approved scope and declared permissions, files,
checks, retries, tool, and duration budgets.

A run may automate:

```text
Review -> Execute -> Validate -> Judge
```

During Execute of an approved plan that declared a lane table, `spec-lead` acts as the
scheduler: it dispatches independent lanes in parallel via `task(background: true)`,
polls `task_status`, and reconciles results within the approved scope, files,
permissions, and budgets. It does not transition lifecycle state; PREVC resumes at
Validate with the reconciled result.

Stop immediately as `blocked` or `needs_input` on failed validation, missing
evidence, ambiguity, scope change, permission escalation, or exhausted budget. Do
not start an open-ended repair loop.

## Autonomous Plan Run

An operator instruction to execute a named plan or spec end to end is itself the run
authorization — no separate `/prevc run`, no per-task approval. In this mode PREVC
automates every task's Review -> Execute -> Validate -> Judge to the end of the plan
and transitions to `awaiting_confirmation` **once**, for the whole spec, rather than
per task.

The autonomy is bounded — halt mid-run only for a real blocker: a task needing
operator/live action, a scope change beyond the plan, `push`/deploy/branch/worktree/
remote Git, or an unrecoverable validation failure after one bounded repair. Medium+
scope changes and high/untrusted risk acknowledgement still apply and still stop the
run when triggered.

After Judge, always transition to `awaiting_confirmation` at the end of the run (per
task for ad-hoc work; once for a full autonomous plan run). Present changed files, a
diff summary, validation evidence, Judge verdict, residual risks, and rollback
information for operator review.

## Confirm And Handoff

Only the operator may confirm, request revision, or abort from
`awaiting_confirmation`. Confirmation records the outcome and invokes
`harness-clean-handoff`. Revision returns to planning or review as appropriate.
Abort records the reason and performs no further work.

Local commits of reconciled, validated work are allowed once a run is authorized —
the scheduler may commit the approved changes with a clear message. Pushes,
deployments, branch changes, worktree creation, remote Git operations, and permission
elevation are never automatic; the operator performs or explicitly authorizes each.
Low-risk non-PREVC operational checks may auto-complete only through their separate,
objective evidence policy.

## Current Implementation Boundary

Tasks 3 and 5 are intentionally separated. This skill establishes the lifecycle
contract now; Task 5 adds durable `/goal` states and enforcement for
`awaiting_plan_approval` and `awaiting_confirmation`.
