---
sidebar_position: 4
---

# Portability

The harness can be moved between machines or shared with other developers.

## Export from the current PC

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"
```

This generates `opencode-harness-export.zip` on the desktop. The file
includes `opencode.jsonc`, skills, plugins, templates, scripts and
`package.json` — without `node_modules`.

## Install on the other PC

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

The script installs the Node dependencies on the target machine. Platform
binaries (tsx) require a local `npm install`; copying `node_modules`
between different systems does not work.

## Via Git (recommended)

The simplest and most reliable way is to clone the public repository:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

This ensures you always have the latest version and that the dependencies
are installed correctly for your platform.

## Cautions

- Do not copy `node_modules` between machines.
- Review `opencode.jsonc` after installation. Paths use
  `$env:USERPROFILE` and `os.homedir()`, so no manual path editing is
  necessary on a standard Windows profile.
- If you have an existing configuration, back it up before overwriting.
