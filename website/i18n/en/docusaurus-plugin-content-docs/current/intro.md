---
sidebar_position: 1
slug: intro
---

# Introduction

The OpenCode Harness turns OpenCode from an agent that "rediscovers everything
each session" into an agent that keeps state, respects WIP=1, produces
evidence, and hands off cleanly between sessions.

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
