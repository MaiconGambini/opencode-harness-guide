---
sidebar_position: 2
---

# Quick start (zero to hero in 5 minutes)

This practical guide puts the OpenCode Harness to work in a project in three
steps, from a clean state to verified delivery with a handoff.

---

## Step 1: Clone and install the harness

Clone the public repository into the OpenCode runtime configuration
(`~/.config/opencode`) and install the runtime dependencies:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm ci
```

Close and reopen OpenCode so it loads the global commands and plugins.

---

## Step 2: Start the first task with PREVC

In the OpenCode terminal, from your project directory, run:

```text
/prevc prepare "Create POST /auth/login with JWT"
```

The harness classifies task risk, discovers the repository's technical context,
and starts the controlled phase transition.

---

## Step 3: Observe the complete lifecycle

PREVC is the shared contract between OpenCode and Oh My Pi. It groups seven
stages into four phases:

1. **Prepare** = `prepare` + `plan`: discovers context, risk, and scope.
2. **Execute** = `execute`: implements the approved plan under WIP=1.
3. **Validate** = `validate` + `judge`: collects evidence and evaluates the result.
4. **Confirm** = `refine` + `confirm`: presents improvements and waits for the operator.

In OpenCode, durable state, plugins, and multi-session continuity implement the
contract. Oh My Pi provides a native parallel-dispatch engine.
