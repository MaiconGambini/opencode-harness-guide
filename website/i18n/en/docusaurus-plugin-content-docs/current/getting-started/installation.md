---
sidebar_position: 2
---

# Installation

The OpenCode Harness is distributed as a public Git repository. You clone it
into `~/.config/opencode` and the files become available to OpenCode
immediately.

## Step 1: Back up your current configuration (if any)

If you already have a `~/.config/opencode` with your own plugins and commands,
rename the folder before cloning:

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.config\opencode" -NewName "opencode-backup"
```

- Version 1 does not automatically merge into an existing configuration.
- Use the backup as a reference and copy over whatever you want afterward.

## Step 2: Clone the repository

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

- The repository is cloned straight into the OpenCode configuration directory.

## Step 3: Install Node dependencies

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

- Enters the freshly cloned directory.
- Downloads the dependencies for the harness plugins and scripts.

## Step 4: Verify the installation

```powershell
npm run typecheck
npm test
```

- `npm run typecheck` checks the TypeScript types of the plugins.
- `npm test` runs the harness test suite.
- If both commands return without errors, the harness is ready to use.

## Resulting structure

After installation, `~/.config/opencode` contains:

| Item | Content |
|---|---|
| `opencode.jsonc` | Global commands and plugins. |
| `skills/` | Skills that OpenCode loads automatically. |
| `plugins/` | Runtime plugins. |
| `scripts/` | PowerShell and Node utilities. |
| `templates/` | Reusable templates (feature_list, specs, standards). |
| `package.json` | Dependencies and verification scripts. |

None of this is compiled or bundled. These are text and script files that
OpenCode reads directly.

## Troubleshooting

| Problem | Action |
|---|---|
| `npm install` fails | Check that Node.js 20+ is installed (`node --version`). |
| `npm run typecheck` fails | TypeScript may be out of date. Run `npm ci` and try again. |
| OpenCode doesn't load the commands | Close and reopen OpenCode. The configuration is loaded only at startup. |

## Next step

Go to [First Session](./first-session) and use the harness for the first time.
