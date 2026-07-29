---
sidebar_position: 3
---

# Existing Project

How to add the harness to a project that already exists, without breaking what
already works. The principle is always the same: audit before writing, install the
minimum viable, and grow only when a real problem justifies it.

## Step 1: Audit

```text
/harness-init
```

The initializer inspects the project **without writing any file**. It
discovers:

- Existing instructions (`AGENTS.md`, `CLAUDE.md`, `README`).
- The current progress state, if any.
- Verification and startup commands (scripts, Makefile, `package.json`).
- The project's stack (language, frameworks, package manager).

The result is a **gap report**: what already exists and what's missing for the harness
to operate. Nothing is modified in this phase — it's read-only.

## Step 2: Install the minimum viable

For small projects, start with the minimum useful set. Each artifact
solves a concrete failure mode:

| Artifact | Why it exists |
|---|---|
| Short `AGENTS.md` | Rules, entry points, and security boundaries |
| `feature_list.json` or `tasks.md` | WIP control and next units of work |
| Progress file (`STATE.md`) | Blockers and the next action to run |
| Verification command | Objective baseline to say "it's passing" |
| `session-handoff.md` | Resume the context on another day |

Don't install more than this out of the gate. A project that hasn't yet suffered
from context loss doesn't need the full structure.

## Step 3: Or install the full package

When the project is already large or several collaborators use OpenCode, it's worth
installing the full package all at once:

```text
/harness-bootstrap
```

The bootstrap proposes the full package with explicit confirmation. It:

- Detects the stack automatically.
- Discovers how to verify the project (which commands to run).
- Shows each file classified as **create**, **merge**, or **skip**,
  so you can approve before any write.

## Step 4: First session with the harness

After installation, the first real session follows this order:

1. Run the verification command discovered in the audit step.
2. If it fails, **record the error before creating any feature**. A
   harness should not operate on a broken baseline.
3. Fill in or review the feature list with the known work.
4. Ensure WIP=1 — at most one feature `in_progress`.
5. Start every session from then on with `/harness-session-start`.

## Grow on demand

Add the rest of the artifacts (sprint contract, evaluation rubric,
role separation) only when a real failure mode is observed — for
example, when a complex feature goes wrong for lack of a contract. Don't
create bureaucracy without need: the harness should weigh less than the problem
it solves.
