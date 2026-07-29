param(
    [Parameter(Mandatory = $true)] [string]$SourceRoot,
    [string]$TargetRoot = "$env:USERPROFILE\.config\opencode"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot not found: $SourceRoot"
}

if (-not (Test-Path -LiteralPath $TargetRoot)) {
    New-Item -ItemType Directory -Path $TargetRoot | Out-Null
}

$include = @("opencode.jsonc", "agent", "command", "catalog", "docs", "skills", "plugins", "templates", "scripts", "tests", "package.json", "package-lock.json", "tsconfig.json")
foreach ($item in $include) {
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

"Verify the harness: cd `"$TargetRoot`"; npm run typecheck; npm test"
"Review opencode.jsonc; runtime paths resolve from `$env:USERPROFILE and os.homedir(), so no manual path edits are needed on a standard Windows profile."
