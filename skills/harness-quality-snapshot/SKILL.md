---
name: harness-quality-snapshot
description: Create a milestone quality scorecard with evidence. Use for release, capstone, or major sprint review; not for every small task.
---

# Harness Quality Snapshot

Track project health over time with evidence.

## Artifact

Preferred file: `docs/harness/quality-document.md`.

Create or update only after approval.

## Dimensions

| Dimension | Evidence |
|---|---|
| Build health | startup/build command output |
| Feature completeness | feature state and AC evidence |
| Test coverage | test commands or coverage report |
| Documentation | root instructions, context docs, handoff |
| Harness quality | startup, WIP, Judge, state, handoff |
| Architecture boundaries | checks or documented boundaries |
| Cleanup priority | scanner findings |

## Output

```markdown
## Quality Snapshot
Date: ...
Overall score: .../10
Evidence table: ...
Top risks: ...
Next improvement: ...
```

## Rules

- Use actual command output or file evidence.
- Mark unknowns as unknown.
- Do not inflate score when verification is missing.
- Intended for milestones, not every small task.
