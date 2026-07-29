import path from "node:path"
import type { Plugin } from "@opencode-ai/plugin"

interface ToolArgs {
  command?: string
  filePath?: string
  file_path?: string
  path?: string
}

interface ToolInput {
  tool?: string
  args?: ToolArgs
}

interface ToolOutput {
  args?: ToolArgs
}

// HARNESS_PROFILE tiers (this guard's behavior):
//   minimal  — recovery profile. Irreversible-operation denies and sensitive-path
//              denies remain active; diagnostic heuristics are skipped.
//   standard — (default when unset) minimal plus warnings for risky reads.
//   strict   — standard, but risky reads are denied.
//
// No environment variable disables these rules. Recovery cannot bypass an
// irreversible-operation deny.
const profile = process.env.HARNESS_PROFILE ?? "standard"

// Always enforced, including under HARNESS_PROFILE=minimal: destructive filesystem
// and Git operations that are effectively unrecoverable.
const irreversibleCommands = [
  /\b(remove-item|rmdir|rd)\b[\s\S]*\b(recurse|s)\b/i,
  /\bdel\b\s+\/s/i,
  // Remote shells and downloaded scripts execute outside the local trust boundary.
  /\b(ssh|sftp|scp|nc|ncat|telnet)\b/i,
  /\b(curl|wget)\b[^|]*\|\s*(bash|sh|powershell|pwsh)\b/i,
  /\b(iwr|irm|invoke-webrequest|invoke-restmethod)\b[\s\S]*\|\s*(iex|invoke-expression)\b/i,
]

// Diagnostic-only heuristics. The explicit permission policy handles approval
// prompts for mutable but recoverable operations.
const riskyCommands = [
  /\b(invoke-expression|iex)\b/i,
]

const sensitivePathParts = [".ssh", ".aws", ".azure", ".gnupg"]
// Private-key detection broadened beyond id_rsa (finding: private keys) to cover
// other OpenSSH key types and common key/cert container extensions.
const sensitiveFilePatterns = [
  /\.env(\.|$)/i,
  /id_rsa/i,
  /id_ed25519/i,
  /id_ecdsa/i,
  /id_dsa/i,
  /\.(pem|p12|pfx|key)$/i,
  /mcp\.json$/i,
]
const secretValuePatterns = [
  /bearer\s+[a-z0-9._-]{20,}/gi,
  /sk-[a-z0-9]{20,}/gi,
  /(authorization|api[_-]?key|x-api-key|token|password|secret|cookie)\s*[:=]\s*[^\s"']+/gi,
]

function commandFrom(input: ToolInput, output: ToolOutput): string {
  return output.args?.command ?? input.args?.command ?? ""
}

function pathFrom(input: ToolInput, output: ToolOutput): string {
  return output.args?.filePath ?? output.args?.file_path ?? output.args?.path ?? input.args?.filePath ?? input.args?.file_path ?? input.args?.path ?? ""
}

// C1: the old predicate required the sensitive segment to be delimited by slashes
// on BOTH sides (`/${part}/`), so terminal paths like `~/.aws` or `~/.ssh` and
// exact matches slipped through. Now also match when the segment is the final
// path element (`/${part}` at end) or equals the basename/dirname outright.
function hasSensitiveSegment(normalized: string): boolean {
  return sensitivePathParts.some((part) => {
    if (normalized.includes(`/${part}/`)) return true
    if (normalized.endsWith(`/${part}`)) return true
    if (path.basename(normalized) === part) return true
    if (path.dirname(normalized) === part) return true
    return false
  })
}

function isSensitivePath(rawPath: string): boolean {
  // Normalize Windows backslashes so `C:\Users\me\.ssh` matches the same rules.
  const normalized = rawPath.replaceAll("\\", "/").toLowerCase()
  return hasSensitiveSegment(normalized) || sensitiveFilePatterns.some((pattern) => pattern.test(path.basename(normalized)))
}

function redactedPreview(value: string): string {
  const redacted = secretValuePatterns.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value)
  return redacted.length > 160 ? `${redacted.slice(0, 160)}...[TRUNCATED]` : redacted
}

function containsSensitiveRead(command: string): boolean {
  if (!/\b(cat|type|get-content|gc)\b/i.test(command)) return false
  return isSensitivePath(command.replaceAll("'", "").replaceAll("\"", ""))
}

interface CommandSegments {
  complete: boolean
  segments: string[][]
}

