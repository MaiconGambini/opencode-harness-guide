---
sidebar_position: 2
---

# Skills

Skills are `SKILL.md` files that OpenCode loads when needed. Each skill solves a specific class of problem in the workflow. The repository's skills are organized below by area; the list tracks the repository and has no fixed count (it derives from the actual directories under `skills/`).

OpenCode loads a skill lazily (lazy-loading), only when the task matches its description.

## Harness — lifecycle and workflow

| Skill | When to use |
|---|---|
| `prevc-workflow` | Control the lifecycle of significant work (Plan → Review → Execute → Validate → Judge → Confirm → Handoff) |
| `harness-session-start` | Start of every session: discovers instructions, state, and active task |
| `harness-clean-handoff` | End of every session: closes the state with evidence and handoff |
| `harness-session-handoff` | Record the handoff between sessions |
| `harness-continuity` | Multi-session work: WIP=1 state machine and blocked protocol |
| `harness-wip-control` | Before a multi-step prompt: decomposes into WIP=1, defines AC and non-goals |
| `harness-progress-log` | Maintain the durable progress log |
| `harness-feature-state` | Before Execute: audits `feature_list.json` |
| `harness-role-separation` | Complex or UI tasks: separates Planner → Generator → Evaluator |
| `harness-startup-path` | Discover the project's startup command |
| `harness-root-instructions` | Locate and read the repo's root instructions |
| `harness-runtime-feedback` | Capture runtime feedback during the work |
| `harness-readable-workspace` | Session that does not orient itself: fresh-session test and gap mapping |
| `harness-context-layer` | Inconsistent decisions: audits ARCHITECTURE, PRODUCT, RELIABILITY |
| `harness-refine` | The Refine phase after Judge: dispatches the read-only refiner over the trajectory window, routes proposals by blast radius, and records operator notes |

## Harness — setup, portability, and stack

| Skill | When to use |
|---|---|
| `harness-initializer` | First time in the project: non-mutating audit of the layers |
| `harness-bootstrap` | Install the full harness package with confirmation |
| `harness-stack-router` | Detect the stack from the files |
| `harness-standards-router` | Route applicable project and global standards |
| `harness-agent-os-specs` | Create Agent OS specs from the templates |
| `harness-agent-permissions` | Define and audit the agent permission matrix |
| `harness-portability` | Ensure harness portability across projects |
| `harness-cursor-parity` | Keep configuration parity with Cursor |

## Harness — verification, quality, and diagnostics

| Skill | When to use |
|---|---|
| `harness-termination-check` | Before declaring "done": a 3-layer check (static → runtime → system) |
| `harness-evaluator-rubric` | Before the Judge: builds the task-specific rubric |
| `harness-eval-contract` | Define the evaluation contract for the work |
| `harness-architecture-checks` | Check architectural adherence |
| `harness-quality-snapshot` | Capture a code quality snapshot |
| `harness-capstone-audit` | Comprehensive closing audit |
| `harness-benchmark` | Measure/benchmark the harness |
| `harness-cleanup-scanner` | Scan for residue and files to clean up |
| `harness-security-scan` | Audit secrets and supply-chain without exposing values |
| `harness-mcp-inventory` | Inventory MCPs and detect drift |
| `harness-context-budget` | Audit context load and recommend lazy-loading |
| `harness-status` | Report readiness of git, PREVC, goal, handoff, context, and security |
| `harness-worktree-lifecycle` | Worktree lifecycle safety for parallel agents |
| `harness-quality-gate` | Runs the measured quality gate and the risk router; exit 1 = fix the metric (never relax the threshold), exit 2 = harness blocker; an unavailable metric or a missing/stale report is a named gap, never a pass |
| `harness-project-calibration` | Derive the project's own quality thresholds and high-risk paths from its measurements and history |
| `harness-rule-enforce` | Promote an operator-approved prose rule to an enforced rule (lint \| test \| gate_metric) as a normal dispatchable lane |

## Planning and specs

| Skill | When to use |
|---|---|
| `writing-plans` | Before touching code, with a spec or multi-step task requirements |
| `to-spec` | Turn an idea or note into a spec |
| `to-tickets` | Break a spec into actionable tickets |
| `research` | Investigate a topic or domain before deciding |
| `grill-me` | Be relentlessly questioned about a plan or design until there is shared understanding |
| `grill-with-docs` | Grilling backed by the existing documentation |
| `grilling` | Relentlessly grill the operator about a plan, decision, or idea until the thinking is stress-tested |
| `wayfinder` | Get oriented in an unfamiliar codebase or domain |
| `domain-modeling` | Model the domain before designing the solution |
| `codebase-design` | Design the codebase structure |
| `improve-codebase-architecture` | Improve the architecture of an existing codebase |
| `prototype` | Build a quick prototype to validate an idea |
| `implement` | Implement a piece of work based on a spec or a set of tickets |

## Frontend and UI

