param(
    [string]$SourceRoot = "$env:USERPROFILE\.config\opencode",
    [string]$OutputPath = "$env:USERPROFILE\Desktop\opencode-harness-export.zip"
)

$ErrorActionPreference = "Stop"

# ---- Shared manifest (single source of what travels) ----
$manifestPath = Join-Path $PSScriptRoot "harness-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Manifest not found next to this script: $manifestPath. The manifest is the single source of what travels; export refuses to run without it."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot not found: $SourceRoot"
}

# Manifest/source mismatch guard: every declared exclusion must resolve under SourceRoot
# before anything is copied. A stale manifest would silently stop excluding a path (or mask
# drift); fail loudly instead so the mismatch is fixed, not shipped around.
foreach ($rel in $manifest.exclude.paths) {
    $declared = Join-Path $SourceRoot ($rel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $declared)) {
        throw "Export aborted - manifest/source mismatch: manifest.exclude.paths declares '$rel' but no such path exists under SourceRoot ($declared). Update the manifest to match the source tree (or restore the path) before exporting."
    }
}

$staging = Join-Path $env:TEMP "opencode-harness-export"
if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging | Out-Null

# The manifest is the single source of what travels; docs/harness/site-sync.md derives the
# guide-repo code half from this same list, so a file added here updates both paths at once.
#
# Public-subset exclusion happens at COPY time: the private source legitimately contains
# offensive skill families and local runtime evidence, so their presence under SourceRoot is
# NOT a failure. They are kept out of staging here; the machine check below still fails if
# anything excluded leaks via another route (an include entry not covered by this filter, or
# an agent/skill file that still references an excluded skill).
$excludedFamilies = @($manifest.exclude.skillFamilies) + @($manifest.exclude.skillExact)
$excludedRelPaths = @($manifest.exclude.paths)

foreach ($item in $manifest.include) {
    $source = Join-Path $SourceRoot $item
    if (-not (Test-Path -LiteralPath $source)) { continue }
    if ($item -eq "skills") {
        $destSkills = Join-Path $staging "skills"
        New-Item -ItemType Directory -Path $destSkills -Force | Out-Null
        foreach ($child in Get-ChildItem -LiteralPath $source) {
            $skip = $false
            foreach ($family in $excludedFamilies) {
                if ($child.Name -like "$family*") { $skip = $true; break }
            }
            if (-not $skip) {
                Copy-Item -LiteralPath $child.FullName -Destination $destSkills -Recurse -Force
            }
        }
    }
    elseif ($item -eq "docs") {
        Copy-Item -LiteralPath $source -Destination $staging -Recurse -Force
        foreach ($rel in $excludedRelPaths) {
            $candidate = Join-Path $staging ($rel -replace '/', '\')
            if (Test-Path -LiteralPath $candidate) {
                Remove-Item -LiteralPath $candidate -Recurse -Force
            }
        }
    }
    else {
        Copy-Item -LiteralPath $source -Destination $staging -Recurse -Force
    }
}

$nodeModules = Join-Path $staging "node_modules"
if (Test-Path -LiteralPath $nodeModules) {
    Remove-Item -LiteralPath $nodeModules -Recurse -Force
}

# ---- Public-subset machine check (v1.4): fail the export loudly instead of shipping a
# package that cannot be mirrored to the public guide. Exclusions are declared in
# scripts/harness-manifest.json; this check makes them enforced, not aspirational. ----
$violations = @()

# 1. Offensive skill families never travel (recon/redteam/hiagosh/chains + standalone attacks).
#    $excludedFamilies was built at copy time above; this check guards the staged result.
$stagedSkills = Join-Path $staging "skills"
if (Test-Path -LiteralPath $stagedSkills) {
    foreach ($skillDir in Get-ChildItem -LiteralPath $stagedSkills -Directory) {
        foreach ($family in $excludedFamilies) {
            if ($skillDir.Name -like "$family*") {
                $violations += "skills\$($skillDir.Name) matches excluded family '$family'"
            }
        }
    }
}

# 2. Local runtime evidence / docs never travel (gate reports, dated review notes).
foreach ($rel in $manifest.exclude.paths) {
    $candidate = Join-Path $staging ($rel -replace '/', '\')
    if (Test-Path -LiteralPath $candidate) {
        $violations += "excluded runtime-evidence path present: $rel"
    }
}

# 3. Routing files must not reference excluded skill families or exact skill names - they
#    would route the public agents to skills the public package does not ship (a silent hop
#    to a missing skill). Supports one-level patterns (agent/*.md) and nested skill patterns
#    (skills/*/SKILL.md); any other shape fails loudly instead of silently skipping.
foreach ($glob in $manifest.routingCheck.files) {
    $segments = @($glob -split '/')
    if ($segments.Count -lt 2) {
        throw "Export aborted - unsupported routingCheck.files pattern: $glob (expected '<dir>/<leaf>' or '<dir>/*/<leaf>')."
    }
    $base = Join-Path $staging $segments[0]
    if (-not (Test-Path -LiteralPath $base)) { continue }
    $leaf = $segments[-1]
    if ($segments.Count -eq 2) {
        $routingFiles = @(Get-ChildItem -LiteralPath $base -Filter $leaf -File)
    }
    elseif ($segments.Count -eq 3 -and $segments[1] -eq '*') {
        $routingFiles = @()
        foreach ($subDir in Get-ChildItem -LiteralPath $base -Directory) {
            $routingFiles += @(Get-ChildItem -LiteralPath $subDir.FullName -Filter $leaf -File)
        }
    }
    else {
        throw "Export aborted - unsupported routingCheck.files pattern: $glob (expected '<dir>/<leaf>' or '<dir>/*/<leaf>')."
    }
    foreach ($routingFile in $routingFiles) {
        $content = Get-Content -LiteralPath $routingFile.FullName -Raw
        foreach ($pattern in $manifest.routingCheck.patterns) {
            if ($content.IndexOf($pattern, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                $relPath = $routingFile.FullName.Substring($staging.Length + 1)
                $violations += "$relPath references excluded family '$pattern'"
            }
        }
    }
}

if ($violations.Count -gt 0) {
    throw "Export aborted - public-subset policy violations:" + "`n  - " + ($violations -join "`n  - ") + "`nFix the source tree (see docs/harness/site-sync.md) and re-run."
}
"Public-subset check passed: no excluded skill family, runtime-evidence path, or agent routing to excluded skills in staging."

# ---- Staged content assertions (v1.3 contract, declared in the manifest): a silent partial
# package is exactly the failure class this spec exists to catch - an install that ships the
# new skills but the OLD reviewer prompts. Assert the content, not the file's presence, and
# fail the export loudly if it is missing. ----
foreach ($a in $manifest.assertions.presence) {
    $p = Join-Path $staging ($a.path -replace '/', '\')
    if (-not (Test-Path -LiteralPath $p)) {
        throw "Export aborted: staged $($a.path) missing - $($a.reason)."
    }
}
foreach ($a in $manifest.assertions.contains) {
    $p = Join-Path $staging ($a.path -replace '/', '\')
    if (-not (Select-String -LiteralPath $p -Pattern $a.pattern -Quiet)) {
        throw "Export aborted: staged $($a.path) lacks '$($a.pattern)' - $($a.reason)."
    }
}
"Staged content assertion passed: agent/code-reviewer.md carries the typed-findings contract; tests/ and docs/harness/ present."

if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OutputPath -Force
"Exported OpenCode harness to $OutputPath"
