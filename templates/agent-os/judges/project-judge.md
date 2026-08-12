# Project Judge

## Required Inputs

- Sprint contract or Agent OS spec
- Changed files
- Verification output
- Handoff state
- **The gate report** — the newest `docs/harness/quality/*.json`
- **The router tier** — `auto | sampling | full`

A verdict written without the last two is not a verdict. If the report is missing, stale, or
`unconfigured`, return **`cannot judge`** naming what is absent — do not guess, and do not read
silence as a pass.

## Rubric

Every row either carries a number or admits it is judgement. A row with a measurable-sounding
word and no number behind it has been removed rather than reworded.

| Dimension | Pass criteria | Source |
|---|---|---|
| Correctness | every AC met, each with named evidence | judgement |
| Verification | the gate command exited 0 at the mode this position requires | **measured** |
| Test strength | `mutation_kill_ratio` at or above threshold/baseline | **measured** |
| Regression | `regression_suite` clean — none failing, none quarantined; a bug fix has a new regression test | **measured** |
| Coverage floor | `line_coverage` and `branch_coverage` at or above threshold | **measured** |
| Maintainability | `cyclomatic_max` and `module_lines_max` within threshold | **measured** |
| Boundaries | `boundary_violations` at threshold | **measured** |
| Security | `security_findings` at threshold, **and** the analyst's reasoning at tier `full` | measured + judgement |
| Scope | only approved files changed | judgement |
| Blind spots | `docs/review.md` items considered and answered | judgement |
| Adherence gap | adherence rows reporting `unavailable` are stated, with the reason | judgement |
| Refine outcome | recorded as context — never a dimension, never weighted (invariant 18) | judgement |
| Handoff | state and next action clear to a fresh session | judgement |

**Thresholds are not written here.** They live in `agent-os/quality-thresholds.json`. A rubric
that restates a number drifts from the gate within a sprint.

## Adherence and the Refine outcome (continual harness)

The continual harness adds two **judgement** rows, because a gate that exits 0 while measuring
nothing about the agent is the failure mode that layer introduces:

- **Name the adherence gap.** If the adherence rows report `unavailable`, say so with the reason.
  The generic `unavailable` rule above covers this in principle; it is stated explicitly because
  this gap is the layer's own failure mode, not a missing tool.
- **Record the Refine outcome without weighting it.** "Refine proposed vue-002; operator decision
  pending" is context for the verdict. It is never a dimension and never feeds a score —
  invariant 18.

Neither row carries a threshold or a score input. A red adherence row cannot exist during stage 1
or stage 2: prose-rule violations are excluded from every blocking row by the adapter
(invariant 19).

## The `unavailable` rule

A measured row whose tool is absent reports `unavailable`. That is **not** a pass and not a
failure — it is a gap you must name in the verdict. A gate exiting 0 while measuring three of
nine rows has told you almost nothing, and a Judge that calls it green is the failure mode this
whole rubric exists to prevent.

## Verdicts

- **Accept** — all dimensions pass, no measured row red, gaps named and acceptable.
- **Revise** — limited issues with a clear fix. **Any red measured row means Revise at best.**
- **Block** — unsafe, unverified, or out of scope.

A model cannot argue its way past a number. Judgement rows are where argument belongs.

## Tier `auto`

At tier `auto` no reviewer ran, so there are no 0–10 scores to weigh. The evidence is the green
full-mode gate report plus this verdict. Record explicitly: *"tier auto — reviewers not run, gate
report is the evidence."* Never let that absence pass unremarked.
