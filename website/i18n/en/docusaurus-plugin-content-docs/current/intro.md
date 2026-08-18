---
sidebar_position: 1
slug: intro
---

# Introduction

The OpenCode Harness turns OpenCode from an agent that "rediscovers everything
each session" into an agent that keeps state, respects WIP=1, produces
evidence, and hands off cleanly between sessions.

## What's new in v1.4

v1.4 adds a **recoverable-context and loop-detection** layer on top of v1.3's
continual loop:

- **Minimal durable state** — a `docs/harness/progress.md` that answers the
  single next action, plus a **derived briefing** (`scripts/harness-briefing.mjs`)
  stamped with a `sourceHash` that refuses stale context.
- **Loop / slop detection** — the tool-activity plugin now records session,
  outcome, and duration, and injects an **advisory reminder** when the same call
  repeats with no progress (never blocks).
- **Advisory wall-clock benchmark** — `scripts/harness-benchmark.mjs` measures
  per-phase wall-clock to calibrate effort routing; duration is never a gate.
- **Scheduler-only regression** — the heavy suite runs once over the reconciled
  tree, not per lane; the cheap "a fix needs a test" rule still blocks per lane.

> **Honest:** live acceptance of v1.3's continual loop (table C, C1–C16) —
> injection reaching a lane, findings from a real run, liveness numbers — has
> **not** been executed yet. v1.4's capabilities go live after an OpenCode
> restart. See [Use Cases](./adoption/use-cases) for the new workflows.

## What you'll find

| Section | What it covers |
|---|---|
| **[Getting Started](./getting-started/installation)** | Step-by-step installation and first session. |
| **[Concepts](./concepts/why-a-harness)** | PREVC, WIP=1, evidence, the seven components, and the limits of automation. |
| **[Guides](./guides/small-task)** | End-to-end flow for small and complex tasks. |
| **[Reference](./reference/commands)** | All commands, skills, and artifacts. |
| **[Adoption](./adoption/use-cases)** | Use cases, pros and cons, security, and limitations. |
| **[FAQ](./troubleshooting/faq)** | Common problems and solutions. |

## Prerequisites

- Windows with PowerShell 5.1+
- OpenCode installed
- Node.js 20+
- Git

## Quick install

> **Clean install:** if `~/.config/opencode` already exists with your own files, rename the folder to `opencode-backup` **before** cloning — there is no automatic merge. Step 1 of the [full installation guide](./getting-started/installation) shows the exact command.

Clone the repository into the OpenCode configuration and install the dependencies:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

What happens:

- The repository is cloned straight into `~/.config/opencode`, where OpenCode reads its configuration.
- `npm install` downloads the dependencies for the plugins and scripts.
- The files become available to OpenCode on its next startup.

[Full installation guide &rarr;](./getting-started/installation)

## The principle

The Harness does not try to replace the operator. It makes clear what was
requested, what was approved, what was executed, what was verified, and what
the next safe action is. Everything else in this documentation is a detail of
that principle.
