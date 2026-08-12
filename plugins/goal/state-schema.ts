export type GoalStatus =
  | "active"
  | "paused"
  | "complete"
  | "cleared"
  | "blocked"
  | "awaiting_plan_approval"
  | "awaiting_confirmation"
  | "revision_requested"
  | "aborted"

export type EvidenceStatus = "pass" | "fail" | "unknown"

export type GoalRiskLevel = "low" | "medium" | "high" | "untrusted"

export type GoalWorkflow = "prevc"

export type GoalEvidence = {
  id: string
  summary: string
  status: EvidenceStatus
  requirementIds?: string[]
  command?: string
  workspace?: string
  exitCode?: number
  verifier?: string
  createdAt: string
}

export type GoalRequirement = {
  id: string
  text: string
  achieved: boolean
  evidenceIds: string[]
}

export type GoalHistoryEvent = {
  at: string
  status: GoalStatus
  summary: string
}

export type GoalQuarantineAudit = {
  sessionId: string
  goalId: string
  objective: string
  status: GoalStatus
  quarantinedAt: string
  prunedAt: string
}

export type GoalRecord = {
  id: string
  sessionId: string
  objective: string
  status: GoalStatus
  requirements: GoalRequirement[]
  evidence: GoalEvidence[]
  blocker?: string
  riskLevel?: GoalRiskLevel
  sourcePaths?: string[]
  expiresAt?: string
  containsExternalContent?: boolean
  quarantined?: boolean
  workflow?: GoalWorkflow
  createdAt: string
  updatedAt: string
  history: GoalHistoryEvent[]
}

export type GoalState = {
  version: 1
  sessions: Record<string, GoalRecord[]>
  quarantineAudit?: GoalQuarantineAudit[]
}

export type GoalPluginOptions = {
  retention_days: number
  register_command: boolean
  command_name: string
}

export const DEFAULT_OPTIONS: GoalPluginOptions = {
  retention_days: 30,
  register_command: true,
  command_name: "goal",
}

export function emptyGoalState(): GoalState {
  return { version: 1, sessions: {}, quarantineAudit: [] }
}
