# Continual Harness — measuring the agent, not only the artifact

Read this before changing the findings contract, the learned-rules ledger, the Refine phase, or any
adherence metric. `measured-gates.md` explains what each *code* metric proves; this file explains what
each *behaviour* metric proves, and — more importantly — what it cannot.

Read `v1.2-context.md` first. Its fifteen invariants all still hold.

**Status: built and reconciled, not shipped.** The implementation lanes (T01–T03, T05–T08, T10, T11)
are terminal in the working tree but **uncommitted**; no live model acceptance (verification table C)
has run, so every score and stage figure below remains **projected** — a projection presented as a
measurement is the exact failure this harness exists to prevent. **Live config note (SEC-R3,
2026-08-12):** the runtime `agent-os/quality-thresholds.json` is now installed at template parity —
nine adherence rows, `learned_rules` knobs, rulebook `high_risk_paths` — with
`auto_activate_prose_observe` **off** pending restart and live acceptance; see the caveats. The plan is
`agent-os/specs/2026-08-11-1607-continual-harness/`; round 1 produced 29 findings, all accepted,
dispositions in that folder's `review-findings.md`; D21 (operator decision, 2026-08-12) amended
invariant 24. Reconciled against the shipped code on 2026-08-12: every behavioural claim below was
re-checked against the code or by running it, and what the build taught is recorded in the caveats —
not papered over. The approved round-1 repairs (T02-R1, T07-R1, T10-R1) landed the same day; T09-R1
reconciled this document and `v1.3-context.md` against them, so the caveat items they closed are
marked closed below and the caveats that stand are the ones that are still true.

## TL;DR

v1.2 measures the **artifact**. v1.3 measures the **agent**: which written rule was broken, in which
lane — and hands a recurring break to the next lane at dispatch time.

## The finding that caused this

The gate's blind-spot list names what no tool checks. What it does not name is the class that *does* have
a written rule and is broken anyway: server state in a composable ref where this project uses a store; an
error shape ignoring the provider layer's convention; a threshold in prose, which the harness has an
entire invariant against.

Those appear as reviewer **prose**, and prose evaporates. The write-back in
`skills/harness-quality-gate/SKILL.md` gestured at this — propose a standards line after repeated
violations — but it kept no count between runs, had no notion of a rule written and then violated anyway,
and never retired anything. **v1.3 retires that write-back and replaces it; two mechanisms proposing into
the same file is the failure this design exists to prevent.**

## The spine

```
ticket (measurable AC + risk tier)
  → PLANNING: lane manifest built; active rules matching each lane's ownership set are pasted
              into its dispatch prompt, inside an untrusted-data fence
    → lane implements (TDD → local gate → returns the metric table)
      → scheduler (full gate → risk router)
        → reviewers (derived score; findings returned as TYPED RECORDS, validated against the manifest)
          → scheduler writes docs/harness/findings/<run>.json  (roster + gate-report sourceHash)
            → gate → commit trailer → CODE COMMIT
              → Judge (numeric wherever a number exists — Refine has no vote)
                → REFINE (reads the window, returns at most one proposal per component, writes nothing)
                  → awaiting_confirmation: code + metrics + tier + verdict + the proposal,
                    rendered as the LITERAL text that will be written
                    → operator confirms → prose lands as a SEPARATE rulebook commit
                      → next run's dispatch prompts contain the new rule
```

**Prose lands after the code commit, and that ordering is load-bearing.** `agent-os/standards/`,
`docs/review.md` and `learned-rules.json` are all inside `sourceHash`. Writing prose before the trailer
stales the report, and `harness-ship-evidence` refuses — succeeding at learning would block shipping. The
first draft had that deadlock. **Do not "fix" it by widening `GATE_ARTIFACTS`**: dropping the rulebook out
of the source hash removes the only detection left on it and reproduces the `**/auth/**` TOCTOU on the
rulebook itself. Only `docs/harness/findings/` is excluded, and only because it is written after the gate
runs.

