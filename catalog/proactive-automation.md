# Proactive Automation Catalog Entry

| Field | Value |
| --- | --- |
| Component | `plugins/automation` |
| Status | `scheduler-plugin.ts` is the only registered automation runtime and is inert/disabled. All scheduler and proactive modules, including Task 10 `automation-plugin.ts`, are source-only and unregistered. |
| Ingress | Strictly validated unknown values narrowed to six typed event variants |
| State | Fixed global `state/automation/proactive/queue.json` path, separate from goal state |
| Concurrency | Exclusive lock directory with owner marker; marker-to-token-tombstone rename; empty-directory removal; atomic unique-temp replacement |
| Output | Redacted diagnostic, queue-scoped operator-plan review metadata, or alert record |
| Forbidden capabilities | LLM calls, shell execution, PREVC execution, goal changes, project/config mutation |
