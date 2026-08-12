# Proactive Automation Catalog Entry

> **Canonical document.** The historical `plan/proactive-automation.md` and
> `shape/proactive-automation.md` duplicates were folded into this entry on 2026-08-12;
> they are deleted. Do not recreate per-phase snapshots — update this catalog entry only.

| Field | Value |
| --- | --- |
| Component | `plugins/automation` |
| Status | `scheduler-plugin.ts` is the only registered automation runtime and is inert/disabled. All scheduler and proactive modules, including Task 10 `automation-plugin.ts`, are source-only and unregistered. |
| Ingress | Strictly validated unknown values narrowed to six typed event variants; strict plain-object ingress validation with source, kind, enum, number, and boolean allowlists |
| State | Fixed global `state/automation/proactive/queue.json` path, separate from goal state, with root-bound validation |
| Concurrency | Exclusive lock directory with owner marker; marker-to-token-tombstone rename; empty-directory removal; atomic unique-temp replacement; lock-serialized re-read, snapshot validation, admission, atomic write |
| Controls | Deduplication, cooldown, daily budget, record-cap, and risk routing before every route; `queue_scoped_operator_plan_review_pending` metadata for medium risk only |
| Output | Redacted diagnostic, queue-scoped operator-plan review metadata, or alert record |
| Forbidden capabilities | LLM calls, shell execution, PREVC execution, goal changes, project/config mutation |

## Flow (canonical shape)

```text
unknown ingress
  -> strict plain-object normalizer
  -> exclusive fixed-queue lock
  -> re-read and validate snapshot
  -> dedupe / cooldown / daily budget
  -> low: redacted diagnostic
     medium: candidate + queue_scoped_operator_plan_review_pending
     high or untrusted: alert_and_stop
  -> unique temporary file -> atomic fixed queue replacement
  -> owner marker -> atomic token tombstone -> delete -> empty lock-directory removal
```

## Deferred (fail-closed by design)

All Task 10 producers, runtime/plugin registration, automatic workflow execution, and
operator review actions are deferred. `scheduler-plugin.ts` is the sole inert/disabled
automation runtime registration; every other scheduler and proactive module, including
`automation-plugin.ts`, remains source-only and unregistered — no producer registration,
no edge to goal state, PREVC, shell execution, LLM providers, project files, or OpenCode
configuration.
