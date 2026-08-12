---
sidebar_position: 3
---

# PREVC

PREVC is the lifecycle controller. Agents, skills, and plugins provide
bounded capabilities; none of them decides on its own that the work is done.

## Phases

```text
OPERATOR MAKES A REQUEST
        |
        v
CONTEXT FEEDFORWARD
        |-- reads relevant rules, state, handoff, and standards
        |-- discovers risk, stack, and the verification command
        v
PLAN
        |-- defines objective, scope, non-scope, and observable AC
        |-- splits the work into WIP=1 units when needed
        v
OPERATOR APPROVAL
        |-- the operator reviews and confirms the plan
        v
REVIEW -> EXECUTE -> VALIDATE -> JUDGE
        |-- each phase stays within the approved scope
        |-- failure, ambiguity, or escalation stops the flow
        v
REFINE
        |-- reads typed findings and may propose an improvement
        |-- does not write or participate in the Judge verdict
        v
AWAITING CONFIRMATION
        |-- the operator reviews the evidence and receives the handoff
        v
HANDOFF
```

## How to use

Start PREVC with the task description:

```text
/prevc Add a health check endpoint
```

- Prepares the plan (objective, scope, non-scope, and AC).
- Stops at `awaiting_plan_approval`, waiting for your confirmation.

Once you approve, run:

```text
/prevc run
```

- Executes within the approved scope.
- Validates the result and delivers the handoff.

## PREVC and `/goal`

`/prevc` orchestrates the lifecycle. `/goal` stores the objective, the
approved plan, and the evidence. They work together, with different
responsibilities.

```text
/prevc prepare <objective>
        v
goal: awaiting_plan_approval
        v
/goal confirm
        v
/prevc run <goal-id>
        v
PREVC: Review -> Execute -> Validate -> Judge
        v
workflow-only awaiting_confirmation
```

| Action | Result |
|---|---|
| `/prevc prepare <objective>` | Discovers context, classifies risk, and prepares the plan. |
| `/goal confirm` | Records explicit plan approval and releases execution. |
| `/prevc run <goal-id>` | Executes only the approved scope, with budgets and gates. |
| `/goal revise <reason>` | Requests a revision; the reason cannot be empty. |
| `/goal submit-revision <summary>` | Submits a revised plan for new approval. |
| `/goal abort <reason>` | Aborts the objective with a durable reason. |

## Persisted goal states

The current storage persists only:

- `awaiting_plan_approval`
- `revision_requested`
- `active`
- `aborted`

`awaiting_confirmation` is a PREVC workflow label, **not** a persisted final
state. It exists to prevent a Judge review from being mistaken for a durable
completion.

## Why there is no auto-completion

An agent message saying it ran a command is **not** a reliable receipt from
the runtime. The evidence fields store command, workspace, exit code, and
verifier, but they remain informational.

As long as there are no reliable execution receipts, no automatic transition
to final completion will be enabled. This limit is intentional: the system
prefers to stop at review rather than record a completion it cannot prove.

## PREVC rules

- WIP=1 always.
- Completion requires real evidence.
- Do not touch files outside the scope.
- Adjacent work becomes `not_started`.
- If verification fails, the feature is marked `blocked`.
- If the Judge is not Accept, it does not confirm.
- Refine does not alter the Judge result or approve rules.

## Next step

See [Continual Harness v1.3](./continual-harness-v1-3) for findings, Refine, and
rule injection, or [WIP=1](./wip-one) for execution discipline.
