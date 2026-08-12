import type { GoalRecord, GoalStatus } from "./state-schema.ts"

export type PrevcOperatorAction = "confirm" | "revise" | "abort" | "submit_revision"

const GENERIC_PREVC_TRANSITIONS: Record<GoalStatus, readonly GoalStatus[]> = {
  active: ["active", "paused", "blocked"],
  paused: ["paused", "active", "blocked"],
  blocked: ["blocked", "active", "paused"],
  awaiting_plan_approval: ["awaiting_plan_approval"],
  awaiting_confirmation: ["awaiting_confirmation"],
  revision_requested: ["revision_requested"],
  aborted: ["aborted"],
  complete: ["complete"],
  cleared: ["cleared"],
}

export function genericTransitionError(goal: GoalRecord, target: GoalStatus): string | undefined {
  if (target === "complete") return "Automatic goal completion is disabled until trusted runtime receipts are available."
  if (target === "awaiting_confirmation") return "Persisting awaiting_confirmation requires a trusted Judge receipt, which is not available."
  if (goal.workflow !== "prevc" && ["awaiting_plan_approval", "revision_requested", "aborted"].includes(target)) {
    return "Only PREVC goals can enter protected lifecycle states."
  }
  if (goal.workflow !== "prevc") return undefined
  if (GENERIC_PREVC_TRANSITIONS[goal.status].includes(target)) return undefined
  return `Generic updates cannot transition PREVC goals from ${goal.status} to ${target}.`
}

export function resolveOperatorPrevcTransition(
  status: GoalStatus,
  action: PrevcOperatorAction,
): GoalStatus | undefined {
  if (status === "awaiting_plan_approval") {
    if (action === "confirm") return "active"
    if (action === "revise") return "revision_requested"
    if (action === "abort") return "aborted"
    return undefined
  }
  if (status === "revision_requested" && action === "abort") return "aborted"
  if (status === "revision_requested" && action === "submit_revision") return "awaiting_plan_approval"
  return undefined
}
