import { tool } from "@opencode-ai/plugin"
import type { GoalPluginOptions, GoalRecord, GoalRequirement, GoalStatus } from "./state-schema.ts"
import type { GoalStore } from "./goal-store.ts"
import { createEvidenceId } from "./session-context.ts"
import { buildGoal, summarizeGoal } from "./goal-record.ts"
import { nowIso, sanitizeText } from "./sanitization.ts"
import { userError } from "./errors.ts"
import { genericTransitionError } from "./prevc-transitions.ts"

export function createGoalTools(store: GoalStore, options: GoalPluginOptions) {
  return {
    get_goal: tool({
      description: "Get the current OpenCode session goal and recent goal history.",
      args: {},
      async execute(_args, context) {
        const current = await store.getCurrentGoal(context.sessionID)
        const history = await store.listSessionGoals(context.sessionID)
        return JSON.stringify({ current, history: history.slice(-10), statePath: store.statePath }, null, 2)
      },
    }),
    create_goal: tool({
      description: "Create a session-scoped goal from an explicit user objective.",
      args: {
        objective: tool.schema.string().min(1).describe("Untrusted user objective text."),
        requirements: tool.schema.array(tool.schema.string()).default([]),
        workflow: tool.schema.enum(["prevc"]).optional(),
      },
      async execute(args, context) {
        const existing = await store.getCurrentGoal(context.sessionID)
        if (existing) throw userError(`Clear or complete the current ${existing.status} goal first.`)
        const goal = buildGoal(context.sessionID, args.objective, args.requirements, args.workflow)
        await store.saveGoal(goal)
        return summarizeGoal(goal)
      },
    }),
    update_goal: tool({
      description: "Update requirement progress, evidence summaries, blocker, or goal status.",
      args: {
        status: tool.schema.enum(["active", "paused", "blocked", "awaiting_plan_approval"]).optional(),
        requirements: tool.schema.array(tool.schema.object({
          id: tool.schema.string(),
          achieved: tool.schema.boolean(),
          evidenceIds: tool.schema.array(tool.schema.string()).default([]),
        })).default([]),
        evidence: tool.schema.array(tool.schema.object({
          summary: tool.schema.string(),
          status: tool.schema.enum(["pass", "fail", "unknown"]),
          requirementIds: tool.schema.array(tool.schema.string()).default([]),
          command: tool.schema.string().optional(),
          workspace: tool.schema.string().optional(),
          exitCode: tool.schema.number().optional(),
          verifier: tool.schema.string().optional(),
        })).default([]),
        blocker: tool.schema.string().optional(),
        summary: tool.schema.string().default("Goal updated."),
      },
      async execute(args, context) {
        const updated = await store.updateCurrentGoal(context.sessionID, (goal) => {
          const next = applyGoalUpdate(goal, args)
          assertStatusUpdateAllowed(goal, next.status)
          if (next.status === "blocked" && !next.blocker) throw userError("Blocked goals require a concrete blocker.")
          return next
        })
        if (!updated) throw userError("No current goal exists for this session.")
        return summarizeGoal(updated)
      },
    }),
    clear_goal: tool({
      description: "Mark the current session goal as cleared while preserving history.",
      args: { reason: tool.schema.string().default("Cleared by user request.") },
      async execute(args, context) {
        const current = await store.getCurrentGoal(context.sessionID)
        if (current?.workflow === "prevc") {
          throw userError("PREVC goals may be ended only with the operator /goal abort <reason> command.")
        }
        const goal = await store.markCurrentGoal(context.sessionID, "cleared", args.reason)
        return summarizeGoal(goal)
      },
    }),
  }
}

function applyGoalUpdate(goal: GoalRecord, args: UpdateGoalArgs): GoalRecord {
  const createdEvidence = args.evidence.map((item, index) => createEvidence(goal, item, index))
  const evidence = [...goal.evidence, ...createdEvidence]
  const requirements = mergeRequirementUpdates(goal.requirements, args.requirements, createdEvidence)
  const updatedAt = nowIso()
  const status = args.status ?? goal.status
  return {
    ...goal,
    status,
    requirements,
    evidence,
    blocker: args.blocker ? sanitizeText(args.blocker, 500) : goal.blocker,
    updatedAt,
    history: [...goal.history, { at: updatedAt, status, summary: sanitizeText(args.summary, 500) }],
  }
}

