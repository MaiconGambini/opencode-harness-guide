---
name: to-tickets
description: Break an approved spec or plan into dependency-aware vertical slices that fit the existing WIP=1 feature workflow.
---

# To Tickets

1. Read the approved spec, current feature state, domain glossary, ADRs, and existing conventions.
2. Create vertical slices that each deliver an observable end-to-end behavior and can be verified independently.
3. Record dependencies explicitly. Prefer a blocker-first order and avoid horizontal layers such as "database first" or "UI first".
4. For broad mechanical changes, use expand-migrate-contract slices so each slice remains safe to verify.
5. Present the proposed slices, their blockers, delivery, and acceptance criteria for approval.
6. After approval, record them in the active Agent OS `tasks.md`; create matching `feature_list.json` entries only when the project uses that level of tracking.
7. Set exactly one task in progress and execute it through PREVC.

Do not create a second issue tracker or `.scratch` convention.
