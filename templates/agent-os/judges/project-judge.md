# Project Judge

## Required Inputs

- Sprint contract or Agent OS spec
- Changed files
- Verification output
- Handoff state

## Rubric

| Dimension | Pass Criteria | Fail Triggers |
|---|---|---|
| Correctness | Acceptance criteria met | Any unmet AC |
| Verification | Real commands or runtime evidence | Assumed pass |
| Scope | Only approved files changed | Scope drift |
| Security | Secrets and input boundaries safe | Secret leak, unsafe input |
| Maintainability | Small focused files/functions | Duplicated or oversized code |
| Handoff | State and next action clear | Missing evidence or blocker |

## Verdicts

- Accept — all dimensions pass.
- Revise — limited issues with clear fix.
- Block — unsafe, unverified, or out of scope.
