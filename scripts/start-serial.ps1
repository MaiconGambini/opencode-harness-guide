# Launch opencode WITHOUT background/parallel dispatch (reliable serial mode).
# Use this when background subagents misbehave: with the experimental flags OFF, task()
# blocks and returns the child's real final report, so the scheduler reconciles the actual
# result instead of racing the "background task started" stub (see docs/harness/v1.1-context.md
# Task 3 diagnosis). Trade-off: lanes run one at a time — no parallelism.
# Usage:  .\scripts\start-serial.ps1  [-Port 4096]  [-Dir <projectPath>]
param(
  [int]$Port = 4096,
  [string]$Dir = "."
)
# Explicitly clear the experimental flags in case they leak in from the environment.
Remove-Item Env:OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS -ErrorAction SilentlyContinue
Remove-Item Env:OPENCODE_EXPERIMENTAL_PARALLEL -ErrorAction SilentlyContinue
Write-Host "SERIAL mode (no background/parallel dispatch)  port=$Port  agent=spec-lead" -ForegroundColor Yellow
Write-Host "task() blocks and returns the child's real result — no stub race." -ForegroundColor DarkGray
opencode --port $Port --agent spec-lead $Dir
