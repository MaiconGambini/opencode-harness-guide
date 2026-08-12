# Review — what the numbers cannot see

The quality gate measures coverage, mutation, regression, e2e, complexity, module size,
dependency boundaries, and static security findings. **Do not spend review attention there** —
cite the report and move on.

This file is the other half: what no tool checks, plus what has actually escaped the gate in
*this* project. It is the reason the gate exists. Attention the gate frees gets spent here.

## The gate already covered this

Reading the diff to second-guess these is waste. If you disagree with a number, change the
threshold in `agent-os/quality-thresholds.json` with a reason in `quality-decisions.md` — do not
re-litigate it per hunk.

- line and branch coverage
- mutation kill ratio (the real test-strength number)
- regression and e2e suite health
- cyclomatic complexity, module size
- dependency-boundary violations
- static security findings

One exception: an **`unavailable`** metric is not covered. A gate that exits 0 while measuring
three of nine rows has told you almost nothing. Check the report's gaps before trusting its
verdict.

## Only a human sees this

- business-logic correctness — and whether the **right** feature was built at all
- race conditions, concurrency, and ordering assumptions
- unbounded loops and slow paths that aren't N+1 shaped
- memory leaks and resource exhaustion
- authorization logic and trust boundaries that *look* correct
- idiomatic fit with this codebase's conventions
- architectural direction — is this the shape we want more of?
- error messages and failure modes a user or an on-call engineer will actually meet

## Always read, whatever the numbers say

A green gate never buys a skip on these paths. They are the always-review list, and the risk
router forces tier `full` when a diff touches one:

- authentication, sessions, tokens
- payments, billing, checkout
- passwords, credentials, secrets
- database migrations and schema changes
- infrastructure YAML, Terraform, CI workflow files
- permissions, roles, RBAC

## Escaped defects

Append-only. Every entry is a defect the gate let through — and each one either becomes a new
metric or permanently redirects human attention. This section is the compounding value of the
whole loop; a gate that never learns from a miss is just a slower linter.

Format:

```
- YYYY-MM-DD — <what escaped>. Gate that should have caught it: <metric or "none possible">.
  Action taken: <new metric | new blind-spot line | regression test only>.
```

### Log

- (no entries yet)

## How this file changes

`harness-quality-gate`'s write-back appends here when a defect escapes, capped at one proposal
per run. Keep entries short. A `review.md` that grows every session stops being read, and an
unread checklist is worse than a short one.
