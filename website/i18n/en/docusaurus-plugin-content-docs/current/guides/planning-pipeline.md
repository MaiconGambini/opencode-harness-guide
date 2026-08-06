---
sidebar_position: 0
---

# How plans are made (v1.1)

As of v1.1, planning is no longer a heavy step — it is a **fixed pipeline** inside
PREVC's PLAN phase. The result is more consistent, with less slop, and faster than
the old `/shape-spec` flow.

## The problem with the old flow

`/shape-spec` (Agent OS) produced `spec.md`, `plan.md`, `tasks.md`, `decisions.md`,
`verification.md`, and `evals.md` all at once, upfront. It was slow, and lane
decomposition was written "by hand" by the model — inconsistent and slop-prone.
`/shape-spec` still exists as a **manual escape hatch**, but it is no longer the
default path.

## The pipeline (`/plan`)

`spec-lead` plans in three steps, sizing the depth to the work:

```text
/plan <objective>
        |
        v
1. SIZE-GATE  -> wayfinder  (only large/foggy/cross-subsystem work)
        |          map of decision-tickets; resolve decisions first
        v
2. SHARPEN    -> grill-with-docs (AUTO mode)
        |          self-interview + domain-modeling, decides on its own,
        |          labels assumptions, writes ADRs/glossary
        v
3. DECOMPOSE  -> to-tickets = the LANE TABLE
        |          tracer-bullet vertical slices with blocking edges
        v
awaiting_plan_approval  (the operator reviews and approves once)
```

### 1. Size-gate → wayfinder (large only)

If the effort is larger than one agent session, foggy, or cross-subsystem,
`wayfinder` draws a **map of decision-tickets** (`tickets/00-map.md`) and resolves
the open decisions first. Normal work **skips** this step — wayfinder's own rule is
"no fog, no map".

### 2. Sharpen → grill-with-docs (AUTO)

`grill-with-docs` runs in **AUTO mode**: it does not pause to ask the operator. It
walks every branch of the decision tree and **takes its own recommended answer**,
resolving from the code, ADRs, `CONTEXT.md`, and requirements. Each answer becomes a
decision; the ones it resolved on its own are **labeled as assumptions** for the
operator to see at review. ADRs and glossary are written via `domain-modeling`.

It only escalates to the operator on a **real blocker**: an ambiguity no source can
settle, a hard-to-reverse decision with no defensible default, or a scope change.
This is the same halt bar as an autonomous run.

### 3. Decompose → to-tickets = the lane table

`to-tickets` breaks the sharpened plan into **tracer-bullet vertical slices** under
`agent-os/specs/<slug>/tickets/`, each declaring its blocking edges. **A tracer-bullet
ticket IS a lane**: vertical, sized to one context window, with a single owner. From
each ticket comes the lane's exact file-ownership set, its dependencies (the blocking
edges), and its verification command.

The to-tickets "Quiz the user" step does **not** pause inline — it folds into PREVC's
single `awaiting_plan_approval` gate.

## Where the tickets live

Local-markdown backend, no external tracker, no `gh`, no network:

```text
agent-os/specs/<YYYY-MM-DD-HHMM-slug>/
  spec.md            # from the agent-os template
  tickets/           # THE canonical task list — one file per ticket
    00-map.md        # wayfinder map (large efforts only)
    01-<slug>.md     # ticket (Blocked by: None)
    02-<slug>.md     # Blocked by: 01
```

The `tickets/` set **is** the task list: "all tasks in the plan" = the ticket set,
and the scheduler reads it directly as the lane table. The full convention lives in
`docs/harness/matt-pocock-tracker.md` (global, installed into a new project by
`/harness-bootstrap`).

## Execute: implement, no race

After approval, `spec-lead` becomes the scheduler (see
[parallel dispatch](./parallel-dispatch)). Each lane is executed by a specialist
following the `implement` skill's discipline — TDD at agreed seams, typecheck and
per-file tests, full suite at the end, then code review.

**Specialists do not commit.** Only the scheduler commits, reconciling all lanes into
one local commit — so parallel lanes never race on git. One lane writes one file at a
time.

## Plan + execute in a single session

`spec-lead` can plan **and** execute in the same session:

- It may write planning artifacts (spec, `tickets/`, ADRs, `CONTEXT.md`,
  `feature_list.json`) during planning.
- It may edit source directly when working **sequentially** (e.g. doing task 1
  itself before any dispatch).
- **It never edits while parallel specialists are in flight** — there the lanes own
  their files; only they edit and only the scheduler commits.

## Summary

| | Old (`/shape-spec`) | New (`/plan`, v1.1) |
|---|---|---|
| Speed | slow (upfront ceremony) | fast (auto-grill + generated tickets) |
| Consistency | lanes written by hand | tracer-bullet slice = rigid contract |
| Decisions | mixed | decisions + labeled assumptions |
| Lane table | separate artifact | **is** the ticket set |
| Interaction | pauses | a single approval gate |
