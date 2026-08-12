# Launch opencode with parallel background dispatch (spec-lead scheduler).
# Usage:  .\scripts\start-parallel.ps1  [-Port 4096]  [-Dir <projectPath>]
param(
  [int]$Port = 4096,
  [string]$Dir = "."
)
$env:OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS = "true"
$env:OPENCODE_EXPERIMENTAL_PARALLEL = "true"
Write-Host "BACKGROUND_SUBAGENTS=true  PARALLEL=true  port=$Port  agent=spec-lead" -ForegroundColor Green
Write-Host "Watch a worker in another pane:  opencode attach http://127.0.0.1:$Port --session <childId>" -ForegroundColor DarkGray
opencode --port $Port --agent spec-lead $Dir
