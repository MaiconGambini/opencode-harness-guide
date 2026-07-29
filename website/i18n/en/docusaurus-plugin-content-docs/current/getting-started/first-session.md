---
sidebar_position: 3
---

# First Session

This guide shows how to use the harness in a project for the first time.

## 1. Audit the project

Inside OpenCode, run:

```text
/harness-init
```

- Inspects the project **without modifying anything**.
- Looks for project instructions (AGENTS.md, CLAUDE.md).
- Looks for progress state, the feature list, and verification commands.
- Checks skills, plugins, and security.
- Produces a gap report — what exists, what's missing, and what would be created.

## 2. Install the full package (optional)

If the project is new or you want to standardize it:

```text
/harness-bootstrap
```

- Proposes a full package with explicit confirmation.
- Detects the project's stack.
- Shows each file as **create**, **merge**, or **skip** before writing.

## 3. Start the session

Every productive session begins with:

```text
/harness-session-start
```

- Reads the state, the feature list, the previous handoff, and the verification command.
- At the end, it declares the active task:

```text
Active task: feat-001 — Health endpoint. AC: curl /health returns 200.
```

## 4. Run work with PREVC

For significant work:

```text
/prevc Add a health check endpoint
```

- Manages the lifecycle: it plans, reviews, executes, validates, judges, and confirms.
- Each phase stays within the approved scope.

## 5. End the session

At the end, always run:

```text
/harness-clean-handoff
```

- Records what was done, what broke, and the next action.
- The next session reads these files and knows exactly where to continue.

## Next step

Read [Why a harness?](../concepts/why-a-harness) to understand the
problem the harness solves.