The loop closes at the last arrow. Writing a rule nobody reads is what makes every entry point grow and
stop being read; **injection at dispatch is what makes the rule load-bearing**, and also what makes it
testable — a rule demonstrably in front of the model and violated anyway is a badly written rule.

## Source material

Figures from the paper are cited **as reported by it**; they were not independently verified here.

| Source | Taken | Not taken |
|---|---|---|
| *Continual Harness* (arXiv 2605.09998) | the two-loop shape; a Refiner over a trajectory window applying CRUD edits to prompt / sub-agents / skills / memory; failure signatures; and the reported capability finding — refinement Pareto-dominant at the frontier tier, marginal mid, **below the capability threshold** at the cheapest | mid-episode refinement with no approval gate; reset-free emulator training; DAgger + PRM co-learning |
| `prime-agent` | `rlm.harness` as a persisted ledger; `/refine` applying small create/update/delete edits; **never rewriting the immutable base prompt**; snapshots for rollback | the IPython runtime; skills as importable packages; the daemon |
| *Recursive Language Models* | the parent never ingests verbose child output — here, the structured lane report and curating each lane's rule list | RL-trained context management |
| Semantica | provenance on every node; **conflict detection instead of silent overwrite**; bi-temporal facts; decision records as first-class | the graph database, ontologies, SHACL, reasoning engines |
| Persona-swarm thread | — | **cut; see "Why the persona phase was cut"** |

**Neither implementation demonstrates this combination.** The paper's Refiner is automatic with no
approval gate, in a game environment. `prime-agent`'s `/refine` is approved but operator-invoked.
Automatic detection with gated prose is a synthesis — a risk carried knowingly, not a precedent.

## What each metric proves

| Metric | Proves | Does **not** prove |
|---|---|---|
| `citation_competence` | that the cheap reviewer can emit a resolving rule pointer **at all** | that the pointers it emits are the right ones |
| `rule_violations_enforced` | a written, promotion-backed rule (enforcement `lint`/`test`/`gate_metric`) was broken, and which one | how often rules were broken — only how often that was *caught*. The **only** adherence row that may ever become blocking |
| `rule_violations_prose` | a written `prose` rule was broken | how often — same ceiling. **Pinned to `observe` permanently**; the adapter refuses a config flip to blocking (invariant 19) |
| `adherence_per_changed_lines` (by **`capability`**) | whether one lane capability drops rules faster than another | anything about models. Eighteen of twenty-one agents run the same model; grouping by model has one bucket |
| `unciteable_findings_ratio` | reviewer discipline: how often a reviewer objected with no rule to point at | that a *plausible but wrong* pointer was not manufactured |
| `enforced_fraction` | how much of the rulebook a program checks | that the enforced rules are the important ones. **It is not the governing metric** — see below |
| `rules_active` / `rules_retired` | whether the ledger is a working set or an archive, and whether `enforced_fraction` rose by enforcing or by deleting | whether the surviving rules are correct |
| `reviewer_recall_estimate` | how much the cheap reviewer misses relative to the paid one on the same diff | absolute recall — the paid reviewer is a better instrument, not a perfect one |

The nine rows are what the adherence adapter (`scripts/harness-quality-adapters.mjs`) emits, and the
gate only evaluates metrics **declared** in `agent-os/quality-thresholds.json#metrics` — so a project
that has not declared them sees none of these rows, and their thresholds and baselines stay `null`
until stage-1 runs produce them. The template's thresholds file declares all nine rows (T07-R1); the
repo's runtime `agent-os/quality-thresholds.json` is now installed at the same declaration (SEC-R3,
2026-08-12) — rows `observe` with `null` thresholds — with the `learned_rules` knob block and the
rulebook `high_risk_paths` in place, and `auto_activate_prose_observe` **off** pending restart and
live acceptance (see caveats).

