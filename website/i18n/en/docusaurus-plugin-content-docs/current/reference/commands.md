---
sidebar_position: 1
---

# Commands

Global commands available in OpenCode after installing the harness. Each command runs a global skill or a diagnostic script. This reference lists every command by family and then walks through the step-by-step usage of the main commands.

Names start with `/` when invoked in the OpenCode chat (for example, `/prevc`).

## Overview by family

### Session

| Command | When to use | What it does |
|---|---|---|
| `/harness-session-start` | At the start of every session | Discovers root instructions, progress state, feature state, and startup path; runs the baseline if safe; declares the active task |
| `/harness-clean-handoff` | At the end of every session | Collects evidence, blockers, progress notes, handoff, and git status; returns a handoff report |

### Project

| Command | When to use | What it does |
|---|---|---|
| `/harness-init` | First time in a project | Audits the harness layers without writing anything; produces a gap report with recommended fixes |
| `/harness-bootstrap` | Install the full harness package | Proposes the full package (AGENTS.md, feature_list.json, docs/harness, agent-os) and writes only after confirmation |
| `/harness-standards` | Before planning or implementing | Detects the stack and loads project and global standards; returns applicable risk, validation, permission, and skill profiles |
| `/harness-spec` | Medium or large feature | Creates or proposes an Agent OS spec in `agent-os/specs/YYYY-MM-DD-HHMM-slug/` |

### Work

| Command | When to use | What it does |
|---|---|---|
| `/prevc` | Any significant work | Controls the full lifecycle: Plan, Review, Execute, Validate, Judge, Confirm, and Handoff |
| `/goal` | Track a long-term objective | Command registered by the goal plugin (30-day retention); objective memory separate from PREVC |

### Agent OS

| Command | When to use | What it does |
|---|---|---|
| `/plan-product` | Start product documentation | Creates the base product documentation in `agent-os/product/` |
| `/shape-spec` | Shape a lightweight spec | Models a lean spec in planning mode; does not implement until approved |
| `/discover-standards` | Document code patterns | Discovers existing patterns and creates standards in `agent-os/standards/` |
| `/index-standards` | Rebuild the standards index | Scans `agent-os/standards/` and regenerates the alphabetized `index.yml` |
| `/inject-standards` | Bring standards into context | Reads `index.yml`, suggests relevant standards, and injects the content into the conversation, skill, or planning |

### Security and diagnostics

| Command | When to use | What it does |
|---|---|---|
| `/harness-security-scan` | Audit the security surface | Scans OpenCode, Cursor, the repo harness, MCPs, and memory for supply-chain risks and secrets; summarizes PASS/WARN/FAIL without printing values |
| `/harness-mcp-inventory` | Inventory MCPs | Lists OpenCode/Cursor MCP servers, detects drift, and flags keys holding secrets without exposing values |
| `/harness-context-budget` | Audit context load | Reports the context budget of skills, plugins, commands, and MCPs; recommends lazy-loading |
| `/harness-status` | Check readiness | Prints git, PREVC, goal, handoff, context, and security status; points to the next best action |
| `/harness-worktree-lifecycle` | Parallel agents with worktrees | Reports worktree lifecycle safety (dirty, clean, stale) without deleting files |

### Orca Graph Engineer

| Command | When to use | What it does |
|---|---|---|
| `/orca-graph-plan` | Plan waves | Read-only wave plan from `feature_list.json` (waves, chain depth, cycles); triggers nothing |
| `/orca-graph-run` | Launch the current wave | Creates tasks wave by wave, brings up Codex workers, supervises, and stops at the human merge gate (requires `--confirm`) |
| `/orca-graph-next` | After you merge | Verifies the actual merge of each blocker and advances to the next wave; launches no workers |
| `/orca-graph-status` | Track waves in flight | Shows the task list, `wave-state.json`, and PR/CI triage; flags drift; read-only |

### Interface and investigation commands

Local commands defined in the `command/` folder, focused on interface design, investigation, and PRs.

| Command | When to use | What it does |
|---|---|---|
| `/init` | Build UI with craft | Builds an interface (dashboards, apps, tools) following the `interface-design` skill; reads `SKILL.md` before any code |
| `/audit` | Check code against the design system | Checks for spacing, depth, color, and pattern violations against `.interface-design/system.md` |
| `/critique` | Review the craft of the build | Critiques the build as a design lead and rebuilds what fell into a generic pattern |
| `/extract` | Create system.md from code | Extracts design patterns from existing code (tsx, jsx, vue, svelte) and generates a `system.md` |
| `/status` | View design system state | Shows the direction, tokens, and patterns of the current design system |
| `/investigate` | Discovery before planning | Asks 3 to 5 focused questions and analyzes the code before planning or implementing |
| `/investigate-batch` | Batch discovery | Asks up to 5 questions at once (via AskUserQuestion) and then analyzes the code |
| `/trim` | Shrink a PR description | Reduces the current PR description by 70% while preserving the essentials |

## Step-by-step for the main commands

### 1. Work on something significant — `/prevc`

```
/prevc prepare <objective>
```

