---
sidebar_position: 5
---

# Agents

Agents are specialized subagents the harness can trigger for a specific class of work. Most live in a `.md` file in the `agent/` folder and carry, in their frontmatter, a description that defines when they should be used. Some agents are defined only in the configuration (`opencode.jsonc`) — like `refiner` and `rule-verifier` — and may not have their own file in `agent/`.

Most agents are advisory and planning-only: they clarify boundaries, tradeoffs, and direction before implementation, without writing code. PREVC remains the single lifecycle controller and selects a limited active capability for implementation tasks.

**Permissions:** reviewers (`code-reviewer`, `architecture-reviewer`) and the continual-harness agents (`refiner`, `rule-verifier`) run with `edit` and `bash` denied: they read and report, they do not change files or run commands. Implementers (kotlin, web, python, vue, postgres, backend-infra, test-automation, fixer) have `edit`/`bash` allowed only for the lane's own tasks.

## Architecture and system design

| Agent | When to use |
|---|---|
| `architecture-advisor` | Clean architecture, hexagonal, event-driven, layered, modular monoliths, microservices, module boundaries, dependency direction, and migration paths. Advisory and planning-only: clarifies ownership, boundaries, and direction before implementation planning |
| `system-design-advisor` | Scalable system design: APIs, load balancers, queues, workers, caches, databases, rate limits, observability, reliability, bottlenecks, and diagrams. Advisory and planning-only, does not write code |
| `design-patterns-advisor` | Guide to design patterns (Factory, Adapter, Strategy, Builder, Observer, Repository, Specification, CQRS), code-level structure, maintainability, and anti-pattern review. Advisory and planning-only |

## Planning and specification

| Agent | When to use |
|---|---|
| `requirements-interrogator` | Vague, ambiguous, or incomplete requirements: relentlessly interviews the user about each branch of the decision tree, explores the code when the answers are in it, and returns clear, actionable requirements |
| `spec-lead` | Clarify requirements, define scope and acceptance criteria, model ownership and risks, and prepare a reviewable plan for PREVC (which remains the single lifecycle controller) |
| `plan-architect` | Implementation planning for Medium+ scope: creates plans with small tasks (2-5 min), exact file paths, complete code at every step, zero placeholders, and TDD discipline |

## Interface design

| Agent | When to use |
|---|---|
| `design-director` | Aesthetic direction, design systems, UI components, animation decisions, and CSS architecture. Produces design directions with a DFII score, token systems, animation specifications, and a component construction guide |

## Implementation

| Agent | When to use |
|---|---|
| `kotlin-engineer` | Kotlin Multiplatform, native Android, Jetpack Compose, Compose Multiplatform, shared domain modules, coroutines, Flow, Gradle/KMP setup, and mobile testing. Implementation-capable, mobile-first with strong KMP support; backend Kotlin only when explicitly requested |
| `web-platform-engineer` | Cross-browser compatibility, build tooling configuration, web performance (Core Web Vitals), and asset bundling. Handles cross-cutting web platform concerns; does not write framework-specific component code or backend/data code |
| `python-engineer` | Python services and libraries: FastAPI endpoints, Pydantic models, SQLAlchemy 2.0 access, async I/O, CLI tools, data/domain logic, and pytest coverage. Implementation-capable; adapts to the detected stack (uv, ruff, pytest) |
| `vue-engineer` | Vue 3 frontends: Composition API components, TypeScript, Pinia state, Vue Router, Vite/Vitest, and Nuxt when the project uses it. Implementation-capable; adapts to the detected stack (Vite or Nuxt, `<script setup>`, vue-tsc) |
| `postgres-engineer` | PostgreSQL work: schema and Alembic migrations, indexing, query performance, transaction isolation, locking (advisory locks, FOR UPDATE, SKIP LOCKED), and SQLAlchemy 2.0 access patterns. Implementation-capable for schema/query/migration code; never writes directly to a production database |
| `backend-infra-engineer` | Backend platform and infrastructure work that is not framework component code: Docker/Compose, CI pipelines, environment and config management, ODBC/driver and connectivity preflight, deployment scripts, observability, and reliability (timeouts, retries, health checks, rollback). Implementation-capable for config/infra files; does not write application business logic |
| `fixer` | Executes one bounded, already-planned implementation lane inside an approved PREVC run: explicit objective, declared file ownership set, and a verification command; writes only those files and reports evidence. Does no planning, no scope negotiation, and no dispatch |

## Quality and testing

| Agent | When to use |
|---|---|
| `code-reviewer` | When the code is ready for final review before commit, push, or delivery. Acts as a quality gate for style consistency, security vulnerabilities, best-practice conformance, and overall quality. Read-only: `edit` and `bash` denied |
| `test-automation-engineer` | When comprehensive test coverage is needed: writes unit and integration tests, runs suites, diagnoses failures, verifies fixes, and conducts UAT. Runs the tests proactively and reports results, rather than just generating test code |

## Continual harness v1.3

| Agent | When to use |
|---|---|
| `architecture-reviewer` | Read-only structural review in parallel with `code-reviewer`; returns typed findings to the scheduler and does not write files (`edit`/`bash` denied) |
| `refiner` | After Judge, reads the trajectory window and proposes a bounded improvement; cannot write, delegate, or participate in the verdict. Defined in `opencode.jsonc` — may not have its own file in `agent/` |
| `rule-verifier` | Attempts to refute a prose-rule proposal before any eligible activation; remains read-only and does not replace required confirmation for blocking rules or high-risk effects. Defined in `opencode.jsonc` — may not have its own file in `agent/` |

## Security and recon

| Agent | When to use |
|---|---|
| `security-analyst` | Authorized security testing and defensive review: routes the work to the security skills that **ship in this public distribution** (`wstg-*`, `*-security-coder`, `harness-security-scan`) and returns a bounded, evidence-first plan for the target. Families that are not distributed (recon, redteam, hiagosh, chains, and standalone attack skills) are **rejected with an installation note** — run in the private harness where they are installed, or install the missing skills separately — never routed to a name that does not exist under `skills/`. Read-only and advisory by default; requires an authorized context (pentest engagement, CTF, or your own asset); does not run destructive attacks or evasion |
| `explorer` | Read-only codebase reconnaissance during PREVC Prepare or to answer a scheduler's routing question: where something lives, which files a change would touch, what the existing pattern is, where the call sites are. Returns file:line evidence; never edits or runs commands |

The scheduler validates and writes findings. Reviewers and Refine never write
the ledger or trajectory window. See
[Continual Harness v1.3](../concepts/continual-harness-v1-3).
