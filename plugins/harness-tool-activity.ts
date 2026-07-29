import { appendFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "@opencode-ai/plugin"

// HARNESS_PROFILE tiers (this guard's behavior):
//   minimal  — recovery profile. Tool-activity logging is skipped; runtime deny and
//              approval rules remain active in their dedicated plugins.
//   standard — (default when unset) activity logged to tool-activity.jsonl with
//              secret redaction applied to requested/executed args.
//   strict   — same as standard (redacted activity logging stays on).
//
const profile = process.env.HARNESS_PROFILE ?? "standard"
const activityRetentionDays = 30
const maxActivityLogBytes = 5 * 1024 * 1024
let activityWriteQueue: Promise<void> = Promise.resolve()

function isLoggingEnabled(): boolean {
  if (profile === "minimal") return false
  return true
}

// Mirror the API's `tool.execute.after` signature exactly. Input carries the
// requested call (`tool`, `sessionID`, `callID`, `args`); output carries the
// executed RESULT (`title`, `output`, `metadata`) — there is no `output.args`.
interface ToolInput {
  tool: string
  sessionID: string
  callID: string
  args: Record<string, unknown>
}

interface ToolOutput {
  title: string
  output: string
  metadata: unknown
}

const secretKeyPattern = /(token|key|secret|password|authorization|cookie)/i

// Value-redaction patterns. Ordered so structured/quoted forms are handled
// before bare forms. All run BEFORE truncation (see redactString) so a 300-char
// slice can never expose an un-redacted tail.
//
// Quote-awareness: a secret value may be bare, single-quoted, or double-quoted.
// After matching a key + separator we capture an optional opening quote and
// consume everything up to the matching closing quote (or, when bare, up to the
// next whitespace / quote / comma / closing brace). This keeps quoted JSON
// values and bash header args (e.g. curl -H "X-Api-Key: abc") from leaking.
const secretValuePatterns = [
  // Standalone token shapes, regardless of surrounding key.
  /bearer\s+[a-z0-9._-]{10,}/gi,
  /sk-[a-z0-9]{20,}/gi,
  // key:"value" / key='value' / key=value / "key":"value" — quote-aware.
  // Group 1: key + separator (+ optional opening quote). We keep it, redact the value.
  /((?:"|')?(?:authorization|api[_-]?key|access[_-]?token|token|password|passwd|secret|cookie|client[_-]?secret)(?:"|')?\s*[:=]\s*)(?:"([^"]*)"|'([^']*)'|([^\s"',}&]+))/gi,
  // Header form inside quoted bash args: X-Api-Key: value / X-Auth-Token: value.
  /((?:x-[a-z-]*(?:api[_-]?key|auth|token|secret))\s*:\s*)([^"'\r\n]+)/gi,
  // Authorization header value: "Authorization: Bearer <tok>" / "Authorization: <tok>".
  /(authorization\s*:\s*)(bearer\s+)?([^"'\r\n]+)/gi,
  // URL query secrets: ?token=... / &api_key=... / ?access_token=...
  /([?&](?:token|api[_-]?key|access[_-]?token|secret|password|key|auth)=)([^\s"'&#]+)/gi,
]

// For patterns that capture a leading key/prefix group, keep the prefix and
// replace only the value with [REDACTED]. Bare-token patterns (bearer/sk-) have
// no capture group and are replaced wholesale.
function applyValuePattern(text: string, pattern: RegExp): string {
  if (pattern.source.startsWith("(")) {
    return text.replace(pattern, (_match, prefix: string) => `${prefix}[REDACTED]`)
  }
  return text.replace(pattern, "[REDACTED]")
}

function redactValue(key: string, value: unknown): unknown {
  if (secretKeyPattern.test(key)) return "[REDACTED]"
  if (typeof value === "string") return redactString(value)
  if (Array.isArray(value)) return value.map((item) => redactNested(item))
  if (isRecord(value)) return redactArgs(value)
  return value
}

function redactString(value: string): string {
  // Redact FIRST, then truncate — the 300-char slice must never expose an
  // un-redacted tail.
  const redacted = secretValuePatterns.reduce(applyValuePattern, value)
  return redacted.length > 300 ? `${redacted.slice(0, 300)}...[TRUNCATED]` : redacted
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function redactNested(value: unknown): unknown {
  if (typeof value === "string") return redactString(value)
  if (Array.isArray(value)) return value.map((item) => redactNested(item))
  if (isRecord(value)) return redactArgs(value)
  return value
}

function redactArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args) return {}
  return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, redactValue(key, value)]))
}

async function replaceActivityLog(activityLogPath: string, content: string): Promise<void> {
  const temporaryPath = `${activityLogPath}.${process.pid}.${Date.now()}.tmp`
  try {
    await writeFile(temporaryPath, content, "utf8")
    await rename(temporaryPath, activityLogPath)
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined)
    throw error
  }
}

function retainedJsonLines(content: string, now: number): string[] {
  const completeLines = content.endsWith("\n") ? content.slice(0, -1).split("\n") : content.split("\n").slice(0, -1)
  const oldestAllowed = now - activityRetentionDays * 24 * 60 * 60 * 1000
  const currentLines = completeLines.filter((line) => {
    try {
      const entry: unknown = JSON.parse(line)
      return typeof entry === "object" && entry !== null
        && typeof (entry as { at?: unknown }).at === "string"
        && Date.parse((entry as { at: string }).at) >= oldestAllowed
    } catch {
      return false
    }
  })
  const newestFirst = currentLines.reverse()
  let retainedBytes = 0
  const retained = newestFirst.filter((line) => {
    const lineBytes = Buffer.byteLength(line, "utf8") + 1
    if (retainedBytes + lineBytes > maxActivityLogBytes) return false
    retainedBytes += lineBytes
    return true
  })
  return retained.reverse()
}

async function pruneActivityLog(activityLogPath: string): Promise<void> {
  let content: string
  try {
    content = await readFile(activityLogPath, "utf8")
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw error
  }
  const retained = retainedJsonLines(content, Date.now())
  const replacement = retained.length > 0 ? `${retained.join("\n")}\n` : ""
  if (replacement !== content) await replaceActivityLog(activityLogPath, replacement)
}

async function appendJsonLine(worktree: string, entry: Record<string, unknown>): Promise<void> {
  const stateDir = path.join(worktree, ".opencode", "state")
  await mkdir(stateDir, { recursive: true })
  const activityLogPath = path.join(stateDir, "tool-activity.jsonl")
  await pruneActivityLog(activityLogPath)
  await appendFile(activityLogPath, `${JSON.stringify(entry)}\n`, "utf8")
  await pruneActivityLog(activityLogPath)
}

function queueJsonLine(worktree: string, entry: Record<string, unknown>): Promise<void> {
  const writeOperation = activityWriteQueue.then(() => appendJsonLine(worktree, entry))
  activityWriteQueue = writeOperation.catch(() => undefined)
  return writeOperation
}

export default (async ({ worktree }) => ({
  "tool.execute.after": async (input: ToolInput, output: ToolOutput) => {
    // Minimal recovery skips diagnostics only.
    if (!isLoggingEnabled()) return
    // `requested` is the tool's input args; `executed` is the tool's RESULT.
    // The API exposes the result via output.{title,output,metadata} — there is
    // no output.args — so we redact those fields instead.
    try {
      await queueJsonLine(worktree, {
        at: new Date().toISOString(),
        tool: input.tool ?? "unknown",
        requested: redactArgs(input.args),
        executed: {
          title: redactString(output.title ?? ""),
          output: redactString(output.output ?? ""),
          metadata: redactNested(output.metadata),
        },
      })
    } catch {
      // Observability failure cannot change the independent deny/approval outcome.
      console.warn("[harness:tool-activity] activity logging unavailable")
    }
  },
})) satisfies Plugin
