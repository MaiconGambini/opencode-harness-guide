---
name: grill-with-docs
description: Clarify a meaningful codebase change through a one-question-at-a-time interview while maintaining domain terminology and ADRs.
---

# Grill With Docs

Use the existing `grill-me` discipline: investigate facts in the repository, ask only decisions, provide a recommendation, and wait for each answer.

For each decision that settles:

1. Invoke `domain-modeling` when terminology needs clarification or a durable decision qualifies for an ADR.
2. Keep `CONTEXT.md` and `docs/adr/` concise and current when those artifacts exist or are warranted.
3. Once shared understanding is confirmed, route meaningful work to `/prevc` or a focused Agent OS spec.

Do not edit application code until the user confirms the design is understood.
