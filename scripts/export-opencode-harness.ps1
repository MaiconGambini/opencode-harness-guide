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

# The manifest is the single source of what travels; docs/harness/site-sync.md derives the
# guide-repo code half from this same list, so a file added to v1.4 updates both paths at once.
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

# Post-staging assertion (v1.3): a silent partial package is exactly the failure class this
# spec exists to catch - an install that ships the new skills but the OLD reviewer prompts.
# Assert the content, not the file's presence, and fail the export loudly if it is missing.
$reviewerPath = Join-Path $staging "agent\code-reviewer.md"
$testPath = Join-Path $staging "tests\harness-continual-harness.test.mjs"
$docsPath = Join-Path $staging "docs\harness"
if (-not (Test-Path -LiteralPath $reviewerPath)) {
    throw "Export aborted: staged agent\code-reviewer.md missing - the v1.3 typed-findings contract would not ship."
}
if (-not (Select-String -LiteralPath $reviewerPath -Pattern "Typed Findings" -Quiet)) {
    throw "Export aborted: staged agent\code-reviewer.md lacks the typed-findings contract - refusing to ship a silent partial install."
}
if (-not (Test-Path -LiteralPath $testPath)) {
    throw "Export aborted: staged tests\harness-continual-harness.test.mjs missing - the v1.3 test suite would not ship."
}
if (-not (Test-Path -LiteralPath $docsPath)) {
    throw "Export aborted: staged docs\harness missing - the v1.3 procedure docs would not ship."
}
"Staged content assertion passed: agent/code-reviewer.md carries the typed-findings contract; tests/ and docs/harness/ present."

if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OutputPath -Force
"Exported OpenCode harness to $OutputPath"