### Citation is a lookup, not recall — the model-independence mechanism

The entire countable signal is produced by the **cheapest** model in the matrix. If it cannot emit a pointer
that resolves, `rule_violations_enforced` and `rule_violations_prose` sit at zero, the ledger stays empty, and that is **indistinguishable from a
well-behaved project** — during exactly the week stage 1 is designed to look empty.

The first draft treated that as a measurement problem and added a probe. The probe is still there, but the
real fix is upstream: **the reviewer is handed the rules whose target covers files in the diff, each with its
pointer verbatim, and cites by copying.** A pointer not in the list is refused, and the reviewer is told the
correct move is `blind_spot`.

That changes what the design depends on. Recalling an anchor from a standards file it never read is something
only a capable model can do — and a contract only the paid reviewer can satisfy would make the whole loop a
function of which model ran, which is the opposite of the point. Copying from a supplied list is something
every model in the matrix can do.

`citation_competence` then measures the question that actually matters: **did the reviewer find the
violation**, rather than whether it could name the rule. `unciteable_findings_ratio` still catches the
reviewer that admits it had no rule; `reviewer_recall_estimate` still measures misses relative to the paid
model. Below the competence floor, tier-`full` judgement routes to the paid model.

**A loop with no liveness signal cannot be distinguished from a dead one.** That is why the probe leads
stage 1 even though the lookup makes competence high by construction — the construction is a claim until a
run confirms it.

### `enforced_fraction` is useful, and it is not the governing metric

The first draft called it the governing metric of the layer. Three things broke that claim:

- **It is inert as naively specified.** `threshold: null` with `direction: min` means `0 >= null` passes,
  which seeds `baseline = 0`, which pins the ratchet at zero forever. Empty ledger gives `0/0`. Both must
  report **`unavailable`**, never a number.
- **It is gameable in the direction the design least wants.** The cheapest way to raise `enforced/total`
  is to shrink the denominator — retire prose rules — and the ledger does that automatically. The
  companion `rules_active` / `rules_retired` rows exist so that is visible, and the denominator is defined
  over rules that have existed for a minimum number of runs so retirement is neutral.
- **It only moves if promotion is cheap.** The first draft assumed each promotion was operator engineering
  outside the spec, and capped two dimensions on that. **Verified otherwise:** `harness-clean-handoff` step 5
  runs the discovered startup verification and `harness-startup-path` discovers `uv run ruff check .`,
  `npm run lint` and equivalents — so **every harnessed project already runs its linter every session.** What
  remains is authoring a rule once, which is ordinary bounded work and therefore a lane.

So it *is* a lever the harness can pull, with two guards that keep it honest:

- **A promotion requires a fixture that fails before the rule exists and passes after.** Same discipline as
  invariant 14. Without it, promotion is a claim and the metric counts claims.
- **A rule that cannot be checked without false positives is marked permanently prose and excluded from the
  denominator — structurally, in the adapter** (`prose_permanent` rules are filtered out of the
  `enforced_fraction` count). Judgement rules are a legitimate outcome, not a backlog. Without the
  exclusion the metric pressures people to mechanise the unmechanisable, and a linter people disable is
  worse than prose nobody automated — a ritual this harness already documents an aversion to.

It is the third step of *Mensurar → Escrever → Automatização*, made measurable and reachable. It is still not
the *governing* metric — a rulebook fully enforced but full of wrong rules scores perfectly.

## The ceiling this design cannot cross

**Adherence counts detected violations, not real ones.**

```
real violation ──┬── reviewer detects ──→ typed finding ──→ counted   ✓
                 └── reviewer misses ───→ nothing        ──→ invisible ✗
```

The number can improve while behaviour worsens, if reviewer recall drops. A degraded reviewer producing
fewer findings reads as progress. This is the failure direction `v1.2-context.md` warns is live in
anything added here, and the first draft reproduced it immediately after reading the warning.

