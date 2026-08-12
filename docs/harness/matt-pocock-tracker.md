# Harness Tracker — local-markdown

This is the tracker configuration the `wayfinder`, `to-tickets`, `grill-with-docs`,
and `implement` skills consult (they otherwise ask you to run
`/setup-matt-pocock-skills`, which this harness does not use). It is **global**, so
every project gets it with zero per-project setup — the pipeline in `spec-lead`
injects it during planning.

**Backend:** local markdown files. No external issue tracker, no `gh`, no network.
Tickets live beside the spec they belong to:

```
agent-os/specs/<YYYY-MM-DD-HHMM-slug>/
  spec.md            # from agent-os/specs/_template
  tickets/           # THE canonical task list — one file per ticket, dependency order
    00-map.md        # wayfinder map (only for size-gated large efforts)
    01-<slug>.md     # tracer-bullet ticket (Blocked by: None)
    02-<slug>.md     # Blocked by: 01
```

The `tickets/` set **is** the task list — "all tasks in the plan" means the ticket
set, and the scheduler reads it directly as the lane table. There is no separate
`tasks.md` step; if the `agent-os/specs/_template` ships a `tasks.md`, treat it as an
optional human-readable index of the tickets, not the source of truth.

If no harness spec folder applies (ad-hoc work outside a spec), fall back to
`.scratch/<feature-slug>/issues/<NN>-<slug>.md`.

## To-tickets operations

- One file per ticket under `tickets/`, numbered from `01` in dependency order
  (blockers first).
- Blocking edges are **text**: each ticket's `Blocked by:` lists the numbers/titles
  of the tickets that gate it, or `None — can start immediately`.
- The **frontier** is any ticket whose blockers are all done. These are the lanes the
  `spec-lead` scheduler may dispatch in parallel. A ticket = a lane: one owner, a
  declared file-ownership set, dependencies, and a verification command.
- Do not paste code or file paths into ticket bodies; describe end-to-end behaviour.

## Wayfinding operations

Only for size-gated large efforts (more than one agent session, or foggy /
cross-subsystem). Expressed locally:

- **The map** is `tickets/00-map.md`, labelled by its heading `# wayfinder:map`. It
  holds Destination, Notes, Decisions-so-far, Not-yet-specified, and Out-of-scope.
- **Child tickets** are the other files in `tickets/`. A ticket's `Type:` line carries
  its `research | prototype | grilling | task` kind.
- **Claiming**: since this is single-driver local, a ticket is claimed by setting its
  `Status:` to `in-progress`; open + `ready` = unclaimed.
- **Blocking / frontier**: same text `Blocked by:` convention as above. The frontier
  is the set of open tickets whose blockers are all closed.
- **Resolution**: append the answer as a `## Resolution` section in the ticket, set
  `Status: done`, and add a one-line gist + link under the map's Decisions-so-far.

## Automation note

When a scheduler runs this in an authorized autonomous run, the `to-tickets`
"Quiz the user" step and any `grill-with-docs` questions do **not** pause inline —
they fold into PREVC's single `awaiting_plan_approval` gate. Grilling runs in AUTO
mode (self-resolved, assumptions labelled). See `spec-lead` Planning role.
