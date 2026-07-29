# Proactive Automation Shape Update

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

All scheduler and proactive modules except `scheduler-plugin.ts` are source-only and unregistered. Task 10 `automation-plugin.ts` has no producer registration and no edge to goal state, PREVC, shell execution, LLM providers, project files, or OpenCode configuration. `scheduler-plugin.ts` is the sole inert/disabled automation runtime entry point and has no import or invocation edge to proactive triage.