Bounded by `citation_competence` + `reviewer_recall_estimate`; removed only by a rule a program checks.
Not removed by a better reviewer.

## Write authority

Data is written; prose is proposed. Same split the gate already uses for thresholds.

| What | Who produces | Who writes | Gate |
|---|---|---|---|
| typed findings | reviewers (`edit: deny`, `bash: deny`) | **scheduler**, write-once per run label | none — measured data |
| counts, groupings, adherence rows | `harness-findings.mjs` | **scheduler** | none — deterministic |
| an operator note | **the operator**, via `/refine --note` | scheduler | none — it is the operator's own words |
| a proposal | `refiner` (`edit`/`bash`/`task`/`external_directory`/`webfetch` all `deny`) | nobody | — |
| a refutation | `rule-verifier` (same lockdown as `refiner`; distinct dispatch) | nobody | — |
| rule text, **prose + `observe`** | — | **scheduler, after the verifier fails to refute, in a separate commit** | **`rule-verifier` (auto); operator veto on next-run `high_risk_path` read** |
| rule text, **blocking or `high_risk_path`** | — | **scheduler, after confirmation, in a separate commit** | **operator, shown the literal text** |
| enforcement promotion | — | scheduler, after confirmation | **operator + a test** |
| governing numbers | — | operator, in `quality-thresholds.json` | **dated entry in `quality-decisions.md`** |
| anything under `~/.config/opencode/` | — | **operator, by hand** | always |

**No agent gains write permission**, and two are tightened: `code-reviewer` moves to `bash: deny`
(its enumerated bash deny-list missed `node -e`, so "reviewers never write" was false as configured), and
the `refiner` denies `external_directory` and `webfetch` explicitly — the global plugin default for the
former is `ask`, and an agent whose output becomes committed prose that is then broadcast to every lane
should not read outside the repo. `task: deny` on the refiner is load-bearing: it is what stops it
delegating a write to a write-capable subagent.

**The model classifies; the script counts.** `refiner` may say a record is a `rule_violation`;
`harness-findings.mjs` decides whether the pointer resolves and does all arithmetic.

**Governing numbers live in the guarded file.** Every knob is in
`agent-os/quality-thresholds.json#learned_rules`, not in the ledger, because `configFingerprint` and
`guardThresholds` read only that file. Under an unknown top-level key it lands in the `other` bucket, is
compared, and any change requires a dated reason. The first draft put them in the ledger, where a one-line
edit disabled any control and **every disabled control reported success** — the same shape as
`suites.regression.command → exit 0`. `learned-rules.json` and `standards/**` are also in
`high_risk_paths`, so touching either forces tier `full` and a human read.

## Rule lifecycle

```
                  weighted evidence reaches the configured minimum,
                  across the configured number of sessions
        (nothing) ─────────────────────────────────────────────→ candidate
                                                                     │
                                    conflicts with an active rule? ──┤──→ conflict (operator decides)
                                                                     │
                    prose + observe: rule-verifier refutes? ─────────┤──→ (fail) back to candidate
                    blocking / high_risk: operator approves ─────────▼      refutation logged
                       the LITERAL text                           active (prose)
                                                                     │
                    violated again, repeatedly, while injected ──────┤──→ REWRITE with a code example
                                                                     │      in a separate quoted field
                       no citation inside its window, or the  ───────┤──→ retired
                       per-target cap displaced it                   │
                                                                     │
                       operator + a test that fails before  ─────────▼
                       and passes after                           active (lint | test | gate_metric)
```

- **A candidate is not a rule.** One bad session cannot legislate. An explicit operator note clears the
  bar alone, because of its weight — arithmetic, not a special case.
