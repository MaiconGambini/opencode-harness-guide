import type { AutomationReviewRecord, AutomationSchedule, ExecutionRecord, ReportEvidence } from "./definitions.ts"
import { acquireJobLock, jobEligibility, queueForReview, writeExecutionRecord } from "./execution-store.ts"
import { reportHandler } from "./report-handlers.ts"

const blockedJobs = new Set<string>()

function scheduleWindowStart(now: number, intervalMs: number): number {
  return Math.floor(now / intervalMs) * intervalMs
}

function runKey(schedule: AutomationSchedule, windowStartedAt: number): string {
  return `${schedule.id}:${new Date(windowStartedAt).toISOString()}`
}

function jobKey(globalRoot: string, jobId: string): string {
  return `${globalRoot}\u0000${jobId}`
}

async function boundedReport(globalRoot: string, schedule: AutomationSchedule): Promise<ReportEvidence> {
  const evidence = await reportHandler(schedule.jobType).run({ globalRoot, maxReportBytes: schedule.budget.maxReportBytes })
  if (Buffer.byteLength(JSON.stringify(evidence), "utf8") > schedule.budget.maxReportBytes) {
    throw new Error(`Report evidence exceeded ${schedule.budget.maxReportBytes} bytes`)
  }
  return evidence
}

async function timeoutReport<T>(timeoutMs: number, operation: Promise<T>): Promise<{ timedOut: boolean, value?: T, error?: string }> {
  const outcome = operation.then(
    (value) => ({ timedOut: false, value }),
    () => ({ timedOut: false, error: "Report handler failed" }),
  )
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<{ timedOut: true }>((resolve) => {
    timeoutHandle = setTimeout(() => resolve({ timedOut: true }), timeoutMs)
  })
  try {
    return await Promise.race([outcome, timeout])
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
  }
}

async function blockForReview(globalRoot: string, schedule: AutomationSchedule, currentRunKey: string, reason: string): Promise<void> {
  blockedJobs.add(jobKey(globalRoot, schedule.id))
  const review: AutomationReviewRecord = {
    version: 1,
    runKey: currentRunKey,
    jobId: schedule.id,
    createdAt: new Date().toISOString(),
    reason,
  }
  await queueForReview(globalRoot, review)
}

async function finalizeRecord(globalRoot: string, schedule: AutomationSchedule, record: ExecutionRecord): Promise<boolean> {
  try {
    await writeExecutionRecord(globalRoot, record)
    if (record.reviewRequired) await blockForReview(globalRoot, schedule, record.runKey, "Finalized report requires operator review")
    return true
  } catch {
    await blockForReview(globalRoot, schedule, record.runKey, "Final execution record could not be persisted")
    return false
  }
}

export async function executeScheduledRun(globalRoot: string, schedule: AutomationSchedule, now = Date.now()): Promise<void> {
  if (!schedule.enabled) return
  let currentRunKey = `${schedule.id}:unavailable`
  try {
    const windowStartedAt = scheduleWindowStart(now, schedule.intervalMs)
    currentRunKey = runKey(schedule, windowStartedAt)
    if (blockedJobs.has(jobKey(globalRoot, schedule.id))) return
    const eligibility = await jobEligibility(globalRoot, schedule.id, currentRunKey, now, schedule.cooldownMs)
    if (eligibility === "cooling_down") return
    if (eligibility === "blocked") {
      await blockForReview(globalRoot, schedule, currentRunKey, "Automation state is incomplete or malformed")
      return
    }

    const lock = await acquireJobLock(globalRoot, schedule.id, now)
    if (!lock) {
      await blockForReview(globalRoot, schedule, currentRunKey, "Automation job lock is unavailable or malformed")
      return
    }

    try {
      const startedAt = new Date(now).toISOString()
      const runningRecord: ExecutionRecord = {
        version: 1,
        runKey: currentRunKey,
        jobId: schedule.id,
        jobType: schedule.jobType,
        trigger: "schedule",
        action: "report",
        workspace: schedule.workspace,
        verification: schedule.verification,
        outputDestination: schedule.outputDestination,
        permittedSideEffects: schedule.permittedSideEffects,
        scheduleWindowStartedAt: new Date(windowStartedAt).toISOString(),
        startedAt,
        cooldownMs: schedule.cooldownMs,
        budget: schedule.budget,
        exitState: "running",
        reviewRequired: false,
      }
      try {
        await writeExecutionRecord(globalRoot, runningRecord)
      } catch {
        await blockForReview(globalRoot, schedule, currentRunKey, "Preliminary running record could not be persisted")
        return
      }

      const outcome = await timeoutReport(schedule.budget.timeoutMs, boundedReport(globalRoot, schedule))
      const completedAt = Date.now()
      const finalizedFields = {
        ...runningRecord,
        completedAt: new Date(completedAt).toISOString(),
        nextEligibleAt: new Date(completedAt + schedule.cooldownMs).toISOString(),
      }
      const finalRecord: ExecutionRecord = !outcome.timedOut && outcome.error === undefined && outcome.value !== undefined
        ? {
            ...finalizedFields,
            exitState: "reported",
            evidence: outcome.value,
            reviewRequired: false,
          }
        : {
            ...finalizedFields,
            exitState: outcome.timedOut ? "timed_out" : "failed",
            reviewRequired: true,
            error: outcome.timedOut ? `Report handler exceeded ${schedule.budget.timeoutMs} ms` : outcome.error ?? "Report handler returned no evidence",
          }
      await finalizeRecord(globalRoot, schedule, finalRecord)
    } finally {
      if (!await lock.release()) await blockForReview(globalRoot, schedule, currentRunKey, "Automation job lock could not be released")
    }
  } catch {
    await blockForReview(globalRoot, schedule, currentRunKey, "Unhandled scheduler failure")
  }
}

export function startScheduler(globalRoot: string, schedules: readonly AutomationSchedule[]): () => void {
  if (schedules.length === 0) return () => undefined
  const tick = (): void => {
    for (const schedule of schedules) {
      void executeScheduledRun(globalRoot, schedule).catch(() => undefined)
    }
  }
  tick()
  const interval = setInterval(tick, 60_000)
  interval.unref()
  return () => clearInterval(interval)
}
