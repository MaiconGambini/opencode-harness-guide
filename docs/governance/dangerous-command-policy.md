# Dangerous Command Policy

## Boundary

This policy is OpenCode runtime enforcement, not an operating-system sandbox. It
evaluates Bash tool commands and OpenCode permission requests; it cannot prevent
actions performed outside OpenCode, through an unrecognized command wrapper, or by
another process with access to the same machine.

## Denied Operations

`harness-security-guard.ts` denies these operations in every `HARNESS_PROFILE`,
including `minimal` recovery:

- Recursive filesystem deletion through `rm` short flags or `--recursive`,
  `Remove-Item`, `rmdir`, `rd`, or `del /s` command forms.
- `git reset --hard` and forced `git clean` command forms, including when recognized
  Git global options such as `-C <repo>`, `--git-dir`, or `--work-tree` precede the
  subcommand.
- Remote shell or remote terminal commands through `ssh`, `sftp`, `scp`, `nc`,
  `ncat`, or `telnet`.
- Download-and-execute pipelines such as `curl | sh`, `wget | powershell`, and
  PowerShell web-request pipelines to `Invoke-Expression`.
- Direct access to configured secret paths and key-file patterns.

These denies have no environment-variable bypass. `HARNESS_PROFILE=minimal` reduces
advisory diagnostics only; it cannot weaken irreversible-operation or sensitive-path
denies.

## Explicit Approval

`harness-permission-policy.ts` explicitly configures these recognized Bash command
patterns as `ask`, so the operator must explicitly approve them:

- Remote Git effects through direct `git push` and `git push` preceded by `-C`,
  `--git-dir`, or `--work-tree` global options in separate or `--option=value` form.
- Recognized package mutations, including `npm install`, `npm i`, `npm ci`, and
  `npm update`; `pnpm install` and `pnpm i`; `yarn install` and `yarn add`; and
  `bun install` and `bun add`, plus the existing pip, uv, and Cargo mutation forms.
- Recognized deployment or infrastructure tooling: Docker, Kubernetes, Helm,
  Terraform, Ansible, Serverless, Vercel, Netlify, Flyctl, and Heroku.
- Every external-directory access request.

Other Bash mutations are not exhaustively enumerated by these command patterns. The
global Bash fallback remains `ask`, so they also require an OpenCode approval unless
a more specific configuration rule changes that decision.

Read-only review and planning agents remain denied for mutable or deployment-style
Bash requests. Permission prompts are not substitutes for the deny rules above:
an irreversible command is denied rather than presented for approval.

## Failure Behavior

Command denial and approval policy are independent of activity logging and advisory
hooks. A warning or logging failure cannot convert a deny into an allow. The four
former warning-only plugins are archived and are not registered by the canonical
`opencode.jsonc`.

## Limitations

Command matching is intentionally bounded to recognized command forms and the
OpenCode plugin API. Shell aliases, encoded commands, interpreter wrappers, or work
performed outside the managed tool path can evade these checks. This policy does not
claim OS-level containment or a complete command-language parser.