- **Activation splits by blast radius, not by model (D21).** A prose-`observe` rule cannot block — invariant
  19 enforces that through the adapter — so it auto-activates once a distinct top-tier `rule-verifier`, run
  read-only and prompted to *refute* it against `agent-os/standards/` and the diff, fails to. A rule that
  could block or targets a `high_risk_path` still needs the operator's approval of the literal text. The
  human read is not lost: the rulebook is a `high_risk_path`, so the next run's gate forces tier `full` and a
  read — a retroactive veto, not a pre-commit stop. The verifier is distinct from the refiner for the reason
  Refine has no vote: a process that drafts and approves its own rule learns to approve itself.
- **Only `agent-os/standards/` may be targeted.** `AGENTS.md` is `harness-project-calibration`'s file;
  allowing both to write it was a second write path into the entry point.
- **A prose rule can never block.** The adherence adapter excludes `enforcement: "prose"` from every row
  that is or could become blocking; prose violations land in a row pinned to `observe`. That pin is
  load-bearing, not decoration — `isTightening` classifies `mode → blocking` as an improvement needing no
  justification, so without the pin one word would let a machine-drafted sentence refuse a commit.
- **A numeric rule may not stay `prose`.** A number belongs in the thresholds file. `checkSources`
  scanning the rulebook enforces it, which is invariant 13 working as intended.
- **Rewrite, never restate.** Restating louder is the ritual this design exists to avoid.
- **Retirement is mandatory.** The per-target cap forces retiring the weakest rule. TTL alone does not
  save a ledger — a rule cited once inside every window lives forever.

## Anti-slop mechanisms

| Mechanism | Stops |
|---|---|
| `rule_violation` requires a resolving pointer | a reviewer objecting with nothing behind it |
| `citation_competence` | a starved loop reading as a clean project |
| weighted minimum across sessions | one bad run legislating |
| conflict detection before append | two rules disagreeing, which is how an entry point becomes unread |
| one proposal per component per run | documentation turning into changelog noise |
| rejection reason recorded and binding | re-deciding the same proposal every month |
| per-target cap | monotonic growth of the rulebook |
| citation window | a rule that stopped mattering outliving its reason |
| `rules_active` / `rules_retired` | `enforced_fraction` rising by deletion instead of enforcement |
| `violations_after` forcing a rewrite | a bad rule restated instead of fixed |
| enforcement gated on a test | a machine-authored rule ever blocking on its own authority |
| `--validate-ledger` on `text` | newlines forging list entries inside a write-capable lane's prompt |
| the untrusted-data fence at injection | rule text read as instructions |
| `redact()` on every diff-originating field | a secret in a fixture becoming a committed code example |
| `checkSources` over the rulebook | orphan prose with no ledger id, and numbers in prose |

## Operator cadence — the honest total

The first draft claimed "roughly a minute per week" and counted only proposal approval.

| Action | Frequency |
|---|---|
| approve / reject a proposal, having read the rendered text | per run producing one, capped at one per component |
| resolve a conflict | when a candidate contradicts an active rule |
| confirm a retirement | when the window or the cap fires |
| **author the lint or test for an enforcement promotion** | per promoted rule — the only way `enforced_fraction` moves |
| set stage-2 thresholds from baselines, with a dated reason | once at stage 2, then per change |
| advance a stage | twice |
| promote a rule to the global templates by hand | rare; needs three projects |
| `/refine --note` after a hand fix | when it happens |

The middle row is the one the first draft hid.

## Projected gain

<!-- prose-threshold-ok: subjective dimension scores and weights, not gate thresholds -->

**Projected, not measured.** Weights encode one goal: a cheap model producing consistent code because the
harness carries the quality.

**The dimensions, the weights and the scores are all judgement.** Only the commands cited in the spec's
`review-findings.md` were measured. These are direction and magnitude, not precision — do not optimise the
number.

