# Activity Log Retention Policy

## Scope

`harness-tool-activity.ts` records redacted OpenCode tool activity in
`.opencode/state/tool-activity.jsonl` below the current worktree. It redacts
secret-bearing keys and recognized secret values before truncation and before writing
the JSONL record.

## Bounds

- Retain only complete, valid JSON records whose `at` timestamp is within the last
  30 days.
- Retain at most 5 MiB of UTF-8 JSONL, preserving the newest eligible records when
  the size limit is reached.
- Prune before and after each append so both a pre-existing log and the newly written
  record are bounded.

Incomplete trailing data, malformed JSON, and records without a usable timestamp are
discarded during compaction. Complete retained records are rewritten as whole lines;
the replacement is written to a temporary file and renamed into place rather than
partially overwriting the log.

## Failure Behavior

Writes are serialized within the loaded plugin process. If redaction, retention, or
file I/O fails, the logger emits a generic availability warning and returns without
changing the independently enforced deny or approval result. `minimal` recovery skips
activity logging but does not disable security enforcement.

## Limitations

The queue coordinates one plugin process only. Concurrent external writers or a
separate OpenCode process are outside this retention mechanism and can cause lost
observability records. The activity log is diagnostic evidence, not an audit-grade
or tamper-proof record.
