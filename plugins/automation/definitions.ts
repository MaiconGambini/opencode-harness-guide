export const reportJobTypes = ["security-report", "context-report", "status-report", "retention-report"] as const

export type ReportJobType = typeof reportJobTypes[number]

export type ReportVerification = "handler-completed"
export type ReportOutputDestination = "global-automation-state"
export type PermittedSideEffect = "execution-record"

export interface ExecutionBudget {
  readonly timeoutMs: number
  readonly retryBudget: 0
  readonly maxReportBytes: number
}

export interface AutomationSchedule {
  readonly id: string
  readonly enabled: boolean
  readonly jobType: ReportJobType
  readonly intervalMs: number
  readonly cooldownMs: number
  readonly workspace: "global-opencode"
  readonly verification: ReportVerification
  readonly outputDestination: ReportOutputDestination
  readonly permittedSideEffects: readonly [PermittedSideEffect]
  readonly budget: ExecutionBudget
}

export interface AutomationPluginOptions {
  readonly schedules?: readonly AutomationSchedule[]
}

export type ExecutionExitState = "running" | "reported" | "failed" | "timed_out"

export interface ReportEvidence {
  readonly kind: "report"
  readonly metrics: Readonly<Record<string, number | string | boolean>>
}

export interface ExecutionRecord {
  readonly version: 1
  readonly runKey: string
  readonly jobId: string
  readonly jobType: ReportJobType
  readonly trigger: "schedule"
  readonly action: "report"
  readonly workspace: "global-opencode"
  readonly verification: ReportVerification
  readonly outputDestination: ReportOutputDestination
  readonly permittedSideEffects: readonly [PermittedSideEffect]
  readonly scheduleWindowStartedAt: string
  readonly startedAt: string
  readonly cooldownMs: number
  readonly completedAt?: string
  readonly nextEligibleAt?: string
  readonly budget: ExecutionBudget
  readonly exitState: ExecutionExitState
  readonly evidence?: ReportEvidence
  readonly reviewRequired: boolean
  readonly error?: string
}

export interface AutomationReviewRecord {
  readonly version: 1
  readonly runKey: string
  readonly jobId: string
  readonly createdAt: string
  readonly reason: string
}

export interface ReportHandlerContext {
  readonly globalRoot: string
  readonly maxReportBytes: number
}

export interface ReportHandler {
  readonly jobType: ReportJobType
  run(context: ReportHandlerContext): Promise<ReportEvidence>
}