function tokenizeCommand(command: string): CommandSegments {
  const segments: string[][] = [[]]
  let token = ""
  let quote: "'" | '"' | undefined
  let escaped = false

  const appendToken = (): void => {
    if (!token) return
    segments.at(-1)?.push(token)
    token = ""
  }
  const appendSegment = (): void => {
    appendToken()
    if (segments.at(-1)?.length) segments.push([])
  }

  for (const character of command) {
    if (escaped) {
      token += character
      escaped = false
      continue
    }
    if (character === "\\") {
      escaped = true
      continue
    }
    if (quote) {
      if (character === quote) quote = undefined
      else token += character
      continue
    }
    if (character === "'" || character === '"') {
      quote = character
      continue
    }
    if (/\s/.test(character)) {
      appendToken()
      continue
    }
    if (character === ";" || character === "|" || character === "&") {
      appendSegment()
      continue
    }
    token += character
  }

  if (escaped) token += "\\"
  appendToken()
  return { complete: !quote, segments: segments.filter((segment) => segment.length > 0) }
}

function hasRecursiveRm(tokens: string[]): boolean {
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].toLowerCase() !== "rm") continue
    for (let optionIndex = index + 1; optionIndex < tokens.length; optionIndex += 1) {
      const option = tokens[optionIndex]
      if (option === "--") break
      if (option.toLowerCase() === "--recursive" || /^-[^-]*r/i.test(option)) return true
    }
  }
  return false
}

function isGitGlobalOption(token: string, nextToken: string | undefined): number | undefined {
  if (["-c", "-C", "--config-env", "--exec-path", "--git-dir", "--work-tree", "--namespace", "--super-prefix"].includes(token)) {
    return nextToken ? 2 : undefined
  }
  if (/^-C.+/.test(token) || /^(--git-dir|--work-tree|--namespace|--super-prefix)=/.test(token)) return 1
  if (["--no-pager", "--paginate", "--bare", "--literal-pathspecs", "--glob-pathspecs", "--noglob-pathspecs", "--icase-pathspecs"].includes(token)) return 1
  return undefined
}

function hasDestructiveGitSubcommand(tokens: string[]): boolean {
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].toLowerCase() !== "git") continue
    let subcommandIndex = index + 1
    let parsed = true
    while (subcommandIndex < tokens.length && tokens[subcommandIndex].startsWith("-")) {
      const consumed = isGitGlobalOption(tokens[subcommandIndex], tokens[subcommandIndex + 1])
      if (!consumed) {
        parsed = false
        break
      }
      subcommandIndex += consumed
    }
    const remaining = tokens.slice(subcommandIndex)
    const subcommand = remaining[0]?.toLowerCase()
    if (subcommand === "reset" && remaining.some((token) => token.toLowerCase() === "--hard")) return true
    if (subcommand === "clean" && remaining.some((token) => token.toLowerCase() === "--force" || /^-[^-]*f/i.test(token))) return true
    // An unrecognized global option makes the command boundary ambiguous. Deny a
    // later destructive shape rather than risk treating a Git global option as safe.
    if (!parsed && remaining.some((token) => token.toLowerCase() === "reset") && remaining.some((token) => token.toLowerCase() === "--hard")) return true
    if (!parsed && remaining.some((token) => token.toLowerCase() === "clean") && remaining.some((token) => token.toLowerCase() === "--force" || /^-[^-]*f/i.test(token))) return true
  }
  return false
}

function isIrreversibleCommand(command: string): boolean {
  if (irreversibleCommands.some((pattern) => pattern.test(command))) return true
  const tokenized = tokenizeCommand(command)
  if (tokenized.segments.some((tokens) => hasRecursiveRm(tokens) || hasDestructiveGitSubcommand(tokens))) return true
  // Unterminated quoting is ambiguous. Preserve the prior conservative matching
  // fallback instead of allowing a command the token parser cannot fully classify.
  return !tokenized.complete && /\b(rm\s+.*(?:--recursive|-[a-z]*r)|git\s+.*\b(reset\b.*--hard|clean\b.*(?:--force|-[a-z]*f)))/i.test(command)
}

function assertSafeCommand(command: string): void {
  if (isIrreversibleCommand(command)) {
    throw new Error(`Harness security guard blocked irreversible command: ${redactedPreview(command)}`)
  }

  // Minimal recovery omits diagnostics, not deny rules.
  if (profile === "minimal") return

  const isStrict = profile === "strict"

  // Softer heuristics: strict blocks (throw), standard warns and allows.
  if (riskyCommands.some((pattern) => pattern.test(command)) || containsSensitiveRead(command)) {
    if (isStrict) {
      throw new Error(`Harness security guard blocked risky command (strict): ${redactedPreview(command)}`)
    }
    console.warn(`[harness:security-guard] risky command allowed with warning: ${redactedPreview(command)}`)
  }
}

function assertSafePath(targetPath: string): void {
  if (!targetPath || !isSensitivePath(targetPath)) return
  throw new Error(`Harness security guard blocked sensitive path access: ${redactedPreview(targetPath)}`)
}

export default (async () => ({
  "tool.execute.before": async (input: ToolInput, output: ToolOutput) => {
    if (input.tool === "bash") assertSafeCommand(commandFrom(input, output))
    assertSafePath(pathFrom(input, output))
  },
})) satisfies Plugin