| Dimension | Weight | today | stage 1 (projected) | stage 2 (projected) |
|---|---:|---:|---:|---:|
| Product measurement | 20% | 9.0 | 9.0 | 9.0 |
| Process measurement | 15% | 2.0 | 6.0 | 9.0 |
| Learning | 15% | 3.0 | 7.0 | 9.0 |
| Entry / context delivery | 12% | 7.5 | 9.0 | 9.0 |
| State / continuity | 10% | 9.0 | 9.0 | 9.5 |
| Durable evidence | 10% | 9.0 | 9.0 | 9.5 |
| Model independence | 10% | 6.0 | 7.5 | 9.0 |
| Slop resistance | 5% | 5.0 | 7.5 | 9.0 |
| Right feature built | 3% | 3.0 | 3.0 | 3.0 |
| **Weighted** | | **6.19** | **7.85** | **~8.9** |

D21 raised Learning 8.5 → 9.0: prose-`observe` activation is no longer gated on operator availability, so the
loop stops depending on the operator approving every rule. Weighted +0.075 (15% × 0.5). It moves nothing else —
the writer was already top-tier, so model independence is unchanged, and prose still cannot block, so invariant
19 holds.

Two caps were removed after the first estimate, and neither by re-scoring:

- **Citation as lookup** (the reviewer is handed the rules) means process measurement is not bounded by
  whether the cheapest model can recall an anchor.
- **Promotion as a lane** (the linter already runs; authoring is bounded work) means `enforced_fraction` is
  reachable rather than aspirational, which lifts process measurement and model independence together.

Paying the `unavailable` bill takes product measurement to 9.5, which with D21 brings the weighted total to
**~9.0**. Read that as a *weighted* figure, not a per-dimension one: two rows below stay capped on purpose, so
"9 in every dimension" remains impossible — a weighted ~9.0 is the ceiling this design reaches, and it reaches
it only because the two capped rows carry 13% of the weight between them.

**Two dimensions should still not be chased, and D21 does not change this:**

- **Durable evidence** stops at freshness, not authorship. Closing it needs signing, which `v1.2-context.md`
  correctly rules out of scope for a local harness.
- **Right feature built** has no oracle, because intent lives in the operator. D21 moves the operator from a
  pre-commit gate to a retroactive veto on the common path — it does not manufacture an intent oracle, so the
  mechanism for this dimension is *still* the operator confirming, now for the rules that can block.

Crossing 9.0 needs that last row to move, and the only candidate is the persona phase this design cut — about
+0.06, for the largest cost in the plan on the smallest-weighted row. The trade is recorded, not hidden.

**Stage 1 alone meets the stated need. Stage 2 is what makes the consistency come from the harness rather
than the model.**

## Why the persona phase was cut

An earlier draft had a third phase: persona markdown driving milestone sweeps. Under the weights above it
moves two rows, one of which carries the smallest weight in the table, for the most expensive and least
specified work in the plan.

The argument for it is real — it is an independent detection channel, and adherence needs one.
`citation_competence` plus `reviewer_recall_estimate` is the cheaper way to get it. Cut, with the
reasoning recorded so it is not re-added as an obvious gap.

## New invariants (16–24)

Each names what enforces it. An invariant whose enforcer is only this document is a wish; those are
demoted or marked procedural below.

16. **A project's ledger is local.** It never references another project. Cross-project promotion is a
    proposal to the global templates, applied by the operator by hand.
    **Enforced by:** `harness-findings.mjs --validate-ledger` refusing any `target` outside
    `ledger.targets_allowed` (default `agent-os/standards/`) — fixture "rejects a target outside
    targets_allowed". The promotion half has no code path by construction; it is operator practice.
17. **The Refiner writes nothing.** Data is written by the single writer that already writes the gate
    report and the commit; prose reaches a file only after the operator confirms.
    **Enforced by:** the `refiner` permission block in `opencode.jsonc` (`edit`/`bash`/`task`/
    `external_directory`/`webfetch` all `deny`). Live check C12 ("permissions hold in practice") has
    not run yet.
