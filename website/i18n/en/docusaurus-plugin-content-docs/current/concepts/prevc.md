---
sidebar_position: 3
---

# PREVC

PREVC is the lifecycle controller. Agents, skills, and plugins provide
limited capabilities; none of them decides on its own that the work is done.

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

## PREVC rules

- WIP=1 always.
- Completion requires real evidence.
- Do not touch files outside the scope.
- Adjacent work becomes `not_started`.
- If verification fails, the feature is marked `blocked`.
- If the Judge is not Accept, it does not confirm.
