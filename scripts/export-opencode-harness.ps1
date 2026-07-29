param(
    [string]$SourceRoot = "$env:USERPROFILE\.config\opencode",
    [string]$OutputPath = "$env:USERPROFILE\Desktop\opencode-harness-export.zip"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot not found: $SourceRoot"
}

$staging = Join-Path $env:TEMP "opencode-harness-export"
if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging | Out-Null

$include = @("opencode.jsonc", "agent", "command", "catalog", "docs", "skills", "plugins", "templates", "scripts", "tests", "package.json", "package-lock.json", "tsconfig.json")
foreach ($item in $include) {
    $source = Join-Path $SourceRoot $item
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination $staging -Recurse -Force
    }
}

$nodeModules = Join-Path $staging "node_modules"
if (Test-Path -LiteralPath $nodeModules) {
    Remove-Item -LiteralPath $nodeModules -Recurse -Force
}

if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OutputPath -Force
"Exported OpenCode harness to $OutputPath"
