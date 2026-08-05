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
