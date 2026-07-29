import { execFileSync } from "node:child_process"
import path from "node:path"
import { cursorRoot, globalOpenCodeRoot, pathExists, readTextIfExists } from "./harness-common.mjs"

function runGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim()
  } catch {
    return "unavailable"
  }
}

function jsonState(filePath) {
  try {
    return JSON.parse(readTextIfExists(filePath) || "{}")
  } catch {
    return { parseError: true }
  }
}

const prevc = jsonState(".opencode/state/prevc-workflow.json")
const report = {
  status: "PASS",
  branch: runGit(["branch", "--show-current"]),
  dirtyState: runGit(["status", "--short"]),
  prevcPhase: prevc.phase ?? "unknown",
  handoffExists: pathExists("docs/harness/session-handoff.md"),
  globalOpenCodeConfigExists: pathExists(path.join(globalOpenCodeRoot(), "opencode.jsonc")),
  globalCursorExists: pathExists(cursorRoot()),
  securityScanCommand: "node .opencode/scripts/harness-security-scan.mjs",
  contextBudgetCommand: "node .opencode/scripts/harness-context-budget.mjs",
  globalSecurityScanCommand: `node ${path.join(globalOpenCodeRoot(), "scripts", "harness-security-scan.mjs")}`,
}

if (report.dirtyState && report.dirtyState !== "unavailable") report.status = "WARN"

// Finding-4: argv flags. --json (default) keeps the JSON block; --markdown emits
// a Markdown status block; --exit-code opts into the non-PASS -> exitCode=1 gate.
function renderMarkdown(statusReport) {
  const rows = Object.entries(statusReport)
    .filter(([key]) => key !== "status")
    .map(([key, value]) => `| ${key} | ${JSON.stringify(value)} |`)
  return [
    `## Harness Status: ${statusReport.status}`,
    "",
    "| field | value |",
    "| --- | --- |",
    ...rows,
  ].join("\n")
}

const statusArgs = process.argv.slice(2)
if (statusArgs.includes("--markdown")) console.log(renderMarkdown(report))
else console.log(JSON.stringify(report, null, 2))

// Keep prior behavior: still set exitCode on non-PASS even without the flag.
if (statusArgs.includes("--exit-code") || report.status !== "PASS") {
  if (report.status !== "PASS") process.exitCode = 1
}
