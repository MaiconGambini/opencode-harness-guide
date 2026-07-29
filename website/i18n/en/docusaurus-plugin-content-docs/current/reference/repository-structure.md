---
sidebar_position: 4
---

# Repository Structure

Organization of the public `opencode-harness-guide` repository.

```text
opencode-harness-guide/
|-- opencode.jsonc           Global configuration (commands, plugins)
|-- package.json             Dependencies and verification scripts
|-- tsconfig.json            TypeScript configuration for plugins
|-- .gitignore               Git ignore rules
|-- harnessopencode.md       Monolithic harness guide (reference)
|-- plugins/                 Runtime plugins (goal, security, scheduler)
|-- skills/                  Skills loaded by OpenCode
|-- agent/                   Agent definitions (specialized subagents)
|-- command/                 Additional global commands
|-- scripts/                 PowerShell and Node utilities
|-- templates/               Reusable templates
|   |-- agent-os/            Specs, standards, judges
|   |-- docs/                Documentation templates
|   `-- feature_list.json    Feature list template
|-- catalog/ plan/ shape/    Proactive automation documents
|-- tests/                   Plugin tests
`-- website/                 Documentation site (Docusaurus)
    |-- docs/                Documentation source (pt-BR)
    |-- i18n/                Translations (en)
    |-- src/                 Home page and theme
    `-- static/              Images and favicon
```

## What OpenCode loads

OpenCode reads `opencode.jsonc` at startup. It registers:

- Global commands in `command` (slashes like `/prevc`).
- Skills in `skills/` (any `SKILL.md` inside a subdirectory).
- Plugins in `plugins/` (`.ts` files registered in `opencode.jsonc`).
- Agents in `agent/` (specialized subagent definitions).

`package.json` is used only for typecheck and plugin tests — it does not
affect OpenCode directly.

## What is NOT loaded

- `templates/` — copied manually into projects.
- `scripts/` — utilities run manually.
- `website/` — isolated with its own dependencies.
- `harnessopencode.md` — reference guide, does not affect the runtime.

## Note on the public distribution

This public distribution **does not include** internal governance material,
backups, runtime state, or offensive security skills (recon, redteam,
exploitation). Those artifacts remain only in the author's private
repository.
