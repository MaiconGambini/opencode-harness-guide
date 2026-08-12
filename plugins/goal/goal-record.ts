import type { GoalRecord, GoalRequirement, GoalWorkflow } from "./state-schema.ts"
import { createGoalId } from "./session-context.ts"
import { nowIso, sanitizeStringList, sanitizeText } from "./sanitization.ts"
import { classifyGoalRisk } from "./risk-profile.ts"

// M1: Untrusted/external goals expire after this window so retention can prune
// them independently of the normal completed-goal cutoff. Runtime Date.now() is
// fine here (this is plugin runtime, not a deterministic workflow script).
const UNTRUSTED_GOAL_TTL_MS = 24 * 60 * 60 * 1000

export function buildGoal(
  sessionId: string,
  objective: string,
  requirements: string[],
  workflow?: GoalWorkflow,
): GoalRecord {
  const createdAt = nowIso()
  const cleanObjective = sanitizeText(objective)
  const cleanRequirements = sanitizeStringList(requirements.length > 0 ? requirements : [cleanObjective])
  const id = createGoalId(sessionId, cleanObjective, createdAt)
  const risk = classifyGoalRisk(cleanObjective)
  const expiresAt = computeExpiresAt(risk.riskLevel, risk.containsExternalContent)
  return {
    id,
    sessionId,
    objective: cleanObjective,
    status: workflow === "prevc" ? "awaiting_plan_approval" : "active",
    requirements: cleanRequirements.map(toRequirement),
    evidence: [],
    ...risk,
    ...(workflow ? { workflow } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    createdAt,
    updatedAt: createdAt,
    history: [{ at: createdAt, status: workflow === "prevc" ? "awaiting_plan_approval" : "active", summary: "Goal created." }],
  }
}

export function summarizeGoalForCompaction(goal: GoalRecord): string {
  const openRequirements = goal.requirements.filter((requirement) => !requirement.achieved)
  const visibleRequirements = openRequirements.slice(0, 3).map((requirement) => compactText(requirement.text, 160))
  const remainingCount = openRequirements.length - visibleRequirements.length
  const requirementSummary = visibleRequirements.length === 0
    ? "none"
    : `${visibleRequirements.join("; ")}${remainingCount > 0 ? `; +${remainingCount} more` : ""}`
  return [
    "Current /goal context:",
    `Objective: ${compactText(goal.objective, 240)}`,
    `Status: ${goal.status}`,
    `Open requirements: ${requirementSummary}`,
    ...(goal.blocker ? [`Blocker: ${compactText(goal.blocker, 160)}`] : []),
  ].join("\n")
}

function compactText(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 3)}...`
}

// M1: Only untrusted or external-content goals get a TTL; trusted local goals
// rely solely on the completed-goal retention cutoff.
function computeExpiresAt(riskLevel: GoalRecord["riskLevel"], containsExternalContent: boolean): string | undefined {
  if (riskLevel !== "untrusted" && !containsExternalContent) return undefined
  return new Date(Date.now() + UNTRUSTED_GOAL_TTL_MS).toISOString()
}

export function summarizeGoal(goal: GoalRecord): string {
  return JSON.stringify({
    id: goal.id,
    status: goal.status,
    objective: goal.objective,
    requirements: goal.requirements,
    evidence: goal.evidence,
    blocker: goal.blocker,
    riskLevel: goal.riskLevel,
    sourcePaths: goal.sourcePaths,
    expiresAt: goal.expiresAt,
    containsExternalContent: goal.containsExternalContent,
    quarantined: goal.quarantined,
    workflow: goal.workflow,
  }, null, 2)
}

function toRequirement(text: string, index: number): GoalRequirement {
  return { id: `req-${index + 1}`, text, achieved: false, evidenceIds: [] }
}
