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
|-- scripts/                 PowerShell and Node utilities (+ shared harness-manifest.json)
|-- templates/               Reusable templates
|   |-- agent-os/            Gates, ledger, specs, and standards
|   |-- docs/                Findings, Refine, handoff, and other templates
|   `-- feature_list.json    Feature list template
|-- catalog/                 Proactive automation documents (canonical)
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

When templates are installed in a project, v1.3 artifacts live in that
repository: `agent-os/quality-thresholds.json`,
`agent-os/learned-rules.json`, `agent-os/standards/`, and
`docs/harness/findings/`. The ledger does not automatically promote rules
across projects.

## Note on the public distribution

This public distribution **does not include** offensive security skills (recon,
redteam, hiagosh, chains families, and standalone attack skills), nor local
runtime evidence (gate reports in `docs/harness/quality/`, review notes in
`docs/harness/review/`). The exclusions are declared in
`scripts/harness-manifest.json` and machine-checked: the export script refuses
to produce a package that violates them, and the
`.github/workflows/validate-harness.yml` workflow blocks a public mirror that
contains them. Legitimate curated security skills (`skills/wstg-*` and the
defensive `*-security-coder`) remain. The excluded artifacts exist only in the
author's private repository.
