---
sidebar_position: 1
---

# Why a harness?

When developers use AI assistants directly in a terminal, they quickly face
four structural failures:

1. **Runaway edits across multiple files:** the agent tries to solve a narrow
   problem and changes unrelated modules, creating huge, noisy diffs.
2. **Broken builds:** the agent declares victory without checking compilation or
   dependency integrity.
3. **Test hallucination:** the model reports that "tests passed" without running
   the test command.
4. **Context loss between sessions:** decisions, prior solutions, and blockers
   disappear when the terminal closes or restarts.

The PREVC contract turns AI assistance into a deterministic engineering flow,
governed by rules on disk, executable checks, and auditable transitions.

## Structural comparison

| Unassisted AI chat | Engineering with a harness |
|---|---|
| **Runaway edits:** changes spread across unrelated files. | **Bounded scope:** each lane declares file ownership. |
| **Broken build:** success is declared without verification. | **Required verification:** completion waits for objective checks. |
| **Test hallucination:** results are asserted without a command. | **Real evidence:** terminal output and evidence rungs are required. |
| **Context loss:** each session starts from zero. | **Durable continuity:** state, blockers, and handoff survive on disk. |

> **PREVC contract:** the seven stages `prepare → plan → execute → validate →
> judge → refine → confirm` are grouped into four phases: Prepare, Execute,
> Validate, and Confirm. Each transition requires evidence from the prior stage.

## What the harness answers

Before any significant change, the harness answers:

1. Where am I and what rules does this repository have?
2. What has already been done and what is blocked?
3. What is the single active unit of work?
4. How will I prove that the change worked?
5. Who decides whether the result can be accepted?
6. What does a next session need to read in order to continue?

## How this is implemented in OpenCode

- **Shared contract:** PREVC defines phases, WIP=1, evidence, and human
  confirmation for OpenCode and Oh My Pi.
- **Methodological adapter:** OpenCode provides durable state, multi-session
  continuity, plugins, and skills that implement the contract in this tree.
- **Auditable evidence rungs:** executable evidence (Rungs 1 through 5) is
  required before advancing phases or allowing handoff.

## What the harness does NOT do

- It does not make the agent autonomous.
- It does not replace human review.
- It does not provide an operating-system sandbox.
- It does not make code quality automatic — it requires traceable evidence.

## Core principle

The repository is the system of record. State that lives only in chat is not
trustworthy state.
