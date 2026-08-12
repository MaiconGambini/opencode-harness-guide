# Porting the harness to Antigravity **IDE**

Antigravity **IDE** ≠ Antigravity **2.0** ≠ **CLI**. They share `~/.gemini/` but have
different customization models. This targets the **IDE** (VS Code fork; app data in
`%APPDATA%\Antigravity`; language server at
`…\Programs\Antigravity IDE\resources\app\extensions\antigravity\bin\language_server_windows_x64.exe`).

## The IDE's real customization model (verified empirically)

The IDE Customizations panel has exactly two tabs — **Rules** and **Workflows** — and that is
all the IDE reads as user customization. Verified by creating a workflow in the UI and
inspecting disk, and by the language-server strings (only `global_workflows` exists; there is
**no** `global_skills`/`global_agents`/`global_hooks`/`global_mcp`).

```
~/.gemini/config/global_workflows/<name>.md   # Workflows tab. Trigger with /<name> in Agent.
    format (exactly what the UI writes):
        ---
        name: <name>
        description: <one line>
        ---

        <prompt body the agent follows>
~/.gemini/GEMINI.md                            # Rules tab (global). Also AGENTS.md, hierarchical.
```

**What the IDE does NOT read** (so these do nothing here): `config/skills/`, `config/agents/`,
`config/hooks.json`, `config/mcp_config.json`, and any 2.0-style `config/plugins/<name>/` bundle.
Those are 2.0/CLI features. (Earlier iterations of this migration installed them and even a
plugin bundle — all ignored by the IDE. That's why skills didn't activate, agents didn't work,
and `/plan` did nothing: the workflows were in `config/workflows/` instead of
`config/global_workflows/` and lacked the `name:` field.)

## So the harness in the IDE =

1. **Rules** — the discipline, in `~/.gemini/GEMINI.md` (design→plan→build→verify, ticket model,
   PREVC gates, one-writer-per-file, never auto push/deploy/branch, verify before done, WIP=1).
   Confirmed loading (shows in the Rules tab).
2. **Workflows** — one per OpenCode command in `config/global_workflows/` (`/plan`, `/prevc`,
   `/harness-*`, …). Bodies are **self-contained prompts** — the IDE does not
   load skills, so a workflow can't delegate to a skill; it must carry its own instructions. The
   OpenCode command templates already do.

There is **no** security hook, MCP-via-file, skill auto-activation, custom-agent fan-out, or
enforced PREVC state in the IDE. Those need 2.0/CLI or agents mode. In the IDE it's convention.

## Install

```powershell
node scripts/export-to-antigravity.mjs            # build antigravity/config/
node scripts/export-to-antigravity.mjs --install  # -> ~/.gemini/config/global_workflows/ + ~/.gemini/GEMINI.md
                                                   #    and clean the IDE-ignored artifacts
```
Then **restart the IDE** → Customizations → **Workflows** lists `/plan`, `/prevc`, … ; **Rules**
shows the global harness rule. Type `/plan <objetivo>` in Agent to run the planning pipeline.
`--no-clean` keeps the (ignored) extra artifacts if you also target 2.0/CLI.

## Smoke test

1. Restart IDE → Workflows tab lists the 22 harness workflows.
2. `/plan <objetivo>` in Agent → runs the pipeline prompt.
3. Rules tab shows the global rule.

## Notes / limits

- Workflow `name` = the trigger (`/<name>`); filename matches. `$ARGUMENTS` in a body is what the
  user types after the command (adjust if the IDE doesn't substitute — the model still sees it).
- 12k-char limit on rules/workflows; the converter warns. GEMINI.md is ~6.2k.
- MCP in the IDE (e.g. obsidian) is configured through the IDE's own MCP settings UI, not via a
  `config/mcp_config.json` file — set it there if you need it.
- The extra sources under `antigravity/` (`hooks.json`, `mcp_config.json`, `scripts/`,
  `skills/harness-entrypoints/`) are kept for a possible 2.0/CLI target but are **not installed
  for the IDE**.

## Re-running

Idempotent. Change commands/models in OpenCode → build → `--install`. Hand-authored source of
record: `antigravity/GEMINI.md` (the rule). Workflows are generated from `opencode.jsonc`'s
`command.*`. `antigravity/config/` is generated output.
