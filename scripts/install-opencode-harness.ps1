param(
    [Parameter(Mandatory = $true)] [string]$SourceRoot,
    [string]$TargetRoot = "$env:USERPROFILE\.config\opencode"
)

$ErrorActionPreference = "Stop"

# ---- Shared manifest (single source of what travels) ----
$manifestPath = Join-Path $PSScriptRoot "harness-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Manifest not found next to this script: $manifestPath. Install the scripts/ tree that carries harness-manifest.json (it travels inside the exported zip)."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot not found: $SourceRoot"
}

if (-not (Test-Path -LiteralPath $TargetRoot)) {
    New-Item -ItemType Directory -Path $TargetRoot | Out-Null
}

foreach ($item in $manifest.include) {
    $source = Join-Path $SourceRoot $item
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination $TargetRoot -Recurse -Force
    }
}

# Runtime dependencies (tsx/esbuild ship platform-specific binaries), so install on
# the target machine rather than copying node_modules across systems.
$nodeModules = Join-Path $TargetRoot "node_modules"
if (Test-Path -LiteralPath $nodeModules) {
    "node_modules already present; run 'npm install' if package.json changed."
} else {
    "Installing dependencies with npm install..."
    Push-Location $TargetRoot
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install exited with code $LASTEXITCODE" }
        "Dependencies installed."
    } finally {
        Pop-Location
    }
}

# ---- Post-install assertions (v1.4): the same contract the export staged, asserted on the
# target. Content, not presence - a silent partial install is exactly the failure class this
# spec exists to catch. If you install an older export zip, this fails loudly with the reason. ----
foreach ($a in $manifest.assertions.presence) {
    $p = Join-Path $TargetRoot ($a.path -replace '/', '\')
    if (-not (Test-Path -LiteralPath $p)) {
        throw "Install aborted: $($a.path) missing on target - $($a.reason). Re-export with the matching harness version and retry."
    }
}
foreach ($a in $manifest.assertions.contains) {
    $p = Join-Path $TargetRoot ($a.path -replace '/', '\')
    if (-not (Select-String -LiteralPath $p -Pattern $a.pattern -Quiet)) {
        throw "Install aborted: $($a.path) on target lacks '$($a.pattern)' - $($a.reason)."
    }
}
"Post-install assertion passed: agent/code-reviewer.md carries the typed-findings contract; tests/ and docs/harness/ present."

"Verify the harness: cd `"$TargetRoot`"; npm run typecheck; npm test"
"Review opencode.jsonc; runtime paths resolve from `$env:USERPROFILE and os.homedir(), so no manual path edits are needed on a standard Windows profile."
