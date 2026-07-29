---
sidebar_position: 5
---

# Agents

Agents are specialized subagents the harness can trigger for a specific class of work. Each one lives in a `.md` file in the `agent/` folder and carries, in its frontmatter, a description that defines when it should be used.

Most agents are advisory and planning-only: they clarify boundaries, tradeoffs, and direction before implementation, without writing code. PREVC remains the single lifecycle controller and selects a limited active capability for implementation tasks.

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

## Quality and testing

| Agent | When to use |
|---|---|
| `code-reviewer` | When the code is ready for final review before commit, push, or delivery. Acts as a quality gate for style consistency, security vulnerabilities, best-practice conformance, and overall quality |
| `test-automation-engineer` | When comprehensive test coverage is needed: writes unit and integration tests, runs suites, diagnoses failures, verifies fixes, and conducts UAT. Runs the tests proactively and reports results, rather than just generating test code |
