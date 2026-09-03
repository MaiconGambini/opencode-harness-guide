---
sidebar_position: 2
---

# Portfolio: OpenCode Harness

This page summarizes the work as a verifiable path: problem, method,
implementation, and evidence. It describes the OpenCode adapter and its
continuity mechanisms; it is not a release, adoption, or measured-performance
claim.

## Problem

Agent sessions can spread edits, lose decisions between resumptions, and treat a
conclusion without terminal output as proof. The problem addressed here is
process-oriented: make scope, state, verification, and the next action visible
to the operator.

The repository does not present these risks as production metrics. They are the
documentary motivation for the PREVC contract and continuity artifacts.

## Method

PREVC defines the shared lifecycle contract: prepare, execute, validate, and
confirm, with seven stages grouped into four operational phases. The approved
plan limits what may be executed; validation collects evidence; confirmation
remains an operator decision. See the [PREVC contract](./concepts/prevc) and the
[evidence ladder](./concepts/evidence-and-handoff).

OpenCode is this tree's methodological adapter. It combines instructions,
skills, plugins, and on-disk state to support continuity between sessions. Oh My
Pi has a native parallel-dispatch engine; that distinction does not make the two
runtimes one implementation.

## Implementation

### Continuity between sessions

The `harness-session-start` skill in `skills/harness-session-start/SKILL.md`
reads root instructions, progress and feature state when present, handoff,
startup, and quality posture. `docs/harness/progress.md` is one state path the
skill searches; it is not present in this public checkout. The same applies to
`docs/harness/session-handoff.md`, which is read when it exists.

### PREVC and scope control

`website/docs/concepts/prevc.md` documents the contract and state transitions.
The `opencode.jsonc` configuration, skills, and plugins implement the OpenCode
adapter at runtime. The [first-session guide](./getting-started/first-session)
shows how to start the flow without confusing a proposal with approval.

### Quality reports and observability

`scripts/harness-quality-gate.mjs` contains the measured gate and writes Markdown
and JSON reports to `docs/harness/quality/` when run. The
`harness-quality-gate` and `harness-quality-snapshot` skills guide the gate and
snapshot reading, respectively. The
`plugins/harness-tool-activity.ts` plugin records redacted activity in
`.opencode/state/tool-activity.jsonl`; that log is observational and does not
prove completion.

## Evidence

### Evidence available in this checkout

- The contracts and limits are documented in [PREVC](./concepts/prevc), the
  [limitations](./adoption/limitations), and the [artifacts](./reference/artifacts)
  pages.
- The cited implementation is present in `opencode.jsonc`, `plugins/`,
  `scripts/harness-quality-gate.mjs`, and `skills/`.
- The [first-session page](./getting-started/first-session) preserves the
  documented operational path.

### Evidence limits

This checkout contains neither `docs/harness/progress.md` nor reports in
`docs/harness/quality/*.json`. Therefore this page does not declare a green gate,
live acceptance, improved liveness, performance gain, or adoption. Those results
require a real run, captured output, and an operator acceptance decision.
