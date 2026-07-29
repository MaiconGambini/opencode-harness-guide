---
name: domain-modeling
description: Establish or refine project terminology and durable architectural decisions. Use when domain terms are ambiguous, overloaded, or inconsistent with code.
---

# Domain Modeling

Maintain a precise shared language without turning documentation into a second specification.

1. Read `CONTEXT.md` and applicable `docs/adr/` entries when they exist.
2. Challenge vague or overloaded terms with concrete scenarios. Verify stated behavior against the code when possible.
3. When a term is resolved, update `CONTEXT.md` immediately. Keep it implementation-free: terms, meanings, relationships, and examples only.
4. Create an ADR only when a decision is hard to reverse, surprising without context, and chosen from real alternatives.
5. Use the established terms consistently in specs, tickets, tests, and code proposals.

Create `CONTEXT.md` or `docs/adr/` lazily and only with user-approved or already-settled decisions.
