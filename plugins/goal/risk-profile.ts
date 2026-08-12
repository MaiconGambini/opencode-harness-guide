import type { GoalRiskLevel } from "./state-schema.ts"

export type GoalRiskProfile = {
  riskLevel: GoalRiskLevel
  sourcePaths: string[]
  containsExternalContent: boolean
  quarantined: boolean
}

// H1: Word-boundary-anchored HIGH signals. Genuinely risky vocabulary only;
// noise words that self-trip on this plugin's own domain (config/provider/
// cursor/opencode/script/plugin) were dropped. Multi-word phrases (e.g.
// "git push", "rm -rf", "private key") are matched with \b...\b around the
// whole phrase so partial tokens like "configure" no longer fire.
const HIGH_RISK_PATTERNS: RegExp[] = [
  /\bsecret\b/i,
  /\bsecrets\b/i,
  /\bcredential\b/i,
  /\bcredentials\b/i,
  /\bdeploy\b/i,
  /\bdeploys\b/i,
  /\bdeployment\b/i,
  /\btoken\b/i,
  /\btokens\b/i,
  /\.env\b/i,
  /\brm\s+-rf\b/i,
  /\bgit\s+push\b/i,
  /\bprivate\s+key\b/i,
]

// H1: MEDIUM signals — meaningful state/permission changes, but not the
// domain-noise words removed above.
const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /\bmigration\b/i,
  /\bmigrations\b/i,
  /\bschema\s+change\b/i,
  /\bauth\s+flow\b/i,
  /\bpermission\b/i,
  /\bpermissions\b/i,
]

export function classifyGoalRisk(objective: string, workspaceRoot: string = process.cwd()): GoalRiskProfile {
  const sourcePaths = extractSourcePaths(objective)
  const containsExternalContent = detectExternalContent(objective, sourcePaths, workspaceRoot)
  const riskLevel = containsExternalContent ? "untrusted" : inferLocalRisk(objective)
  return { riskLevel, sourcePaths, containsExternalContent, quarantined: riskLevel === "untrusted" }
}

function inferLocalRisk(objective: string): GoalRiskLevel {
  // H1: Anchored patterns replace unbounded substring `.includes`/regex so
  // "deploy docs" stays low unless a real risk token appears as a whole word.
  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(objective))) return "high"
  if (MEDIUM_RISK_PATTERNS.some((pattern) => pattern.test(objective))) return "medium"
  return "low"
}

// H2: External content requires a quarantined goal, so detection must cover more
// than http(s). We flag http(s), non-http URI schemes, bare domains, and any
// extracted sourcePath that resolves outside the workspace root.
function detectExternalContent(objective: string, sourcePaths: string[], workspaceRoot: string): boolean {
  if (/\bhttps?:\/\//i.test(objective)) return true
  if (/\b(?:ftp|file|s3|gs|smb|ssh|sftp):\/\//i.test(objective)) return true
  if (containsBareDomain(objective)) return true
  return sourcePaths.some((path) => isOutsideWorkspace(path, workspaceRoot))
}

// H2: Bare domains like "www.foo.com" or "example.co.uk/path" arrive without a
// scheme. Match either an explicit "www." host or a host whose last label is a
// known public TLD, so dotted code identifiers ("a.b", "goal.record.ts") that
// don't end in a real TLD do not over-fire.
const BARE_DOMAIN_PATTERN =
  /\b(?:www\.[a-z0-9-]+(?:\.[a-z0-9-]+)*|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|dev|co|ai|app|gov|edu))\b/i

function containsBareDomain(objective: string): boolean {
  return BARE_DOMAIN_PATTERN.test(objective)
}

// H2: An extracted @-path is external if it escapes the workspace root: an
// absolute path outside root, or a relative path that walks out via "..".
function isOutsideWorkspace(sourcePath: string, workspaceRoot: string): boolean {
  const normalized = sourcePath.replace(/\\/g, "/")
  const root = workspaceRoot.replace(/\\/g, "/").replace(/\/+$/, "")
  if (/^(?:[a-zA-Z]:\/|\/)/.test(normalized) || /^~\//.test(normalized)) {
    return !normalized.toLowerCase().startsWith(root.toLowerCase() + "/")
  }
  return normalized.split("/").filter(Boolean).some((segment) => segment === "..")
}

function extractSourcePaths(objective: string): string[] {
  const matches = objective.match(/@[\w.\\/:-]+/g) ?? []
  return [...new Set(matches.map((item) => item.slice(1)))]
}
