---
sidebar_position: 2
---

# Complex Feature

For multi-component tasks, frontend + backend, or with significant
ambiguity.

## When to use the full pipeline

- Multi-component prompt (e.g. frontend and backend).
- Ambiguity in the requirements.
- More than 3 files expected.

## Example

**Prompt:** `Full-text search on products with filters by category and price,
in the backend (FastAPI) and frontend (Vue).`

**Flow:**

1. `/harness-session-start`

2. `/harness-wip-control`
   - Decomposes into 6 subtasks (feat-020 to feat-025).
   - Marks feat-020 as `in_progress`. Rest: `not_started`.

3. `/harness-role-separation`
   - Planner defines scope, AC and verification plan in the sprint contract.
   - Generator iterates over the 6 subtasks.
   - Evaluator applies a 6-dimension rubric.

4. PREVC iterates: Review -> Execute -> Validate -> Judge.

5. Confirm after all subtasks pass.

6. Handoff records 6 `passing` features with evidence, 12 files touched.

**Time:** ~30-45 minutes. **Skills used:** 7 (+ role-separation,
evaluator-rubric, continuity).

## The sprint contract

For complex features, the sprint contract is filled in BEFORE Execute:

- **Scope In** — what will be done.
- **Scope Out** — what will NOT be done (e.g. ElasticSearch, autocomplete).
- **AC** — observable acceptance criteria.
- **Verification Plan** — commands and success conditions for each check.

Adjacent work discovered during execution becomes a next task, not a
silent extension of the active task.
