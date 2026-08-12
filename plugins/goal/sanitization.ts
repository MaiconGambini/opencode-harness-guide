const SECRET_PATTERNS: RegExp[] = [
  /\b(?:api[_-]?key|token|secret|password|passwd|pwd|authorization|bearer)\b\s*[:=]\s*[^\s,;]+/gi,
  /\b[A-Za-z0-9_=-]{24,}\.[A-Za-z0-9_=-]{16,}\.[A-Za-z0-9_=-]{16,}\b/g,
  /\b(?:sk|pk|ghp|github_pat|xox[baprs])-?[A-Za-z0-9_\-]{16,}\b/g,
]

const UNSAFE_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069\u200B\u200C\u200D]/gu

export const MAX_TEXT_LENGTH = 2_000

export function sanitizeText(input: string, maxLength = MAX_TEXT_LENGTH): string {
  const normalized = input.replace(/\r\n/g, "\n").replace(UNSAFE_CONTROL_PATTERN, "").trim()
  const redacted = SECRET_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED_SECRET]"),
    normalized,
  )

  if (redacted.length <= maxLength) return redacted
  return `${redacted.slice(0, maxLength)}… [truncated ${redacted.length - maxLength} chars]`
}

export function sanitizeStringList(values: string[], maxItems = 25): string[] {
  return values.slice(0, maxItems).map((value) => sanitizeText(value, 500))
}

export function nowIso(): string {
  return new Date().toISOString()
}
