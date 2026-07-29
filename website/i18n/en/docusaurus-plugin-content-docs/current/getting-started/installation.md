---
sidebar_position: 2
---

# Installation

OpenCode Harness is distributed as a public Git repository. You clone it
into `~/.config/opencode` and the files are immediately available to
OpenCode.

## Step 1: Back up the current configuration (if any)

If you already have a `~/.config/opencode` with your own plugins and commands,
rename the folder before cloning:

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.config\opencode" -NewName "opencode-backup"
```

Version 1 does not automatically merge into an existing configuration. Use the
backup as a reference and copy over whatever you want afterward.

## Step 2: Clone the repository

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

## Step 3: Install Node dependencies

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

## Step 4: Verify the installation

```powershell
npm run typecheck
npm test
```

If both commands return without errors, the harness is ready to use.

## Resulting structure

After installation, `~/.config/opencode` contains:

- `opencode.jsonc` — global commands and plugins.
- `skills/` — skills that OpenCode loads automatically.
- `plugins/` — runtime plugins.
- `scripts/` — PowerShell and Node utilities.
- `templates/` — reusable templates (feature_list, specs, standards).
- `package.json` — dependencies and verification scripts.

None of this is compiled or bundled. They are text files and scripts that
OpenCode reads directly.

## Troubleshooting

| Problem | Action |
|---|---|
| `npm install` fails | Check that Node.js 20+ is installed (`node --version`). |
| `npm run typecheck` fails | TypeScript may be out of date. Run `npm ci` and try again. |
| OpenCode does not load the commands | Close and reopen OpenCode. The configuration is loaded only at startup. |

## Next step

Go to [First Session](./first-session) and use the harness for the first time.
