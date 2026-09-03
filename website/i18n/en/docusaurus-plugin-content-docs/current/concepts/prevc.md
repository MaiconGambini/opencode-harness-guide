---
sidebar_position: 3
---

# PREVC

PREVC is the shared lifecycle contract for the harness. It groups seven stages
into four phases: Prepare (`prepare` + `plan`), Execute (`execute`), Validate
(`validate` + `judge`), and Confirm (`refine` + `confirm`). No agent changes code
without an approved plan, and no task is complete without real evidence.

## The senior-engineering delivery analogy

Think of PREVC as an engineering flow used before sending code to production:

1. **Prepare:** the agent inspects the repository, measures risk, and proposes a plan.
2. **Execute:** with the plan approved, it implements under WIP=1 and file ownership.
3. **Validate:** it runs checks and receives an independent Judge evaluation.
4. **Confirm:** it presents Refine to the operator, who decides whether the work can finish.

## The four-stage flow

Plan approval, review, Judge, and Refine are controls within the four phases.
Approval releases **Execute**; review and Judge reinforce **Validate**; the
operator's decision belongs to **Confirm**.


## Lifecycle flow


```text
┌─────────────────┐
│     PREPARE     │  → prepare + plan: context, risk, and plan
└────────┬────────┘
         │ [Operator approval required]
         ▼
┌─────────────────┐
│     EXECUTE     │  → execute: implementation within approved scope
└────────┬────────┘
         │ [Code produced]
         ▼
┌─────────────────┐
│    VALIDATE     │  → validate + judge: gates, tests, and independent evaluation
└────────┬────────┘
         │ [Evidence and improvement proposal]
         ▼
┌─────────────────┐
│     CONFIRM     │  → refine + confirm: final operator decision
└─────────────────┘
```

## OpenCode and Oh My Pi: contract and adapters

- **PREVC:** shared contract for phases, evidence, WIP=1, and human confirmation.
- **OpenCode:** this tree's methodological adapter, with multi-session
  continuity, durable state, plugins, and skills.
- **Oh My Pi:** native parallel-dispatch engine and its own coordination. The
  contract stays the same; runtime mechanisms vary.

## OpenCode and Oh My Pi

OpenCode is the source and methodological reference for this contract. It
provides durable state and multi-session continuity; Oh My Pi provides the native
parallel-dispatch engine when independent lanes need to run together.


## Basic usage

The shortest OpenCode path is `/prevc prepare <objective>` followed by
`/prevc run` after plan approval. The phase sections below explain the evidence
and ownership expected at each step.

## How to use in OpenCode

### Prepare

Start by reading the relevant context, rules, state, and handoff. Classify risk,
identify the verification command, and write the objective, scope, non-scope,
acceptance criteria, dependencies, and plan.

```text
/prevc prepare Add a health check endpoint
```

- Discovers context, classifies risk, and prepares the plan.
- Stops at `awaiting_plan_approval`, waiting for your confirmation.

### Execute

After approval, change only the approved scope. Keep ownership and dependencies
explicit, and preserve WIP=1 for each active unit.

```text
/prevc run
```

- Executes within the approved scope.
- Delivers the handoff after validation.

### Validate

Run the defined checks and record commands, workspace, output, and exit code.
Use independent gates when the risk requires them; missing or ambiguous evidence
stops the flow rather than closing it automatically.

### Confirm

The operator reviews the result, evidence, and handoff. Acceptance records
completion; revision returns to planning; abort records the reason.


## OpenCode-specific command: `/goal`

`/goal` is an optional plugin for tracking long-term objectives. It is not
required by PREVC, does not replace its durable phase, and is not invoked by
`/prevc`.

Use it only when you need objective, plan, and evidence separate from the
lifecycle:

```text
/goal confirm
/goal revise <reason>
/goal submit-revision <summary>
/goal abort <reason>
```

`/prevc run` does not require a `goal-id`. The PREVC lifecycle remains controlled
by its own phases and by explicit operator confirmation.

## Why there is no auto-completion

An agent message saying it ran a command is **not** a reliable runtime receipt.
Evidence fields store the command, workspace, exit code, and verifier, but remain
informational.

Until reliable execution receipts exist, no automatic transition to final
completion is enabled. This limit is intentional: the system prefers to stop at
review rather than record a completion it cannot prove.

## PREVC rules

- WIP=1 always.
- Completion requires real evidence.
- Do not touch files outside the scope.
- Adjacent work becomes `not_started`.
- If verification fails, the feature remains `blocked` with an explicit cause.
- If the Judge does not return `accept`, do not confirm.
- Refine does not alter the Judge result or approve rules.

## Next step

See [Continual Harness (v1.3 baseline)](./continual-harness-v1-3) for findings,
Refine, and rule injection, or [WIP=1](./wip-one) for execution discipline.
