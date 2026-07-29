import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export function pathExists(targetPath) {
  return fs.existsSync(targetPath)
}

export function readTextIfExists(targetPath) {
  if (!pathExists(targetPath)) return ""
  return fs.readFileSync(targetPath, "utf8")
}

export function listFiles(rootPath, predicate = () => true) {
  if (!pathExists(rootPath)) return []
  if (fs.statSync(rootPath).isFile()) return predicate(rootPath) ? [rootPath] : []
  const result = []
  walkDirectory(rootPath, result, predicate)
  return result
}

export function redactedFinding(filePath, message, severity = "WARN") {
  return { severity, file: filePath, message }
}

// Finding-5: single shared source of truth for secret token length thresholds.
// Previously scanners disagreed ({4,} in scan vs {8,}/{12,} in redact), causing
// inconsistent detection. All scanners now import these constants.
export const MIN_SECRET_TOKEN_LEN = 8
export const MIN_SK_TOKEN_LEN = 12
export const MIN_BEARER_TOKEN_LEN = 20

// Finding-5: canonical JSON secret-key/value pattern reused by security-scan.
export const SECRET_PATTERN = new RegExp(
  `("(api[_-]?key|authorization|x-api-key|x-goog-api-key|password|secret|token)"\\s*:\\s*"[^"$][^"]{${MIN_SECRET_TOKEN_LEN},}")` +
    `|(bearer\\s+[a-z0-9._-]{${MIN_BEARER_TOKEN_LEN},})` +
    `|(sk-[a-z0-9]{${MIN_SK_TOKEN_LEN},})`,
  "i",
)

// Finding-3: hard-secret / private-key patterns escalate to FAIL (not WARN).
export const HARD_SECRET_PATTERN = new RegExp(
  `(sk-[a-z0-9]{${MIN_SK_TOKEN_LEN},})` +
    `|(-----BEGIN [A-Z ]*PRIVATE KEY-----)` +
    `|(bearer\\s+[a-z0-9._-]{${MIN_BEARER_TOKEN_LEN},})`,
  "i",
)

export function globalOpenCodeRoot() {
  return path.join(os.homedir(), ".config", "opencode")
}

export function cursorRoot() {
  return path.join(os.homedir(), ".cursor")
}

export function uniqueExistingPaths(paths) {
  return [...new Set(paths.map((item) => path.resolve(item)))].filter(pathExists)
}

// Finding-5: thresholds now come from the shared constants above so redaction
// and detection stay in lockstep. Wired into security-scan's --text summary.
export function redactSensitiveText(text) {
  const bearer = new RegExp(`bearer\\s+[a-z0-9._-]{${MIN_BEARER_TOKEN_LEN},}`, "gi")
  const sk = new RegExp(`sk-[a-z0-9]{${MIN_SK_TOKEN_LEN},}`, "gi")
  return text
    .replace(/(authorization|api[_-]?key|x-api-key|x-goog-api-key|token|password|secret|cookie)(\s*[=:]\s*)[^\s,;}]+/gi, "$1$2[REDACTED]")
    .replace(bearer, "Bearer [REDACTED]")
    .replace(sk, "sk-[REDACTED]")
}

function walkDirectory(currentPath, result, predicate) {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name)
    if (entry.isDirectory() && !isIgnoredDirectory(entry.name)) walkDirectory(fullPath, result, predicate)
    if (entry.isFile() && predicate(fullPath)) result.push(fullPath)
  }
}

function isIgnoredDirectory(name) {
  return ["node_modules", ".git", "dist", "build", "coverage", ".backup", "cache"].includes(name)
}
