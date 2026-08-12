import type { GoalQuarantineAudit, GoalRecord, GoalState } from "./state-schema.ts"
import { sanitizeText } from "./sanitization.ts"

const MAX_QUARANTINE_AUDITS = 100

export function applyGoalRetention(state: GoalState, retentionDays: number): GoalState {
  if (retentionDays <= 0) return state
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const prunedAt = new Date().toISOString()
  const prunedAudits: GoalQuarantineAudit[] = []
  const sessions = Object.fromEntries(Object.entries(state.sessions).map(([sessionId, goals]) => {
    const retained = goals.filter((goal) => {
      if (isRetained(goal, cutoff)) return true
      if (goal.quarantined) prunedAudits.push(toQuarantineAudit(goal, sessionId, prunedAt))
      return false
    })
    return [sessionId, retained]
  }))
  const quarantineAudit = [...(state.quarantineAudit ?? []), ...prunedAudits]
    .filter((audit) => Date.parse(audit.prunedAt) >= cutoff)
    .slice(-MAX_QUARANTINE_AUDITS)
  return { ...state, sessions, ...(quarantineAudit.length > 0 ? { quarantineAudit } : {}) }
}

function isRetained(goal: GoalRecord, cutoff: number): boolean {
  // M1: A past-expiry untrusted/external goal is pruned regardless of status,
  // so quarantined content cannot linger indefinitely as an active/paused goal.
  if (isExpired(goal)) return false
  if (goal.quarantined) return updatedWithinRetention(goal, cutoff)
  if (["active", "paused", "blocked", "awaiting_plan_approval", "awaiting_confirmation", "revision_requested"].includes(goal.status)) return true
  return updatedWithinRetention(goal, cutoff)
}

function updatedWithinRetention(goal: GoalRecord, cutoff: number): boolean {
  const updated = Date.parse(goal.updatedAt)
  if (!Number.isFinite(updated)) return true
  return updated >= cutoff
}

// M1: expiresAt is now enforced (was previously dead metadata).
function isExpired(goal: GoalRecord): boolean {
  if (!goal.expiresAt) return false
  const expires = Date.parse(goal.expiresAt)
  if (!Number.isFinite(expires)) return false
  return expires < Date.now()
}

function toQuarantineAudit(goal: GoalRecord, sessionId: string, prunedAt: string): GoalQuarantineAudit {
  const quarantinedEvent = [...goal.history].reverse().find((event) => event.summary === "Goal quarantined.")
  return {
    sessionId: sanitizeText(sessionId, 100),
    goalId: sanitizeText(goal.id, 100),
    objective: sanitizeText(goal.objective, 200),
    status: goal.status,
    quarantinedAt: normalizedTimestamp(quarantinedEvent?.at ?? goal.updatedAt, prunedAt),
    prunedAt,
  }
}

function normalizedTimestamp(value: string, fallback: string): string {
  if (!Number.isFinite(Date.parse(value))) return fallback
  return new Date(value).toISOString()
}
