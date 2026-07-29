import path from "node:path"
import { pathToFileURL } from "node:url"
import { cursorRoot, globalOpenCodeRoot, readTextIfExists } from "./harness-common.mjs"

const locations = [
  ".opencode/opencode.json",
  ".opencode/opencode.jsonc",
  ".mcp.json",
  path.join(globalOpenCodeRoot(), "opencode.jsonc"),
  path.join(cursorRoot(), "mcp.json"),
]

export function inspectLocation(location) {
  const text = readTextIfExists(location)
  if (!text) return { location, exists: false }
  const config = parseConfig(text)
  const servers = listServers(config)
  const container = config?.mcp ?? config?.mcpServers ?? {}
  const hasSecretKey = hasSecretBearingKey(container)
  // Finding-2: also scan string VALUES for secrets (bearer/authorization headers
  // in args arrays, tokens embedded in URLs). Locations reported by key path
  // only — the secret value itself is never emitted.
  const secretValuePaths = findSecretBearingValuePaths(container)
  const hasInlineSecret = hasSecretKey || secretValuePaths.length > 0
  return {
    location,
    exists: true,
    hasMcp: /"mcp"\s*:/.test(text) || /"mcpServers"\s*:/.test(text),
    hasInlineSecret,
    secretValuePaths: secretValuePaths.length > 0 ? secretValuePaths : undefined,
    servers,
    redaction: hasInlineSecret ? "secret-bearing keys/values present; values redacted" : undefined,
  }
}

export function parseConfig(text) {
  try {
    return JSON.parse(stripJsonComments(text))
  } catch {
    return null
  }
}

function stripJsonComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

export function listServers(config) {
  const container = config?.mcp ?? config?.mcpServers ?? {}
  return Object.entries(container).map(([name, value]) => ({
    name,
    enabled: value?.enabled ?? "unspecified",
    transport: value?.type ?? (value?.command ? "local" : value?.url ? "remote" : "unspecified"),
  }))
}

export function hasSecretBearingKey(value) {
  if (!value || typeof value !== "object") return false
  return Object.entries(value).some(([key, child]) => isSecretKey(key) || hasSecretBearingKey(child))
}

export function isSecretKey(key) {
  return /(authorization|api[_-]?key|x-api-key|x-goog-api-key|token|secret|password|cookie)/i.test(key)
}

// Finding-2: a string value looks secret-bearing if it carries a bearer/auth
// header token or embeds a credential query parameter in a URL.
export function isSecretValue(value) {
  if (typeof value !== "string") return false
  return (
    /bearer\s+\S/i.test(value) ||
    /authorization\s*:/i.test(value) ||
    /[?&](token|api[_-]?key)=/i.test(value) ||
    /\bapi-key\b/i.test(value)
  )
}

// Finding-2: walk the config tree recording the KEY PATH (never the value) of
// any string leaf that looks secret-bearing, including array elements.
export function findSecretBearingValuePaths(value, prefix = "", found = []) {
  if (isSecretValue(value)) {
    found.push(prefix || "(root)")
    return found
  }
  if (!value || typeof value !== "object") return found
  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    findSecretBearingValuePaths(child, nextPrefix, found)
  }
  return found
}

function runCli() {
  const inventory = locations.map(inspectLocation)
  const status = inventory.some((item) => item.hasInlineSecret) ? "WARN" : "PASS"
  console.log(JSON.stringify({ status, inventory }, null, 2))
}

// Auto-run only when invoked directly; stays silent when imported by tests.
if (import.meta.url === pathToFileURL(process.argv[1]).href) runCli()
