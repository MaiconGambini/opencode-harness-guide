---
name: harness-cursor-parity
description: Use when keeping Cursor aligned with the OpenCode harness without duplicating /goal state or exposing Cursor MCP secrets.
---

# Harness Cursor Parity

Cursor is a secondary execution surface. OpenCode remains the source of truth for `/goal`, PREVC, evidence, and handoff.

Check:

- `.cursor/skills/` has only minimal portable harness skills.
- Cursor MCP inventory does not print secret values.
- Cursor agents are not added until permission profiles exist.
- Handoff/status can be read by both OpenCode and Cursor.
