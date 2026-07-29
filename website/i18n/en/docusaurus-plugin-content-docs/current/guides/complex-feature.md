---
sidebar_position: 2
---

# Complex Feature

For multi-component tasks, frontend plus backend, or with significant
ambiguity in the requirements. Here the harness uses the full pipeline:
decomposition into subtasks, role separation, and the sprint contract filled in
before any code.

## When to use the full pipeline

Activate the full pipeline when the prompt has any of these signals:

- Multi-component prompt — for example, a change that spans frontend and
  backend at the same time.
- Ambiguity in the requirements that requires design decisions before coding.
- More than three files expected, or the inability to estimate the scope
  with confidence.

## Step-by-step flow

**Prompt:** `Full-text search on products with filters by category and price,
in the backend (FastAPI) and frontend (Vue).`

### 1. Open the session

```text
/harness-session-start
```

- Reads the current state and runs the baseline verification.
- Confirms there is no other feature `in_progress` — WIP must be free.

### 2. Decompose into subtasks

```text
/harness-wip-control
```

- Breaks the feature into six traceable subtasks (`feat-020` to `feat-025`),
  for example: search schema, full-text index, query endpoint, filters
  by category, filters by price, and the Vue results component.
- Marks `feat-020` as `in_progress`. All others stay `not_started`.
- Keeps WIP=1: only one subtask active at a time.

### 3. Separate the roles

```text
/harness-role-separation
```

- **Planner** — defines scope, acceptance criteria, and the verification plan
  in the sprint contract. This is who decides what's in and what's out.
- **Generator** — implements, iterating over the six subtasks in the order
  planned.
- **Evaluator** — applies the six-dimension rubric to the result, without having
  participated in the generation. This separation reduces self-evaluation bias.

### 4. Run the PREVC cycle on each subtask

For each subtask, the harness iterates:

1. **Review** — reviews the contract and the current state.
2. **Execute** — implements the subtask.
3. **Validate** — runs the verification commands and captures the output.
4. **Judge** — the Evaluator judges against the rubric; if it fails, it goes back to
   Execute with the cause recorded.

Only after a subtask passes does the next one move to `in_progress`.

### 5. Confirm

- Confirmation only happens after **all** six subtasks pass.
- Each one carries its own evidence.

### 6. Handoff

```text
/harness-clean-handoff
```

- Records six `passing` features with evidence and the twelve files touched.
- If something is left pending, the handoff describes the blocker and the next action.

## Summary

**Typical time:** about 30 to 45 minutes.
**Skills used:** 7 — the four from fast mode plus `role-separation`,
`evaluator-rubric`, and `continuity`.

## The sprint contract

For complex features, the sprint contract is filled in BEFORE Execute. It
has four sections, and each one exists to close a door of ambiguity:

- **Scope In** — what will be done, listed without ambiguity.
- **Scope Out** — what will NOT be done. In the example, ElasticSearch,
  autocomplete, and phonetic search are left out. Recording what's left out
  is as important as what's in.
- **AC (Acceptance Criteria)** — observable acceptance criteria, of the kind
  "searching `camiseta` returns only products with the term, ordered by
  relevance".
- **Verification Plan** — the exact commands and success conditions for
  each check (lint, tests, build, real call to the endpoint).

Adjacent work discovered during execution becomes a next task
(`not_started`), never a silent extension of the active task. The sprint
contract is the contract that prevents the scope from growing without approval.