18. **Refine has no vote.** Checkable form: the Judge's dispatch payload contains no Refine output.
    **Enforced by:** dispatch contract in `skills/prevc-workflow/SKILL.md` and
    `skills/harness-refine/SKILL.md` — procedural, no code check exists. Live check C6 has not run yet.
19. **A machine-learned rule is structurally incapable of blocking.** Prose rules are excluded from every
    blocking row by the adapter, not by a sentence in this file.
    **Enforced by:** `ENFORCED_ENFORCEMENTS` routing and the `rule_violations_prose` pin in
    `scripts/harness-quality-adapters.mjs` — the adapter returns `unavailable` if a config ever flips
    the prose row to blocking. Fixtures A14/A15 and the D21 ledger tests ("rejects a rule-verifier
    approval on a rule that can block").
20. **Adherence is a floor, not a rate.** A count with no recall estimate beside it must be reported as a
    floor. The renderer enforces it.
    **Enforced by:** `recallAnnotation` / `hasRecallAnnotation` in the adapter (fixture A17 fails if a
    count loses its annotation), and `renderTable` printing the recall annotation's detail on PASS rows
    that carry it — T07-R1 closed the renderer half; unrelated PASS rows stay compact.
21. **The ledger is a working set.** The per-target cap forces a retirement; a rule with no citation
    inside its window is retired.
    **Enforced by:** procedure — `skills/harness-refine/SKILL.md` ("dead rule → Delete — retire it", and
    the cap-forced retirement carrying `displaced_by`), with the governing numbers
    (`max_active_rules_per_target`, `retire_after_days_without_citation`) range-checked by
    `harness-findings.mjs` (exit 2 out of range). No code auto-retires; the Refine phase is the only
    mechanism that removes a rule.
22. **Prose lands after the commit.** The rulebook stays inside `sourceHash`; only the findings directory
    is excluded, and only because it is written after the gate runs.
    **Enforced by:** `GATE_ARTIFACTS = [REPORT_DIR, REVIEW_DIR, DECISIONS_PATH, FINDINGS_DIR]` in
    `harness-quality-core.mjs` — the rulebook (`agent-os/standards/`, `docs/review.md`,
    `learned-rules.json`, `refine-log.md`) stays hashed, and `harness-ship-evidence` refuses on a stale
    report. Fixture "sourceHash — findings writes are invisible, standards writes are not".
23. **Governing numbers live in the fingerprinted file.** A knob outside `configFingerprint`'s reach is a
    control that can be disabled with no record.
    **Enforced by:** the `learned_rules` key in `agent-os/quality-thresholds.json` landing in the
    fingerprint's `other` bucket (any change emits `unknown-key-changed`, needs a dated decision) plus
    the range rows in `harness-findings.mjs` (exit 2 on out-of-range or unknown knob — fixtures
    "rejects an unknown knob", "accepts the shipped knob set").
24. **The operator approves text they were shown — for any rule that can block.** The confirmation renders
    the literal string, target, anchor, source findings and `refuted_by`. **Amended by D21:** a prose-`observe`
    rule, which invariant 19 already forbids from blocking, auto-activates after a distinct top-tier
    `rule-verifier` fails to refute it, and is surfaced in `refine-log.md` for veto on the next-run
    `high_risk_path` read. The operator gate is mandatory only for enforcement promotions and rules targeting
    a `high_risk_path`. Capability writes the rule; only the operator (or a passing test) grants it authority
    to block.
    **Enforced by:** procedure — `skills/harness-refine/SKILL.md` renders the LITERAL text (C9, not yet
    run); the D21 amendment is enforced by `--validate-ledger`: `approved_by: "rule-verifier"` requires
    `enforcement: "prose"` and a recorded `verifier_report` (D21 fixtures).

And the one that outranks them, inherited unchanged:

> **The gate fails closed.** A missing ledger, an unparsable findings file, a window with no reviewer
> roster, or a Refine phase that could not run are gaps to name — never a pass, and never a reason to
> lower a tier.

## Honest caveats

- **Stage 1 returns nothing for roughly a week** except the liveness numbers. That is the point of the
  liveness numbers.
- **Classification stays model-judged.** The script validates the pointer and does the arithmetic; a
  reviewer labelling a preference as a `rule_violation` with a *plausible* pointer still inflates the
  count.
- **The first occurrence of a mistake reaches nobody.** It is threshold-gated by design — one session must
  not legislate — so the first N breaks are candidate evidence only. A `blind_spot` recurring *within* one
  run is surfaced as an observation, which is partial mitigation, not a fix.
- **The Refiner must not run on the cheapest tier.** Reported below the capability threshold there. The
  cost of that mistake is the layer, not the model.
- **The loop depends on the operator approving.** The design has no answer for that.
- **Mid-run intervention is not delivered.** The operator asked to stop mid-plan when the work goes wrong.
  What exists is the autonomous-run halt list, `cancel_task` per lane, and the serial fallback; `Ctrl+C`
  does not kill background children. Separate work, declared rather than pretended.
- **Attribution is per capability, not per model**, and cannot be otherwise while the fleet runs one model.
- **The same failure direction recurred again.** Round 1 found five controls verified at one layer and open
  at the layer beneath: the ledger hashed but not guarded, invariant 19 written but not enforced, the
  reviewer's `edit` denied but not its `bash`, the findings file bound by filename rather than content, and
  the source hash defended for the thresholds file then deadlocked by the rulebook write. Assume the
  pattern is live in whatever is added next.
- **The build taught five things that are not in this design's first draft. Round-1 repairs
  (T02-R1/T07-R1/T10-R1) closed three of them; the two that stand are marked as still open.**
  - **This repo's runtime thresholds are now opted into the nine adherence rows (SEC-R3,
    2026-08-12).** After T07-R1 the template declared all nine rows while this repo's runtime file
    stayed unchanged, so this repo's gate tables showed none of them. SEC-R3 installed the live
    config at the same declaration — all nine rows `observe`/`null`, plus the `learned_rules` knob
    block (dated decision in `quality-decisions.md`) and `**/learned-rules.json` + `**/standards/**`
    in `high_risk_paths`. `auto_activate_prose_observe` is **false**: the D21 auto-activation toggle
    is installed but stays off until restart and live acceptance (C1–C16) provide evidence — with it
    off, prose-`observe` candidates route to the operator path. Existing baselines and thresholds
    preserved.
  - **The renderer used to drop PASS-row detail.** Closed by T07-R1: `renderTable` now prints a
    recall annotation's detail on the PASS row that carries it, and leaves unrelated PASS rows
    compact (invariant 20's renderer half is complete; the adapter-level check still holds).
  - **The symlink fixture is skipped on Windows without developer mode.** `fs.symlinkSync` throws, and the
    test records `# SKIP` rather than failing — the A10 symlink half is unverified on this machine. **Still open.**
  - **`opencode.jsonc` changes need an OpenCode restart.** The new `refiner` / `rule-verifier` permission
    blocks and the reviewers' `bash: deny` do not apply to a running session; T05 landed that way. **Still open.**
  - **The calibration-side seam was not updated.** Round 1's F4 seam ("calibration owns thresholds and
    `AGENTS.md`; the refine loop owns the ledger and `standards/*.md`") was declared, but the
    calibration-side file — `skills/harness-project-calibration/SKILL.md` — sat outside every declared
    ownership set and said nothing about the ledger or the seam. Closed by T10-R1: the skill now
    declares the ownership seam explicitly.
- **No live model acceptance has run.** Verification table C (C1–C16) — injection reaching a lane,
    findings landing complete, permissions holding in practice, the liveness numbers existing — is model
    work and has not been executed. Everything that needs a model run is unverified by design, and this
    document says so instead of pretending otherwise.
- **This document will be wrong about a number at some point.** If you state a count or a "now clean"
  here, run the command first and paste what it said.
