---
sidebar_position: 1
---

# Why a harness?

Without a harness, OpenCode responds to a prompt but does not know what
happened in the previous session, which task was left open, which command
proves a change, or when it should stop.

The Harness solves this with rules, durable state, verification, and handoff.

## The problem it avoids

| Without Harness | With Harness |
|---|---|
| Each session rediscovers the project | The session reads instructions, state, and handoff |
| Multiple ideas turn into parallel work | WIP=1 keeps a single active unit |
| "Done" is an opinion | Completion requires evidence and a Judge |
| An error gets lost in the chat history | The blocker is recorded for the next session |
| Skills and plugins accumulate behavior | PREVC controls the lifecycle |

## What the harness answers

Before any significant change, the harness answers:

1. Where am I and what rules does this repository have?
2. What has already been done and what is blocked?
3. What is the single active unit of work?
4. How will I prove that the change worked?
5. Who decides whether the result can be accepted?
6. What does a next session need to read in order to continue?

## What the harness does NOT do

- It does not make the agent autonomous.
- It does not replace human review.
- It does not provide an operating system sandbox.
- It does not guarantee code quality — it guarantees traceability.

## Core principle

The repository is the system of record. State that lives only in the chat
is not trustworthy state.

## Why this is better (with a result)

A single giant instruction file (600+ lines) eats 10-15% of the context,
mixes critical rules with optional ones, and suffers the "lost in the middle"
effect — important rules buried at line 300 get ignored. The harness splits
this into short instructions + state + verification, loading only what matters.

**Result** (*Learn Harness Engineering* study): replacing a 600-line file with
80 lines + topic documents raised a team's success rate from **45% → 72%** and
security compliance from **60% → 95%**.

## Next step

See [The seven components](./seven-components) — the lenses that verify the
workflow is complete.
