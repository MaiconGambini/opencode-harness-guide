import type { GoalEvidence, GoalRecord, GoalRequirement } from "./state-schema.ts"

export function requirementHasPassingEvidence(
  requirement: GoalRequirement,
  evidence: GoalEvidence[],
): boolean {
  void requirement
  void evidence
  return false
}

export function canCompleteGoal(goal: GoalRecord): { ok: true } | { ok: false; reason: string } {
  void goal
  return { ok: false, reason: "Automatic goal completion is disabled until trusted runtime receipts are available." }
}
