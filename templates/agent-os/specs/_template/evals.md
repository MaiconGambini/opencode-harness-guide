# Evals

## Capability Evals

- What must become possible after this work?

## Regression Evals

- What must remain true?
- Which existing regression tests cover it? (a bug fix must add one — see `suites.regression`)

## Command Evals

- Gate command: the absolute global invocation from `docs/harness/measured-gates.md`,
  at `--mode local` for a lane / `--mode full` before the commit.
  (Never a relative `scripts/...` path — this spec lives in a project, the script does not.)
- Expected: exit 0, no blocking metric red.
- Report: `docs/harness/quality/<stamp>-<mode>-<label>.md`
- Other project commands and their expected output:

## Judge Rubric

- Required Judge profile: `agent-os/judges/project-judge.md`
- Pass threshold: see `agent-os/quality-thresholds.json` — **do not restate numbers here.**
- Measured rows come from the gate report; judgement rows come from the AC above.

## Evidence

- Evidence file or command output location:
- Metrics recorded in: the gate report above, and the commit trailer (`Quality-Gate:` /
  `Metrics:` / `Risk-Tier:`).
