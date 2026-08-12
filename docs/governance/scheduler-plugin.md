# Task 9 Scheduler Runtime

`plugins/scheduler-plugin.ts` is the only Task 9/Task 10 automation runtime registration. It is intentionally inert and disabled: it creates no schedule, producer, automation action, or proactive-triage invocation.

All scheduler and proactive modules other than `plugins/scheduler-plugin.ts`, including `plugins/automation-plugin.ts` and the `plugins/automation` Task 10 library, remain source-only and unregistered. They must not be imported by the scheduler. Enabling any component requires a separate operator-approved change.
