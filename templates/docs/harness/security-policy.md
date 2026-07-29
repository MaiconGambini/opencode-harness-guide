# Harness Security Policy

## Rules

- Do not print, commit, or copy secret values.
- Store credentials in environment variables or an approved secret store.
- Treat MCP headers, API keys, bearer tokens, cookies, and private keys as sensitive.
- Run `harness-security-scan` before confirming medium+ harness or config work.

## Required Evidence

- Scanner status.
- Secret findings by file/key only.
- Remediation decision for any inline secret-bearing key.
