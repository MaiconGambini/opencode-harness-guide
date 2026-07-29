---
sidebar_position: 3
---

# Security

Security boundaries of the OpenCode Harness. It is important to understand
both what the harness protects and what it deliberately does not protect —
security lives in the planning and approval phase, not in automatic blocks.

## What the harness protects

- **Durable state** — blockers, decisions, and handoffs are recorded in
  files. No state information lives only in the chat memory.
- **Declarative permissions** — `opencode.jsonc` defines rules for editing,
  command execution, and access to external directories.
- **Three-layer verification** — every result is validated before being
  marked as complete.
- **Traceability** — each change is associated with a feature, with evidence
  and approval recorded.

## Commands blocked by the security guard

`harness-security-guard.ts` blocks recognized patterns of:

- Recursive removal.
- `git reset --hard` and destructive variants.
- Forced `git clean`.
- Remote shells.
- Download followed by execution.
- Access to sensitive paths.

## Permission policy (asks for approval)

`harness-permission-policy.ts` asks for explicit approval for:

- Git push.
- Package mutation.
- Deploy.
- External directory requests.

The fallback rule for mutating Bash commands is **ask** — the default is to
ask before executing.

## Logs and retention

`harness-tool-activity.ts` keeps **redacted** JSONL records for at most **30
days** and **5 MiB**. Logs help with diagnosis; they do not prove that an
objective was completed correctly.

## Secrets

Never include credentials, tokens, personal data, or sensitive payloads in:
goals, evidence, session handoff, tool logs, or governance documents. When you
need to record a sensitive fact, use a redacted description — for example:
"integration token present and loaded by the secret store, never the value".

## What the harness does NOT protect

### There is no operating-system sandbox

Permission policies reduce risk, but they are **not** an operating-system
security boundary. An approved command run in the shell has full access to the
system.

### Does not replace human review

The Judge evaluates the work against objective criteria, but the final
confirmation still depends on the operator. The harness reduces the risk of
premature completion — it does not eliminate the need for review.

### The guard does not cover everything

The security guard blocks *recognized* patterns, but it is not infallible.
Real security still lives in the planning and approval phase: review every
command in the plan before approving.

## Best practices

1. **Review the plan before approving.** Every command listed in the plan
   will be executed — read every line.
2. **Keep `opencode.jsonc` under version control** and review the permissions
   before sharing the configuration.
3. **Do not store tokens or credentials in configuration files.** Use
   environment variables.
4. **Run `/harness-security-scan` periodically** to detect exposed secrets
   and excessive permissions.
5. **Remember that the repository is public** — do not commit anything that
   should not be visible to anyone.
