---
sidebar_position: 5
---

# Evidence and Handoff

The harness requires evidence for every completion — "it worked on my machine"
is not enough.

## Evidence ladder (Evidence Rungs 1–5)

To remove ambiguity about what counts as proof, the harness classifies evidence
into five increasingly rigorous rungs:

1. **Rung 1 — Chat assertion (Not accepted):** the agent merely says the code
   works or the bug is fixed. It has no probative value and is never accepted
   for a phase transition or task closure.
2. **Rung 2 — Static diff inspection:** showing the textual diff or changed file.
   It proves that characters reached disk, not compilation, valid syntax, or
   logical correctness.
3. **Rung 3 — Deterministic static verification:** successful `tsc --noEmit`,
   lint, schema validation, or compilation with exit code 0. It proves
   structural and type integrity.
4. **Rung 4 — Automated test suite:** terminal execution of tests such as
   `pytest`, `vitest`, or `npm test`, with captured logs and passing assertions.
5. **Rung 5 — Real runtime verification (Live system):** a real process starts,
   real network calls or HTTP requests run, and response logs are observed.

## Verification layers

Before declaring a feature complete, three structured layers are verified:

1. **Static (Rung 3)** — typecheck, lint, and schema validation pass.
2. **Runtime (Rungs 4–5)** — contract criteria are observable, commands ran,
   and real output was recorded.
3. **System** — the project's unified verification command exits 0, and disk
   state reflects completion.

## Evidence example

```json
{
  "id": "feat-005",
  "status": "passing",
  "evidence": "curl /api/health -> 200 OK, ruff check: OK, pytest: 23 passed, init.ps1: both stacks OK"
}
```

Evidence contains real output, not a description of what should happen.

## Handoff

Every session ends with `harness-clean-handoff`. It fills in:

- **Verified Now** — what was completed in this session.
- **Changed** — modified files.
- **Broken** — what broke, if anything.
- **Next Best Step** — the single next action.

If the work is unfinished, handoff still happens. The feature becomes `blocked`
with the exact cause, and **Next Best Step** says exactly what to do.

## OpenCode versus Oh My Pi for evidence collection

- **OpenCode as the compliance standard:** OpenCode formalizes evidence policy,
  defines the rung ladder as a PREVC transition prerequisite, and requires
  durable artifacts (`progress.md` and `session-handoff.md`).
- **Oh My Pi as a Rung 5 executor:** Oh My Pi provides native supervised process
  tooling for real services, readiness logs, network requests, and auditable
  event traces.
- **When to use the OMP path:** when validation requires multiple local services,
  real end-to-end tests, or telemetry collection without manual intervention.

## Next step

See [PREVC](./prevc) for the delivery lifecycle or [WIP=1](./wip-one) for execution focus.
