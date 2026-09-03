---
sidebar_position: 6
---

# Parallel dispatch in practice

An end-to-end example of a plan run by `spec-lead` in **auto mode** — from the
prompt to final confirmation without stopping in the middle.

## The scenario

**MEDIUM feature, 3 disjoint lanes:** a UI card, a backend aggregation endpoint,
and tests for both. Because the lanes touch different files, they can run in
parallel.

**Instruction:**

```text
Execute all tasks in plan agent-os/specs/2026-08-05-compare-props end to end
under PREVC — this authorizes a full autonomous run.
Propose a lane table per phase; parallelize independent lanes,
serialize lanes sharing a file. Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel
over the diff; both must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

## What happens under the hood

The instruction already authorizes the full run. There is no `/prevc run` and no
mid-run approval; `spec-lead` plans, executes everything, and stops **once** at
the end.

```
You: Execute all tasks in plan .../compare-props end to end under PREVC ...

spec-lead (configured model):
  [PREPARE — planning]
  Map file ownership per lane. Dispatch @explorer (read-only) to confirm
  conventions and call sites.

  -> @explorer: file:line references for frontend_*.json readers and the
     error convention in src/analysis/

  LANE TABLE (the plan instruction authorizes the run):
  ┌──────┬─────────────────────────┬──────────────────────────────┬──────────┬──────────────────────┐
  │ Lane │ Objective               │ Ownership (files)             │ Dep      │ Capability           │
  ├──────┼─────────────────────────┼──────────────────────────────┼──────────┼──────────────────────┤
  │ L1   │ Comparison card         │ frontend/.../Compare.vue      │ —        │ vue-engineer         │
  │ L2   │ Aggregation endpoint    │ src/analysis/compare.py       │ —        │ python-engineer      │
  │ L3   │ L1+L2 tests             │ tests/test_compare.py          │ L1, L2   │ test-automation-eng  │
  └──────┴─────────────────────────┴──────────────────────────────┴──────────┴──────────────────────┘
  Risk: MEDIUM. Disjoint ownership between L1 and L2 -> parallel.
  L3 depends on L1+L2 -> serial. Verification: vue-tsc + vitest; pytest.

  [EXECUTE — scheduler, no approval stop]
  Dispatch L1 and L2 in parallel, recording task IDs.

  -> task(python-engineer, L2)  -> id=t_a1  [running]
  -> task(vue-engineer, L1)     -> id=t_b2  [running]

  [task_status: t_a1 running, t_b2 running...]
  [t_a1 -> completed]  L2: compare.py created, module pytest passed
  [t_b2 -> completed]  L1: Compare.vue created, vue-tsc + vitest OK

  L1+L2 complete -> dispatch L3 (dependency satisfied).
  -> task(test-automation-engineer, L3) -> id=t_c3  [running]
  [t_c3 -> completed]  L3: test_compare.py, 8 passed 0 failed

  RECONCILE + cross-lane verification:
  [vue-tsc -> OK]  [vitest -> OK]  [pytest -> 31 passed]

  [FINAL GATE — reviews in parallel]
  -> task(code-reviewer, diff)          -> score 9.5/10, 0 critical
  -> task(architecture-reviewer, diff)  -> score 9/10, 0 blocking
  Both >=9 -> recommend approval.

  Local commit of the reconciled work.

PREVC: Validate -> Judge -> awaiting_confirmation
  Changed: 3 files. Evidence: vue-tsc OK, vitest OK, pytest 31/0,
  code-reviewer 9.5, architecture-reviewer 9.

You: confirm
  -> feature_list.json: feat-XXX -> passing
  -> [harness-clean-handoff]
```

## Rules followed by the scheduler

- **One file, one write-capable lane at a time.** L1 and L2 are disjoint ->
  parallel. L3 depends on both -> serial afterward. Ownership is a prompt rule,
  not a lock; a collision would be silently overwritten.
- **Task ID recorded immediately.** A lane without a task ID does not exist.
- **No mid-run stop.** The plan instruction authorized the run; it stopped only at
  final `awaiting_confirmation`.
- **Only the scheduler commits.** Implementers edit; `spec-lead` creates the
  reconciled local commit. Push, branch, and worktree remain operator-controlled.
- **Two review gates with scores.** `code-reviewer` and `architecture-reviewer` run
  in parallel; both at least 9 with zero critical findings provide approval evidence.

## When it would stop midway

Auto mode is bounded. It interrupts only for a real blocker:

- A task requiring the operator or live access (physical machine, credential,
  real traffic).
- Scope changes beyond the plan.
- `push`, deploy, branch, or worktree operations.
- An unrecoverable validation failure after a repair.

A plan with an operator gate, such as a production rollout, stops at that gate. A
code-only plan like this runs from prompt to end without stopping.

See [Parallel Dispatch](./parallel-dispatch) for the complete reference on modes,
agents, and the ready-to-use recipe.
