# Verification

## Risk And Harness Gates

- Risk class: low | medium | high | untrusted
- Router tier: auto | sampling | full  (from `harness-risk-router`, with its reason)
- Context budget command/status:
- Security scan command/status:
- Judge profile:
- Skip reasons, if any:

| Check | Command | Expected |
|---|---|---|
| Baseline | project-specific | exits 0 |
| Quality gate (lane) | gate at `--mode local` | exit 0, no blocking metric red |
| Quality gate (pre-commit) | gate at `--mode full` | exit 0, mutation at/above baseline |
| Review depth | `harness-risk-router` | tier matches the review actually performed |
| Commit evidence | `harness-ship-evidence --commit-trailer` | emits (refuses on a red or stale gate) |

## Metrics Recorded

- Gate report: `docs/harness/quality/<stamp>-<mode>-<label>.md`
- Unavailable metrics (named gaps, not passes):
- Baseline moves this change caused:

## Notes

Thresholds are never written in this file — they live in `agent-os/quality-thresholds.json`.
An `unavailable` metric is a gap to record here, not a row to mark as passing.
