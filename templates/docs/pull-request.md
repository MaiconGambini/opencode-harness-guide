# Pull request template

`harness-ship-evidence.mjs --pr-body` generates the measured sections (metrics table, review
depth, blind-spot checklist, unavailable-metric warning) and appends whatever this file adds.

Put **project-specific** PR requirements here — the things a reviewer of *this* system needs
that no generic template knows. Delete the examples that don't apply.

## Project-specific checks

- [ ] Feature flag added / removed, and its default is deliberate
- [ ] Migration is reversible, and tested against a copy of production-shaped data
- [ ] Public API or contract change is versioned and documented
- [ ] Background job / queue change is safe to deploy while the old workers are still running
- [ ] Observability: the new failure mode is visible in logs or metrics

## Deploy notes

<!-- ordering, dependencies on other PRs, config that must land first -->

## Screenshots / recordings

<!-- for user-facing changes -->

---

**Do not restate the metrics here.** They come from the gate report, and a number copied by hand
drifts from the report within a week. The generated section is the source of truth.

**Nothing here creates or pushes a PR.** `harness-ship-evidence` prints a body; the operator
opens the PR. Push, merge, and remote git remain manual by harness invariant.
