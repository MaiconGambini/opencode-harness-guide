---
sidebar_position: 1
slug: intro
---

# Introduction

Building with AI agents in real projects often produces four universal pains:

1. **Runaway edits across multiple files:** the agent touches files beyond the
   request, introducing accidental refactors and diffs that are hard to review.
2. **Broken builds:** the assistant reports success too early, leaving compile,
   type, or packaging errors behind.
3. **Test hallucination:** the model claims that "all tests passed" without
   running a terminal command.
4. **Context loss between sessions:** decisions, blockers, and work state vanish
   when the session closes.

The OpenCode Harness structures these problems as a rigorous, measurable
engineering process for interaction between the developer and the agent.
### Comparison: Traditional chat vs harness engineering

| Unassisted AI chat | Engineering with a harness |
|---|---|
| **Runaway edits:** changes spread across unrelated files. | **Bounded scope:** each lane declares file ownership. |
| **Broken build:** success is declared without verification. | **Required verification:** completion waits for objective checks. |
| **Test hallucination:** results are asserted without a command. | **Real evidence:** terminal output and evidence rungs are required. |
| **Context loss:** each session starts from zero. | **Durable continuity:** state, blockers, and handoff survive on disk. |

### Contract and runtime positioning

PREVC is the shared lifecycle contract. It groups seven stages into four
operational phases:

- **Prepare** = `prepare` + `plan`: discovers context, risk, and scope.
- **Execute** = `execute`: implements only the approved plan.
- **Validate** = `validate` + `judge`: collects evidence and performs an independent evaluation.
- **Confirm** = `refine` + `confirm`: presents improvements and waits for the operator's decision.

OpenCode is this tree's methodological adapter: it provides multi-session
continuity, durable state, plugins, and skills. Oh My Pi has a native
parallel-dispatch engine and its own coordination. The contract is shared;
installation, runtime-specific commands, and implementation details are not.

### Documentation authority and version status

`website/docs/` is the canonical source for this tree. [Continual Harness
v1.3](./concepts/continual-harness-v1-3) preserves the continual-contract
baseline. The increments described below as v1.4 are changes in this tree under
acceptance, not a formal release. Configured capabilities should be presented as
active only when corresponding acceptance evidence exists.

## Documented increments in the v1.4 series

The current tree adds a layer of **recoverable context, durable state, and
measured quality** to the baseline continual loop:

- **Minimal durable state** — when present in a project,
  `docs/harness/progress.md` records the next action, blockers, and relevant
  decisions.
- **Session resume** — the `harness-session-start` skill rereads instructions,
  progress and feature state, handoff, startup, and quality posture.
- **Quality reports** — `scripts/harness-quality-gate.mjs` writes reports to
  `docs/harness/quality/`; the `harness-quality-gate` and
  `harness-quality-snapshot` skills guide reading, gating, and snapshotting
  those reports.

These mechanisms structure continuity and evidence; they do not replace
operator acceptance or claim that quality is automatic.

> **Acceptance status:** live acceptance of the v1.3 baseline, including
> injection reaching a lane, findings from a real run, and liveness numbers, has
> not been executed. Capabilities in this series become available after an
> OpenCode restart. See [Use Cases](./adoption/use-cases) for the documented flows.

## What you'll find

| Section | What it covers |
|---|---|
| **[Getting Started](./getting-started/installation)** | Step-by-step installation and first session. |
| **[Concepts](./concepts/why-a-harness)** | PREVC, WIP=1, evidence, the seven components, and automation limits. |
| **[Guides](./guides/small-task)** | Complete flows for small and complex tasks. |
| **[Reference](./reference/commands)** | Commands, skills, and artifacts. |
| **[Adoption](./adoption/use-cases)** | Use cases, pros and cons, security, and limitations. |
| **[FAQ](./troubleshooting/faq)** | Common problems and solutions. |

## Prerequisites

- Windows with PowerShell 5.1+
- OpenCode installed
- Node.js 20+
- Git

## Quick install

> **Clean install:** if `~/.config/opencode` already exists with your own files,
> rename it to `opencode-backup` **before** cloning — there is no automatic
> merge. Step 1 of the [full installation guide](./getting-started/installation)
> shows the exact command.

Clone the repository into the OpenCode runtime configuration and install the
dependencies pinned by the lockfile:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm ci
```

What happens:

- The repository is cloned into `~/.config/opencode`, where OpenCode reads its configuration.
- `npm ci` installs the runtime dependencies exactly from the lockfile.
- Close and reopen OpenCode so it loads the configuration on its next startup.

[Full installation guide &rarr;](./getting-started/installation)

## The principle

The Harness does not try to replace the operator. It makes clear what was
requested, what was approved, what was executed, what was verified, and what
the next safe action is. Everything else in this documentation is a detail of
that principle.
