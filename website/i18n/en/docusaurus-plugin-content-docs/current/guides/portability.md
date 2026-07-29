---
sidebar_position: 4
---

# Portability

The harness can be moved between machines or shared with other
developers. There are three paths: export by script, installation from
a copy, and cloning via Git (the most recommended).

## Via Git (recommended)

The simplest and most reliable way is to clone the public repository:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

- Ensures you always have the latest version.
- The dependencies are installed correctly for your platform.
- Updating later is just a `git pull` followed by `npm install`.

## Export from the current PC

When Git isn't an option — isolated machine, offline transfer — generate
a package with the export script:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"
```

- Generates `opencode-harness-export.zip` on the desktop.
- Includes `opencode.jsonc`, skills, plugins, templates, scripts, and
  `package.json`.
- **Does not include** `node_modules` on purpose — platform binaries are not
  portable.

## Install from the copy

On the target PC, with the zip contents extracted, run the installer:

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

- The script copies the files to the target.
- `npm install` installs the Node dependencies locally.
- Platform binaries (such as `tsx`) require this local `npm install`:
  copying `node_modules` between different systems does not work.

## Cautions

- **Do not copy `node_modules` between machines.** Always run `npm install` on
  the target.
- **Review `opencode.jsonc` after installation.** The paths use
  `$env:USERPROFILE` and `os.homedir()`, so no manual path editing
  is necessary on a standard Windows profile.
- **Back up before overwriting.** If you already have a configuration in
  `~/.config/opencode`, copy it to a safe location before cloning or
  installing over it.