| Skill | When to use |
|---|---|
| `frontend-design` | Create interfaces with intentional aesthetics and high craft |
| `interface-design` | Interface design: dashboards, apps, tools (not marketing sites) |
| `emil-design-eng` | UI polish, animation, and invisible design details |
| `ui-ux-designer` | Wireframes, design systems, user research, and accessibility |
| `frontend-dev-guidelines` | React + TypeScript standards (Suspense-first, feature-based) |
| `frontend-developer` | Build React components (React 19, Next.js 15) |
| `frontend-mobile-development-component-scaffold` | Scaffolding of production-ready, accessible, performant components |
| `frontend-slides` | Animation-rich HTML presentations or PPT conversion |
| `frontend-ui-dark-ts` | Dark-theme React apps with Tailwind, glassmorphism, and Framer Motion |
| `react` | React/Next.js best practices for modern apps |
| `nextjs-app-router-patterns` | Server Components, streaming, and data fetching in the App Router |
| `nextjs-best-practices` | Next.js App Router principles |
| `shadcn-ui` | shadcn/ui component patterns in Next.js + TypeScript |

## Backend and architecture

| Skill | When to use |
|---|---|
| `backend-architect` | Scalable API design, microservices, and distributed systems |
| `backend-dev-guidelines` | Node.js + Express + TypeScript standards (layered, DI, Prisma, Zod) |
| `nodejs-development` | Node.js internals and production practices (event loop, streams, workers) |
| `modular-monolith` | Modular monolith architecture with module boundaries |
| `software-architecture` | Quality-focused software architecture |
| `software-engineering` | Core engineering principles for maintainable code |

## Python

| Skill | When to use |
|---|---|
| `python-pro` | Modern Python 3.12+ with async and performance optimization |
| `python-patterns` | Framework, async, and project structure decisions |
| `python-development-python-scaffold` | Scaffolding of production Python projects (uv, FastAPI, Django) |
| `python-fastapi-development` | FastAPI backend with async, SQLAlchemy, Pydantic, and auth |
| `async-python-patterns` | Asyncio, concurrent programming, and async/await |
| `python-packaging` | Package libraries and publish to PyPI |
| `python-performance-optimization` | Profiling and optimizing slow Python code |
| `python-testing-patterns` | Testing with pytest, fixtures, mocking, and TDD |
| `uv-package-manager` | Dependency and environment management with uv |

## TypeScript

| Skill | When to use |
|---|---|
| `typescript` | General TypeScript best practices |
| `typescript-pro` | Advanced TypeScript in production |
| `typescript-advanced-types` | Advanced type system (generics, conditional, mapped types) |

## Database and authentication

| Skill | When to use |
|---|---|
| `nextjs-supabase-auth` | Integrate Supabase Auth with the Next.js App Router (login, middleware, protected routes) |

## Testing, debugging, and code review

| Skill | When to use |
|---|---|
| `tdd` | Test-driven development: red-green-refactor and integration tests |
| `test-driven-development` | Write tests before the code, in TDD discipline |
| `systematic-debugging` | Facing any bug, test failure, or unexpected behavior, before proposing fixes |
| `verification-before-completion` | Before declaring work complete |
| `reviewing-code` | Review PRs, commits, or diffs against standards |
| `code-review` | Review the changes since a fixed point (commit, branch, tag, or merge-base) along the Standards and Spec axes, in parallel subagents |
| `requesting-code-review` | Prepare and request a code review |
| `receiving-code-review` | Receive review feedback with technical rigor, without performative agreement |

## Security and WSTG

| Skill | When to use |
|---|---|
| `frontend-security-coder` | Secure frontend practices (XSS, sanitization, client-side security) |
| `backend-security-coder` | Secure backend practices (input validation, auth, API security) |
| `frontend-mobile-security-xss-scan` | Detect XSS in React, Vue, Angular, and plain JS |
| `wstg-information-gathering` | WSTG: information gathering |
| `wstg-configuration-management` | WSTG: configuration and deployment management |
| `wstg-identity-management` | WSTG: identity management |
| `wstg-authentication` | WSTG: authentication testing |
| `wstg-authorization` | WSTG: authorization testing |
| `wstg-session-management` | WSTG: session management |
| `wstg-input-validation` | WSTG: input validation |
| `wstg-error-handling` | WSTG: error handling |
| `wstg-weak-cryptography` | WSTG: weak cryptography |
| `wstg-business-logic` | WSTG: business logic |
| `wstg-client-side` | WSTG: client-side testing |
| `wstg-api-testing` | WSTG: API testing |

## Meta and tooling

| Skill | When to use |
|---|---|
| `writing-skills` | Create, edit, or verify skills |
| `writing` | Write clear, well-structured text |
| `prompt-engineering` | Improve prompts and debug agent behavior |
| `dispatching-parallel-agents` | Facing 2+ independent tasks with no shared state |
| `using-git-worktrees` | Isolate feature work in a dedicated worktree |
| `resolving-merge-conflicts` | Resolve merge conflicts |
| `playwright-cli` | Browser automation, scraping, and E2E testing with Playwright |
