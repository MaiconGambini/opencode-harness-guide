---
sidebar_position: 4
---

# Repository Structure

Organization of the `opencode-harness-guide` repository.

```text
opencode-harness-guide/
|-- opencode.jsonc           Global configuration (commands, plugins)
|-- package.json             Dependencies and verification scripts
|-- tsconfig.json            TypeScript configuration for plugins
|-- .gitignore               Ignore rules for Git
|-- plugins/                 Runtime plugins (goal, security, scheduler)
|-- skills/                  Skills loaded by OpenCode
|-- command/                 Additional global commands
|-- scripts/                 PowerShell and Node utilities
|-- templates/               Reusable templates
|   |-- agent-os/            Specs, standards, judges
|   |-- docs/                Documentation templates
|   `-- feature_list.json    Feature list template
|-- docs/                    Internal harness documentation
|   |-- governance/          Governance and architecture decisions
|   `-- superpowers/         Specs and plans
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

`package.json` is used only for typecheck and testing of the plugins — it
does not affect OpenCode directly.

## What is NOT loaded

- `templates/` — they are copied manually into projects.
- `docs/` — internal documentation, does not affect the runtime.
- `scripts/` — utilities run manually.
- `website/` — isolated with its own dependencies.
