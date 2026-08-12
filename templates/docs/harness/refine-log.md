# Refine Log — what the harness proposed, and what you decided

Append-only. One entry per Refine phase that produced a proposal, plus one per proposal you
rejected. **Never edit or delete a past entry** — the history is what stops the same proposal
coming back next month.

The rule records live in `agent-os/learned-rules.json`; the governing numbers behind the proposals live
in `agent-os/quality-thresholds.json#learned_rules`, where a change needs a dated `quality-decisions.md`
reason. The reasoning behind the whole loop lives in `~/.config/opencode/docs/harness/continual-harness.md`.

## Why rejections are recorded

A rejected proposal with no recorded reason is re-proposed the moment the evidence count ticks up
again, and you re-decide the same thing forever. The reason you give is read by the next Refine
run as a hard constraint: it may not re-propose that rule until *new* evidence appears that the
reason does not already cover. A `rule-verifier` refutation binds the same way — a candidate the
verifier refuted is not re-proposed on evidence the refutation already covers (D21).

## Format

```
- YYYY-MM-DD — <rule-id> <slug> — APPROVED | AUTO_ACTIVATED | REJECTED | REFUTED | RETIRED | REWRITTEN | PROMOTED.
  Evidence: <n> findings across <n> sessions (<finding-ids>).
  Operator reason: <required for REJECTED; optional otherwise>.
  Verifier report: <required for AUTO_ACTIVATED; the failed refutation attempt>.
```

Verbs, and what each one means:

| Verb | Meaning |
|---|---|
| `APPROVED` | candidate became an active rule; its text is now in the target standards file |
| `AUTO_ACTIVATED` | prose-`observe` candidate the `rule-verifier` failed to refute; written with no operator stop, carrying the failed refutation as `provenance.verifier_report` (D21). Surfaced for veto on the next-run `high_risk_path` read |
| `REJECTED` | proposal declined. **Reason required** — it becomes the constraint above |
| `REFUTED` | `rule-verifier` refuted the candidate; it returns to `candidate` and nothing is written. The recorded refutation binds future proposals like a rejection reason |
| `RETIRED` | active rule removed: no citations inside its window, or displaced by the per-target cap |
| `REWRITTEN` | rule kept but reworded because it kept being violated after being written |
| `PROMOTED` | rule moved up an enforcement level (`prose` → `lint` → `test` → `gate_metric`) |

## What Refine may never write

The Refiner returns proposals and writes nothing. Prose reaches a file only after you confirm,
and only in this project:

- `agent-os/standards/*.md`
- `AGENTS.md`, below the calibration marker
- `docs/review.md`
- `agent-os/learned-rules.json`

The global harness under `~/.config/opencode/` is operator-authored. A cross-project promotion is
proposed here and applied by you, by hand.

## Log

- (no entries yet — this project is at phase D, observing)
