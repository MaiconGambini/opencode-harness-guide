# Proactive Automation Governance

## Scope

All scheduler and proactive modules are source-only and unregistered except `plugins/scheduler-plugin.ts`. That file is the only automation runtime registration; it is inert and disabled, and does not import or invoke the unregistered Task 10 `plugins/automation` or `plugins/automation-plugin.ts` source modules.

## Ingress

The public library entry point accepts unknown values only to reject unsafe input. It admits exactly six plain-object event envelopes with exact envelope and payload keys: CI failure, scanner finding, stale goal, missing handoff, repeated plugin failure, and retention threshold. The normalizer checks source-to-kind pairing, canonical timestamps, every enum, finite numeric range, and the stale-goal boolean. Invalid ingress payloads are never stored; a first untrusted alert retains only a fixed rejection category and hash, never the input object or payload.

## Fixed Durable Queue

Queue state is fixed at `~/.config/opencode/state/automation/proactive/queue.json`. The queue rejects any resolved queue, lock directory, owner marker, tombstone, or temporary path outside that root. Each admission exclusively creates `queue.lock/`, persists random owner-token, acquisition-time, and process metadata in an owner-only marker, re-reads and validates the snapshot, evaluates policy, writes a unique create-only temporary file, then atomically replaces the queue. Release atomically renames only that owner's marker to a token-specific tombstone inside `queue.lock/`, parses and verifies all tombstone metadata against the expected acquisition, then deletes it and removes `queue.lock/` only when atomically empty. Any failed claim, metadata mismatch, or cleanup ambiguity leaves the lock directory and tombstone in place and blocks future admission.

## Policy And Routing

Fingerprint deduplication, correlation cooldown, and daily budget checks run before every risk route, including high and untrusted events. The first admitted observation creates one redacted diagnostic, one queue-scoped review proposal, or one `alert_and_stop` record. Repeated or budget-exhausted observations are suppressed. Queue retention is capped per record type.

| Risk | Durable result |
| --- | --- |
| Low | Redacted diagnostic only |
| Medium | Candidate plus `queue_scoped_operator_plan_review_pending` metadata |
| High or untrusted | `alert_and_stop` record |

Medium records are queue-scoped metadata only. They cannot change goal state or start planning; an operator must explicitly begin separate work.

## Future Activation

Any future producer or runtime registration requires its own explicit review. Task 10 source is unregistered. `scheduler-plugin.ts` remains the only registered automation runtime and is disabled and scheduler-only.
