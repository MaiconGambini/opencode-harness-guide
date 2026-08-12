---
sidebar_position: 4
---

# Continual Harness v1.3

v1.3 turns review feedback into a structured signal that can guide later runs.
It does not claim that an agent "learns by itself": the loop is project-local,
measured through configured signals, and bounded by permissions and human
confirmation.

## Behavior loop

```text
ticket and risk
  -> manifest and active rules by ownership
  -> lanes execute and run local gates
  -> scheduler runs full gate and risk router
  -> reviewers return typed findings
  -> scheduler validates and writes the window
  -> code commit and Judge
  -> Refine proposes, without writing or voting
  -> awaiting_confirmation shows literal text
  -> approved rule lands separately
  -> next run injects the rule into matching lanes
```

The gate measures the artifact, not agent reputation. Metrics and policies are
declared in `agent-os/quality-thresholds.json`; learned-loop controls live at
`quality-thresholds.json#learned_rules`. A missing value, stale report, or
missing roster is a fail-closed gap.

## Typed findings

Reviewers return records; they do not write files. The scheduler validates them
and is the sole writer of `docs/harness/findings/<run>.json`.

| Class | Meaning |
|---|---|
| `rule_violation` | A written rule was broken; requires an exact pointer |
| `operator_note` | The operator recorded a manual correction |
| `blind_spot` | A real issue has no applicable rule yet |
| `defect` | A defect a gate should have caught |
| `nit` | A preference with no rule behind it |

The envelope also binds each finding to its gate, roster, tier, and lane
manifest. Without that context, zero may mean no review rather than no
problems. Adherence is a floor based on detected events, not a true rate.

## Ledger and injection

`agent-os/learned-rules.json` keeps project active rules, conflicts, and retired
rules. Allowed targets and enforcement levels are validated; a prose rule
cannot accidentally become blocking.

During Planning, the scheduler matches active rules to each lane's ownership
and pastes only relevant rules into its prompt inside an untrusted-data fence.
Injection closes the loop: a rule affects behavior only when it reaches the
capability making the change.

## Refine

Refine runs after Judge and before `awaiting_confirmation`. It reads the
findings window, gate report, ledger, and adherence history and returns a
bounded proposal per component.

Refine:

- cannot edit, run shell, delegate, or access external directories;
- does not appear in the Judge payload or verdict;
- cannot approve its own proposal;
- cannot change governing numbers;
- writes nothing on its own.

Literal text, target, source findings, and refutation mechanism are shown to
the operator. Rules that can block and high-risk effects preserve human
approval. A rule lands after code as a separate change because the rulebook is
inside the gate source hash.

## Permissions

`opencode.jsonc` declares agent-specific permissions, and
`harness-permission-policy.ts` backs the read-only roster. Reviewers return
results to the scheduler; `refiner` and `rule-verifier` have no write path.
These policies reduce blast radius but are not an operating-system sandbox.
Configuration changes require a restart before they affect the OpenCode
process.

## What is live

- Deterministic findings and ledger schemas and validation.
- Measured gates, risk routing, and fail-closed behavior.
- Manifest, injection, typed-review, and Refine contracts.
- Templates with the auto-activation toggle off.
- Automated tests for deterministic paths.

## What is not live or proven

- Automatic prose-rule activation is not active;
  `learned_rules.auto_activate_prose_observe` ships `false`.
- Live model acceptance is not complete; there is no measured-gain or
  full-flow acceptance claim.
- Changed configuration does not affect an already-running OpenCode process
  without a restart.
- Findings measure what reviewers detect; they do not prove complete recall.
- Refine proposes an improvement but cannot guarantee it is correct or
  accepted.

See [Use Cases](../adoption/use-cases) to select the right workflow.
