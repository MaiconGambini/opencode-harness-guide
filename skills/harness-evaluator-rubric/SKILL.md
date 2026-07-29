---
name: harness-evaluator-rubric
description: Build a task-specific evaluator rubric from the active contract before Judge phase. Do not self-judge; produce rubric plus evidence.
---

# Harness Evaluator Rubric

Run after Execute + Validate and before claiming any verdict.

## Inputs

Find the best available contract:

1. `docs/harness/sprint-contract.md`
2. Feature spec/task AC under `.specs/features/*`
3. User-approved PREVC plan in current session

Also load available progress state, feature state, and startup path.

## Rubric

| Criterion | Weight | Pass Condition | Score (1-5) | Evidence | Notes |
|---|---|---|---|---|---|
| Functional completeness | high | All approved AC met | | | |
| Verification | high | Actual output captured | | | |
| Scope discipline | high | Only approved scope changed | | | |
| Reliability | medium | Discovered startup/verification passes | | | |
| Maintainability | medium | Files follow project limits and conventions | | | |
| Handoff readiness | medium | State and handoff updated for fresh session | | | |

Add task-specific rows from the contract.

## Scoring

- 5: fully met with evidence.
- 3: partially met with documented gap.
- 1: not met or no evidence.
- Average ≥4.0 and no 1-scores: Accept candidate.
- Any 1-score: Block candidate.

Do not self-approve. Send rubric and evidence to Judge.
