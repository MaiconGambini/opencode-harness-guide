import { createHash } from "node:crypto"

export function requireSessionId(sessionId: string | undefined): string {
  if (sessionId && sessionId.trim().length > 0) return sessionId
  throw new Error("Goal commands require an OpenCode sessionID, but none was provided.")
}

export function createGoalId(sessionId: string, objective: string, createdAt: string): string {
  return createHash("sha256")
    .update(`${sessionId}\n${objective}\n${createdAt}`)
    .digest("hex")
    .slice(0, 16)
}

export function createEvidenceId(goalId: string, index: number): string {
  return `ev-${goalId}-${index + 1}`
}