function createEvidence(goal: GoalRecord, item: EvidenceUpdate, index: number): CreatedEvidence {
  const requirementIds = sanitizeEvidenceRequirementIds(goal.requirements, item.requirementIds)
  const provenance = sanitizeProvenance(item)
  return {
    id: createEvidenceId(goal.id, goal.evidence.length + index),
    summary: sanitizeText(item.summary, 500),
    status: item.status,
    requirementIds,
    ...provenance,
    createdAt: nowIso(),
  }
}

function sanitizeProvenance(item: EvidenceUpdate): EvidenceProvenance {
  if (item.exitCode !== undefined && !Number.isInteger(item.exitCode)) {
    throw userError("Evidence exitCode must be an integer when supplied.")
  }
  return {
    ...(item.command?.trim() ? { command: sanitizeText(item.command, 500) } : {}),
    ...(item.workspace?.trim() ? { workspace: sanitizeText(item.workspace, 500) } : {}),
    ...(item.exitCode !== undefined ? { exitCode: item.exitCode } : {}),
    ...(item.verifier?.trim() ? { verifier: sanitizeText(item.verifier, 200) } : {}),
  }
}

function mergeRequirementUpdates(
  requirements: GoalRequirement[],
  updates: RequirementUpdate[],
  createdEvidence: CreatedEvidence[],
): GoalRequirement[] {
  return requirements.map((requirement) => {
    const update = updates.find((item) => item.id === requirement.id)
    if (!update) return requirement
    return { ...requirement, achieved: update.achieved, evidenceIds: uniqueIds(requirement, update, linkedEvidenceIds(requirement, createdEvidence)) }
  })
}

function linkedEvidenceIds(requirement: GoalRequirement, createdEvidence: CreatedEvidence[]): string[] {
  return createdEvidence.filter((item) => item.requirementIds.includes(requirement.id)).map((item) => item.id)
}

function uniqueIds(requirement: GoalRequirement, update: RequirementUpdate, newEvidenceIds: string[]): string[] {
  return [...new Set([...requirement.evidenceIds, ...update.evidenceIds, ...newEvidenceIds])]
}

function sanitizeEvidenceRequirementIds(requirements: GoalRequirement[], ids: string[]): string[] {
  const knownIds = new Set(requirements.map((requirement) => requirement.id))
  const cleanIds = ids.map((id) => sanitizeText(id, 100)).filter((id) => knownIds.has(id))
  return [...new Set(cleanIds)]
}

function assertStatusUpdateAllowed(goal: GoalRecord, requestedStatus: GoalStatus): void {
  if (goal.workflow !== "prevc" && ["awaiting_plan_approval", "awaiting_confirmation"].includes(requestedStatus)) {
      throw userError("Only PREVC goals can enter an approval state.")
  }
  const error = genericTransitionError(goal, requestedStatus)
  if (error) throw userError(error)
}

type RequirementUpdate = { id: string; achieved: boolean; evidenceIds: string[] }
type EvidenceProvenance = { command?: string; workspace?: string; exitCode?: number; verifier?: string }
type EvidenceUpdate = {
  summary: string
  status: "pass" | "fail" | "unknown"
  requirementIds: string[]
  command?: string
  workspace?: string
  exitCode?: number
  verifier?: string
}
type UpdateGoalArgs = {
  status?: GoalStatus
  requirements: RequirementUpdate[]
  evidence: EvidenceUpdate[]
  blocker?: string
  summary: string
}

type CreatedEvidence = EvidenceProvenance & {
  id: string
  summary: string
  status: "pass" | "fail" | "unknown"
  requirementIds: string[]
  createdAt: string
}
