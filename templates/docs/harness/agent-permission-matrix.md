# Agent Permission Matrix

| Agent | Mode | Allowed Tools | Write Scope | Network | Required Verification |
|---|---|---|---|---|---|
| Planner/advisor | planning-only | read, grep, glob | none | docs-only | plan review |
| Implementer | implementation | scoped tools | repo-only | approved-only | targeted checks |
| Reviewer/Judge | validation | read, grep, glob, test commands | none | none | Judge evidence |

PREVC must reference this matrix before launching subagents.
