---
name: prototype
description: Build a throwaway prototype to answer a specific UI, state-model, or behavior question before production implementation.
---

# Prototype

A prototype answers one question. It is not production code.

1. State the question and choose the smallest artifact that can answer it.
2. For state or logic, create a tiny runnable harness that exposes state after every action.
3. For UI, create two or more deliberately different variations that are easy to compare.
4. Use in-memory state by default. Avoid abstractions, persistence, polish, and production-grade error handling.
5. Give the prototype one documented run command.
6. Capture the decision in the relevant spec, ADR, or handoff. Delete the prototype or keep it outside production paths after the decision is made.

Use this before PREVC implementation only when discussion cannot settle the design question.
