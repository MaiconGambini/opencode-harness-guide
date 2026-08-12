---
name: prevc-workflow
description: PREVC lifecycle guidance. Use for planning, approved-plan execution, evidence-based validation, Judge review, operator confirmation, and handoff.
---

# PREVC Workflow

PREVC is the sole lifecycle owner:

```text
prepare -> awaiting_plan_approval -> approved run
-> review -> execute -> validate -> judge
-> refine -> awaiting_confirmation -> confirm | revise | abort -> handoff
```

`/goal` owns objective, requirements, and evidence links. Agents and skills are
bounded capabilities; they cannot transition lifecycle state, approve evidence, or
self-confirm completion.

## Prepare

Discover only relevant instructions, state, specs, standards, Judge profiles, and
startup or verification paths. Classify risk as `low`, `medium`, `high`, or
`untrusted`. Produce a reviewable plan with scope, non-goals, acceptance criteria,
files or boundaries affected, validation, rollback notes, and execution budgets.

Risk classification is **informed by `harness-risk-router`**, not replaced by it. Run the router
over the intended scope (or the plan's file ownership sets when no diff exists yet) and record the
tier with its reason. How the two compose:

- The router **produces** `low`, `medium`, `high` — deterministically, from high-risk path globs and
  complexity signals in the diff. A high-risk path match forces `high`.
- `untrusted` is **never computed.** It describes provenance — untrusted input, third-party or
  generated code, an external contributor — and only the operator or this phase declares it.
- The router may **raise** a declared class, never lower it. A human who said `untrusted` outranks
  a green diff.

Wiring the classification blindly to a router that only emitted `low`/`high` would make the
medium-risk evidence rule below unreachable and collapse `untrusted` into `low`.

Stop at `awaiting_plan_approval`. Do not edit before explicit operator approval.

- `low`: proportional plan and fresh objective evidence.
- `medium`: plan, review, declared validation, and context/security evidence or a
  documented skip.
- `high` and `untrusted`: full gates, explicit risk acknowledgement, constrained
  permissions, and rollback considerations before execution.

Use `spec-lead` for planning/specification input, and — after approval — as the
Execute-phase scheduler. PREVC retains the plan, approval, and lifecycle decisions.
`spec-lead` plans via the fixed pipeline (`/plan`): size-gated `/wayfinder` for large
efforts, `/grill-with-docs` in AUTO to sharpen, then `/to-tickets` to decompose. This
replaces the old `/shape-spec` path; `/shape-spec` remains only as a manual escape
hatch. Grilling runs autonomously and folds any operator questions into the single
`awaiting_plan_approval` gate — it does not add extra pauses.

When a plan proposes parallel execution, it must declare a lane table. The lane table
**is** the `/to-tickets` output: each tracer-bullet ticket is a lane, carrying lane ID
(ticket number), objective, exact file ownership set, dependencies (its blocking
edges), verification command, and owning capability. One write-capable lane owns a file
at a time; lanes with intersecting ownership sets are not independent. The ticket set
is reviewed before approval, not decided at dispatch time.

## Run

`/prevc run <goal-id>` is valid only when PREVC has recorded explicit approval for
the current plan. Execute only the approved scope and declared permissions, files,
checks, retries, tool, and duration budgets.

A run may automate:

```text
Review -> Execute -> Validate -> Judge -> Refine
```

During Execute of an approved plan that declared a lane table, `spec-lead` acts as the
scheduler: it dispatches independent lanes in parallel via `task(background: true)`,
polls `task_status`, and reconciles results within the approved scope, files,
permissions, and budgets. It does not transition lifecycle state; PREVC resumes at
Validate with the reconciled result.

Stop immediately as `blocked` or `needs_input` on failed validation, missing
evidence, ambiguity, scope change, permission escalation, or exhausted budget. Do
not start an open-ended repair loop.

## Validate — the numeric backbone

The existing hierarchy stands: static → unit → integration → E2E → runtime. The quality gate
**quantifies** it; it does not replace it.

- Leaving Validate requires the gate green at `--mode full` (`harness-quality-gate`). Exit 1 stops
  the run as `blocked`, naming the failing metric, its value, and its threshold — "tests failed" is
  not evidence, a number is.
- **Exit 2 is a harness blocker, not a code failure.** Say which it is. Conflating them sends agents
  to "fix" working code.
- An `unavailable` metric is a named gap, never a pass. A gate exiting 0 while measuring a handful
  of rows has not validated much.
- A missing or stale report is not a pass. The router returns tier `full` for those, and the
  approval recommendation is withheld rather than granted by default.

### Review depth follows the tier

| Tier | Path |
|---|---|
| `auto` | no diff read. Validate → Judge → `awaiting_confirmation` with the gate report as evidence. |
| `sampling` | `/code-review` over the sampled files only; tests and docs required for them. |
| `full` | full `/code-review` plus `@security-analyst`; a human reads the diff. Never auto-advances. |

At `auto` no reviewer ran, so there are no 0–10 scores: the approval input is the green full-mode
gate report plus the Judge verdict, and the absence of reviewer scores is recorded explicitly
("tier auto — reviewers not run, gate report is the evidence"). Operator confirmation at
`awaiting_confirmation` is unchanged and still mandatory in every tier.

At `full`, the review must be **recorded** to `docs/harness/review/`, citing the gate report's
`sourceHash`. `harness-ship-evidence --commit-trailer` refuses without it — and it refuses on a review
that names a *different* change, because otherwise one stale review artifact satisfies the
mandatory-review tier forever.

## Refine

Refine — after Judge, before awaiting_confirmation. Dispatch the refiner subagent over the trajectory
window. It writes nothing and has no vote in the verdict; the Judge's dispatch payload must contain no
Refine output.

Route each proposal by blast radius (D21):
  - enforcement == prose AND target is not a high_risk_path → dispatch the rule-verifier (distinct from
    the refiner) to REFUTE it against agent-os/standards/ and the diff. If it cannot refute, the proposal
    is auto-approved: the scheduler writes it in the post-confirmation step below with no operator stop,
    and it is logged to refine-log.md as auto-activated with the verifier's report. If it refutes, the
    proposal returns to candidate with the refutation recorded.
  - enforcement can block (lint | test | gate_metric) OR target is a high_risk_path → present inside
    awaiting_confirmation as a separately-rejectable item, rendering the LITERAL text to be written, the
    target file and anchor, source findings with file:line, and refuted_by. `confirmo` applies code and
    proposal; `confirmo, sem a regra` applies the code and defers the proposal to candidate.

Auto-activated prose rules are surfaced in the next run's tier-full high_risk_path read (learned-rules.json
and standards/** are high_risk_paths) so the operator retains a retroactive veto — the blocking pre-approval
is removed, the human read is not.

Post-confirmation write — the scheduler applies approved prose as a SEPARATE rulebook commit, after the
code commit and its trailer have already been emitted. agent-os/standards/, docs/review.md and
learned-rules.json are inside sourceHash, so writing them before the trailer stales the report and
ship-evidence refuses. Record every outcome in docs/harness/refine-log.md, including rejections with the
operator's reason, which binds future proposals.

If no findings exist for this run — tier auto runs no reviewer — say so. Absence is a gap to name, never
a clean run.

The full procedure lives in the `harness-refine` skill. The post-confirmation write is owned by the
Confirm phase: after the operator confirms, the scheduler applies it before handoff.

## Autonomous Plan Run

An operator instruction to execute a named plan or spec end to end is itself the run
authorization — no separate `/prevc run`, no per-task approval. In this mode PREVC
automates every task's Review -> Execute -> Validate -> Judge -> Refine to the end of the plan
and transitions to `awaiting_confirmation` **once**, for the whole spec, rather than
per task.

The autonomy is bounded — halt mid-run only for a real blocker: a task needing
operator/live action, a scope change beyond the plan, `push`/deploy/branch/worktree/
remote Git, or an unrecoverable validation failure after one bounded repair. Medium+
scope changes and high/untrusted risk acknowledgement still apply and still stop the
run when triggered.

After Judge and the Refine phase, always transition to `awaiting_confirmation` at the end of the run (per
task for ad-hoc work; once for a full autonomous plan run). Present changed files, a
diff summary, validation evidence, Judge verdict, residual risks, and rollback
information for operator review.

## Confirm And Handoff

Only the operator may confirm, request revision, or abort from
`awaiting_confirmation`. Confirmation records the outcome and invokes
`harness-clean-handoff`. Revision returns to planning or review as appropriate.
Abort records the reason and performs no further work.

**The post-confirmation write is owned by the Confirm phase.** After the operator confirms — and
**before** handoff — the scheduler applies any approved Refine prose as a separate rulebook commit,
after the code commit and its trailer have already been emitted (see the Refine section). The handoff
subroutine never performs this write.

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