- Runs the global `prevc-workflow` skill, the single lifecycle controller for significant work.
- `prepare <objective>` performs discovery, classifies risk, and creates a plan, stopping at `awaiting_plan_approval` in the conversation.
- Never invokes `/goal` or the goal tools; lifecycle labels stay in the conversation and in the existing harness files.
- Routes low-risk routine operations (session-start, status checks, explicit dependency installation, formatting, narrow test repairs) through a fast path with objective verification, without the PREVC ceremony.

```
/prevc run
```

- Accepts explicit operator approval in plain language or `/prevc run`; requires no goal ID or `/goal confirm`.
- Automates Review → Execute → Validate → Judge within the approved scope and the declared budgets (files, permissions, verification, retry, tools, duration).
- On low-risk work, allows a limited repair pass for a newly exposed verification prerequisite (a missing test, lint, typecheck, or dev-dependency build) and then runs full validation again.
- Preserves the low, medium, high, and untrusted risk paths: medium+ requires context/security evidence or a documented skip; high/untrusted requires explicit risk acknowledgment before executing.
- Never commits, pushes, deploys, switches branches, or runs remote Git operations automatically.

### 2. Audit a project — `/harness-init`

```
/harness-init
```

- Runs the global `harness-initializer` skill.
- Detects the repo root, root instructions, progress state, feature state, startup path, Judge/evaluation layer, harness skills, security posture, hook/plugin posture, MCP/plugin hygiene, context budget, goal memory hygiene, worktrees, agent permissions, and parity with Cursor.
- Produces a non-mutating gap report with recommended fixes.
- Does not create or edit files unless the user approves a specific fix.
- Does not assume that `init.ps1`, `feature_list.json`, or `.specs/project/STATE.md` exist.

### 3. Install the full harness — `/harness-bootstrap`

```
/harness-bootstrap
```

- Runs the global `harness-bootstrap` skill.
- Always proposes the full package: `AGENTS.md`, `feature_list.json`, `docs/harness` (progress, handoff, sprint-contract, security-policy, hook-policy, context-budget, eval-contract, agent-permission-matrix, status), `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/RELIABILITY.md`, `agent-os/judges/project-judge.md`, `agent-os/standards`, and spec templates including `evals.md`.
- First audits the current repo, detects the stack with `harness-stack-router`, and discovers the startup path.
- Shows the exact files to create, merge, or skip and asks for explicit confirmation before writing anything.
- Never assumes `init.ps1`, `feature_list.json`, `.specs/project/STATE.md`, or repo paths.

### 4. Start the session — `/harness-session-start`

```
/harness-session-start
```

- Runs the global `harness-session-start` skill as a direct routine operation, not as PREVC work.
- Never invokes `/goal` or the goal tools.
- Reads root instructions, if they exist.
- Locates the progress state in `.specs/project/STATE.md`, `docs/harness/progress.md`, or `agent-progress.md`.
- Locates the feature state in `feature_list.json` or `.specs/features/*/tasks.md`.
- Reads `docs/harness/session-handoff.md`, if present.
- Discovers the startup command with `harness-startup-path` and runs it if safe.
- Runs `git log --oneline -3` in git repos.
- Applies WIP=1 when there is durable state.
- Ends by declaring: Active task, AC (observable criteria). If startup fails, it records the exact error in the progress file and stops.

### 5. Close the session — `/harness-clean-handoff`

```
/harness-clean-handoff
```

- Runs the global `harness-clean-handoff` skill as a PREVC handoff subroutine.
- Collects evidence, blockers, progress notes, a session handoff, passing verification results, and git status.
- Only PREVC writes lifecycle transitions after the operator's decision.
- When invoked directly, it returns only a handoff report: it does not mark feature state, infer confirmation, or assert completion.

### 6. Load standards and skills — `/harness-standards`

```
/harness-standards
```

- Runs `harness-stack-router` and then `harness-standards-router`.
- Detects the stack from the files before guessing.
- Loads project standards in `agent-os/standards` first, then the global standards templates.
- Returns a risk profile, validation profile, agent permission profile, security standards, minimum checks, and skills applicable to the current task.
- Does not implement code: it produces only the standards and skills routing report.

### 7. Create a spec — `/harness-spec`

```
/harness-spec <objective>
```

- Runs `harness-agent-os-specs` for the requested objective.
- Creates or proposes `agent-os/specs/YYYY-MM-DD-HHMM-slug/` with `spec.md`, `plan.md`, `tasks.md`, `verification.md`, and `decisions.md` from the global templates.
- Replaces placeholders with concrete requirements, acceptance criteria, verification commands, and decisions.
- Asks before writing if the target repo does not yet have a harness.

## Quick commands (cheat sheet)

```text
# Unknown project: audit without writing
/harness-init

# Project without harness: propose full install
/harness-bootstrap

# Start of a normal session
/harness-session-start

# Prepare significant work
/prevc prepare <objective>

# Approve the prepared plan
/goal confirm

# Run only the approved goal
/prevc run <goal-id>

# Pause or close with durable context
/harness-clean-handoff

# Global diagnostics
/harness-status
/harness-security-scan
/harness-context-budget
/harness-mcp-inventory
/harness-worktree-lifecycle
```
