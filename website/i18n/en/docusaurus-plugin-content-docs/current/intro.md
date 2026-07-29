---
sidebar_position: 1
slug: intro
---

# Introduction

OpenCode Harness turns OpenCode from an agent that "rediscovers everything
every session" into an agent that maintains state, enforces WIP=1, produces
evidence, and performs clean handoffs between sessions.

## What you'll find

- **[Getting Started](./getting-started/installation)** — 3-step install and
  first session.
- **[Concepts](./concepts/why-a-harness)** — PREVC, WIP=1, evidence, and the
  seven components.
- **[Guides](./guides/small-task)** — full workflow for small and complex
  tasks.
- **[Reference](./reference/commands)** — all commands, skills, and artifacts.
- **[Adoption](./adoption/use-cases)** — use cases, pros and cons, security,
  and limitations.
- **[FAQ](./troubleshooting/faq)** — common issues and solutions.

## Prerequisites

- Windows with PowerShell 5.1+
- OpenCode installed
- Node.js 20+
- Git

## Quick install

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

[Full installation guide &rarr;](./getting-started/installation)
