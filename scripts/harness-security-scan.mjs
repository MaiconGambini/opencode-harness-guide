import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  cursorRoot,
  globalOpenCodeRoot,
  HARD_SECRET_PATTERN,
  listFiles,
  readTextIfExists,
  redactedFinding,
  redactSensitiveText,
  SECRET_PATTERN,
  uniqueExistingPaths,
} from "./harness-common.mjs"

const scanRoots = uniqueExistingPaths([
  ".opencode",
  ".cursor",
  globalOpenCodeRoot(),
  path.join(cursorRoot(), "skills"),
  path.join(cursorRoot(), "skills-cursor"),
  path.join(cursorRoot(), "plugins", "local"),
  path.join(cursorRoot(), "plans"),
  path.join(cursorRoot(), "mcp.json"),
])
const includePattern = /\.(md|json|jsonc|ts|js|mjs|yml|yaml)$/i
// Finding-5: reuse the shared SECRET_PATTERN (was a divergent {4,}-threshold copy).
const secretPattern = SECRET_PATTERN
// Finding-3: private-key blocks are always a hard FAIL.
const privateKeyPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----/
const commandPattern = /(curl\s+[^|]+\|\s*(bash|sh|powershell|pwsh)|iwr\s+[^|]+\|\s*iex|irm\s+[^|]+\|\s*iex|invoke-expression|\b(nc|ncat|scp|ssh)\b)/i
const unicodePattern = /[\u202A-\u202E\u2066-\u2069\u200B\u200C\u200D]/u

const intentionalPatternFiles = [
  "harness-security-guard.ts",
  "harness-security-scan.mjs",
  "harness-mcp-inventory.mjs",
  "harness-tool-activity.ts",
  "risk-profile.ts",
  "security-policy.md",
  "hook-policy.md",
  "dangerous-command-policy.md",
]

function hasIntentionalPatterns(filePath) {
  return intentionalPatternFiles.some((name) => filePath.endsWith(name))
}

export function scanFile(filePath) {
  const text = readTextIfExists(filePath)
  const findings = []
  // Finding-3: hard secrets / private keys are FAIL; softer heuristic hits stay WARN.
  if (privateKeyPattern.test(text)) findings.push(redactedFinding(filePath, "Private key block found.", "FAIL"))
  else if (HARD_SECRET_PATTERN.test(text)) findings.push(redactedFinding(filePath, "Hard secret (sk-/bearer token) found.", "FAIL"))
  else if (secretPattern.test(text)) findings.push(redactedFinding(filePath, "Potential secret-bearing key or token pattern found.", "WARN"))
  // Finding-3 (revised): FAIL is reserved for actual credential material
  // (private keys / hard secrets). Dangerous-command matches are WARN — command
  // strings legitimately appear in docs, skills, and pattern-definition files, so
  // a hard FAIL there is noise, not signal.
  if (!hasIntentionalPatterns(filePath) && commandPattern.test(text)) findings.push(redactedFinding(filePath, "Potential dangerous shell/network command found.", "WARN"))
  if (unicodePattern.test(text)) findings.push(redactedFinding(filePath, "Invisible or bidi Unicode control character found.", "WARN"))
  if (!hasIntentionalPatterns(filePath) && /<!--[\s\S]*?(ignore|system|developer|instruction)[\s\S]*?-->/i.test(text)) findings.push(redactedFinding(filePath, "Potential prompt-injection HTML comment found.", "WARN"))
  return findings
}

export function resolveStatus(allFindings) {
  if (allFindings.some((finding) => finding.severity === "FAIL")) return "FAIL"
  if (allFindings.length > 0) return "WARN"
  return "PASS"
}

// Finding-3: default output is JSON; --text prints a scrubbed human summary.
function printReport(report, useText) {
  if (!useText) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  const counts = report.findings.reduce((acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] ?? 0) + 1 }), {})
  const uniqueFiles = [...new Set(report.findings.map((f) => f.file))]
  const lines = [
    `status: ${report.status}`,
    `scanned files: ${report.scannedFiles}`,
    `findings: FAIL=${counts.FAIL ?? 0} WARN=${counts.WARN ?? 0}`,
    "flagged files:",
    ...uniqueFiles.map((file) => `  - ${file}`),
  ]
  // Finding-5: scrub the summary through redactSensitiveText so no secret value
  // can leak even if a file path or message ever carried one.
  console.log(redactSensitiveText(lines.join("\n")))
}

function runCli() {
  const args = process.argv.slice(2)
  const useText = args.includes("--text")
  // Exclude scanner test fixtures: they intentionally hold FAKE secret-shaped
  // material and would otherwise FAIL the gate on every run.
  const isTestFixture = (file) => /[\\/]__tests__[\\/]/.test(file)
  // Recovery backups under archive/ are frozen, non-runtime copies (see runtime
  // catalog). Gating them just re-flags material already reviewed in its live home.
  const isArchived = (file) => /[\\/]archive[\\/]/.test(file)
  const files = scanRoots.flatMap((root) => listFiles(path.resolve(root), (file) => includePattern.test(file) && !isTestFixture(file) && !isArchived(file)))
  const findings = files.flatMap(scanFile)
  const status = resolveStatus(findings)
  const report = { status, scanRoots, scannedFiles: files.length, findings }
  printReport(report, useText)
  // Finding-3: exit 2 on FAIL, 1 on WARN, 0 on PASS so CI can gate on it.
  if (status === "FAIL") process.exitCode = 2
  else if (status === "WARN") process.exitCode = 1
}

// Auto-run only when invoked directly (keeps the CLI entrypoint working) but not
// when imported by tests. `pathToFileURL(argv[1])` matches import.meta.url on Windows too.
if (import.meta.url === pathToFileURL(process.argv[1]).href) runCli()
