import { reportJobTypes, type AutomationPluginOptions, type AutomationSchedule, type ExecutionBudget, type ReportJobType } from "./definitions.ts"

const minimumIntervalMs = 60_000
const minimumTimeoutMs = 1_000
const maximumTimeoutMs = 60_000
const maximumReportBytes = 64 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isReportJobType(value: unknown): value is ReportJobType {
  return typeof value === "string" && reportJobTypes.includes(value as ReportJobType)
}

function isBudget(value: unknown): value is ExecutionBudget {
  if (!isRecord(value)) return false
  return typeof value.timeoutMs === "number"
    && Number.isInteger(value.timeoutMs)
    && value.timeoutMs >= minimumTimeoutMs
    && value.timeoutMs <= maximumTimeoutMs
    && value.retryBudget === 0
    && typeof value.maxReportBytes === "number"
    && Number.isInteger(value.maxReportBytes)
    && value.maxReportBytes > 0
    && value.maxReportBytes <= maximumReportBytes
}

function isSchedule(value: unknown): value is AutomationSchedule {
  if (!isRecord(value) || !isBudget(value.budget)) return false
  return typeof value.id === "string"
    && /^[a-z0-9][a-z0-9-]{0,62}$/.test(value.id)
    && typeof value.enabled === "boolean"
    && isReportJobType(value.jobType)
    && typeof value.intervalMs === "number"
    && Number.isInteger(value.intervalMs)
    && value.intervalMs >= minimumIntervalMs
    && typeof value.cooldownMs === "number"
    && Number.isInteger(value.cooldownMs)
    && value.cooldownMs >= 0
    && value.workspace === "global-opencode"
    && value.verification === "handler-completed"
    && value.outputDestination === "global-automation-state"
    && Array.isArray(value.permittedSideEffects)
    && value.permittedSideEffects.length === 1
    && value.permittedSideEffects[0] === "execution-record"
}

export function registeredSchedules(options: unknown): readonly AutomationSchedule[] {
  if (!isRecord(options) || !Array.isArray(options.schedules)) return []

  const schedules = options.schedules.filter(isSchedule)
  const scheduleIds = new Set<string>()
  for (const schedule of schedules) {
    if (scheduleIds.has(schedule.id)) throw new Error(`Automation schedule id must be unique: ${schedule.id}`)
    scheduleIds.add(schedule.id)
  }
  return schedules
}

export function enabledSchedules(options: AutomationPluginOptions | unknown): readonly AutomationSchedule[] {
  return registeredSchedules(options).filter((schedule) => schedule.enabled)
}
