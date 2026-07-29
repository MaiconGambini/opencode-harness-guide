---
sidebar_position: 3
---

# Security

Security boundaries of the OpenCode Harness.

## What the harness protects

- **Durable state** — blockers, decisions and handoffs are recorded in
  files. No state information lives only in the chat memory.
- **Declarative permissions** — `opencode.jsonc` defines rules for editing,
  command execution and access to external directories.
- **Three-layer verification** — every result is validated before being
  marked as complete.
- **Traceability** — each change is associated with a feature, with evidence
  and approval recorded.

## What the harness does NOT protect

### There is no operating system sandbox

The permission policies control what the agent can do inside OpenCode, but
they do not isolate the process from the operating system. An approved
command executed in the shell has full access to the system.

### It does not replace human review

The Judge evaluates the work against objective criteria, but the final
confirmation still depends on the operator. The harness reduces the risk of
premature completion — it does not eliminate the need for review.

### It does not prevent dangerous commands

If you approve a plan that includes `rm -rf`, the harness will execute it.
The security is in the planning and approval phase, not in automatic command
blocks.

## Best practices

1. Review the plan before approving. Every command listed in the plan will
   be executed.
2. Keep `opencode.jsonc` under version control and review permissions before
   sharing.
3. Do not store tokens or credentials in configuration files. Use
   environment variables.
4. Run `/harness-security-scan` periodically to detect secrets and excessive
   permissions.
5. The repository is public — do not commit anything that should not be
   visible.
