import { randomUUID } from "node:crypto"
import { mkdir, readFile, readdir, rename, rm, rmdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import type { AutomationReviewRecord, ExecutionRecord } from "./definitions.ts"

interface JobLock {
  readonly owner: string
  readonly acquiredAt: number
}

export interface AcquiredJobLock {
  release(): Promise<boolean>
}

export type JobEligibility = "eligible" | "cooling_down" | "blocked"

type RecordLookup =
  | { readonly kind: "absent" }
  | { readonly kind: "record", readonly record: ExecutionRecord }
  | { readonly kind: "malformed" }

function stateDirectory(globalRoot: string): string {
  return path.join(globalRoot, "state", "automation")
}

function recordsDirectory(globalRoot: string): string {
  return path.join(stateDirectory(globalRoot), "records")
}

function reviewDirectory(globalRoot: string): string {
  return path.join(stateDirectory(globalRoot), "review")
}

function recordPath(globalRoot: string, runKey: string): string {
  return path.join(recordsDirectory(globalRoot), `${Buffer.from(runKey).toString("base64url")}.json`)
}

function reviewPath(globalRoot: string, runKey: string): string {
  return path.join(reviewDirectory(globalRoot), `${Buffer.from(runKey).toString("base64url")}.json`)
}

function lockDirectory(globalRoot: string, jobId: string): string {
  return path.join(stateDirectory(globalRoot), `job-${jobId}.lock`)
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value)
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key))
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

function isBudget(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["timeoutMs", "retryBudget", "maxReportBytes"])) return false
  return typeof value.timeoutMs === "number"
    && Number.isInteger(value.timeoutMs)
    && value.timeoutMs >= 1_000
    && value.timeoutMs <= 60_000
    && value.retryBudget === 0
    && typeof value.maxReportBytes === "number"
    && Number.isInteger(value.maxReportBytes)
    && value.maxReportBytes > 0
    && value.maxReportBytes <= 64 * 1024
}

function isEvidence(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["kind", "metrics"]) || value.kind !== "report" || !isRecord(value.metrics)) return false
  const metrics = Object.entries(value.metrics)
  return metrics.length > 0 && metrics.every(([key, metric]) => isNonEmptyString(key) && (typeof metric === "string" || typeof metric === "boolean" || (typeof metric === "number" && Number.isFinite(metric))))
}

function hasCommonRecordFields(record: Partial<ExecutionRecord>): boolean {
  return record.version === 1
    && isNonEmptyString(record.runKey)
    && isNonEmptyString(record.jobId)
    && /^[a-z0-9][a-z0-9-]{0,62}$/.test(record.jobId)
    && record.jobType !== undefined
    && ["security-report", "context-report", "status-report", "retention-report"].includes(record.jobType)
    && record.trigger === "schedule"
    && record.action === "report"
    && record.workspace === "global-opencode"
    && record.verification === "handler-completed"
    && record.outputDestination === "global-automation-state"
    && Array.isArray(record.permittedSideEffects)
    && record.permittedSideEffects.length === 1
    && record.permittedSideEffects[0] === "execution-record"
    && isTimestamp(record.scheduleWindowStartedAt)
    && isTimestamp(record.startedAt)
    && Date.parse(record.startedAt) >= Date.parse(record.scheduleWindowStartedAt)
    && record.runKey === `${record.jobId}:${record.scheduleWindowStartedAt}`
    && typeof record.cooldownMs === "number"
    && Number.isInteger(record.cooldownMs)
    && record.cooldownMs >= 0
    && isBudget(record.budget)
}

function isExecutionRecord(value: unknown): value is ExecutionRecord {
  if (!isRecord(value)) return false
  const record = value as Partial<ExecutionRecord>
  const common = hasCommonRecordFields(record)
  if (!common) return false

  if (record.exitState === "running") {
    return record.reviewRequired === false
      && hasExactKeys(value, ["version", "runKey", "jobId", "jobType", "trigger", "action", "workspace", "verification", "outputDestination", "permittedSideEffects", "scheduleWindowStartedAt", "startedAt", "cooldownMs", "budget", "exitState", "reviewRequired"])
  }

  const finalized = isTimestamp(record.completedAt)
    && isTimestamp(record.nextEligibleAt)
    && isTimestamp(record.startedAt)
    && Date.parse(record.completedAt) >= Date.parse(record.startedAt)
    && typeof record.cooldownMs === "number"
    && Date.parse(record.nextEligibleAt) === Date.parse(record.completedAt) + record.cooldownMs
  if (!finalized) return false

  if (record.exitState === "reported") {
    return record.reviewRequired === false
      && isEvidence(record.evidence)
      && record.error === undefined
      && hasExactKeys(value, ["version", "runKey", "jobId", "jobType", "trigger", "action", "workspace", "verification", "outputDestination", "permittedSideEffects", "scheduleWindowStartedAt", "startedAt", "cooldownMs", "completedAt", "nextEligibleAt", "budget", "exitState", "evidence", "reviewRequired"])
  }

  return (record.exitState === "failed" || record.exitState === "timed_out")
    && record.reviewRequired === true
    && isNonEmptyString(record.error)
    && record.evidence === undefined
    && hasExactKeys(value, ["version", "runKey", "jobId", "jobType", "trigger", "action", "workspace", "verification", "outputDestination", "permittedSideEffects", "scheduleWindowStartedAt", "startedAt", "cooldownMs", "completedAt", "nextEligibleAt", "budget", "exitState", "reviewRequired", "error"])
}

function isFinalized(record: ExecutionRecord): boolean {
  return record.exitState !== "running"
}

async function readRecord(targetPath: string): Promise<RecordLookup> {
  try {
    const parsed: unknown = JSON.parse(await readFile(targetPath, "utf8"))
    return isExecutionRecord(parsed) ? { kind: "record", record: parsed } : { kind: "malformed" }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "absent" }
    return { kind: "malformed" }
  }
}

export async function acquireJobLock(globalRoot: string, jobId: string, now: number): Promise<AcquiredJobLock | undefined> {
  try {
    await mkdir(stateDirectory(globalRoot), { recursive: true })
    const targetDirectory = lockDirectory(globalRoot, jobId)
    const owner = randomUUID()
    try {
      await mkdir(targetDirectory)
    } catch {
      return undefined
    }
    const ownerMarker = path.join(targetDirectory, `${owner}.active`)
    try {
      await writeFile(ownerMarker, JSON.stringify({ owner, acquiredAt: now } satisfies JobLock), { encoding: "utf8", flag: "wx" })
    } catch {
      return undefined
    }

    return {
      async release(): Promise<boolean> {
        try {
          const tombstonePath = path.join(targetDirectory, `${owner}.released`)
          await rename(ownerMarker, tombstonePath)
          const parsed: unknown = JSON.parse(await readFile(tombstonePath, "utf8"))
          if (!isRecord(parsed) || parsed.owner !== owner || parsed.acquiredAt !== now) return false
          await rm(tombstonePath, { force: true })
          await rmdir(targetDirectory)
          return true
        } catch {
          return false
        }
      },
    }
  } catch {
    return undefined
  }
}

export async function readExecutionRecord(globalRoot: string, runKey: string): Promise<RecordLookup> {
  return readRecord(recordPath(globalRoot, runKey))
}

async function writeAtomic(targetPath: string, content: string): Promise<void> {
  const temporaryPath = `${targetPath}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, content, "utf8")
    await rename(temporaryPath, targetPath)
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export async function writeExecutionRecord(globalRoot: string, record: ExecutionRecord): Promise<void> {
  if (!isExecutionRecord(record)) throw new Error("Automation execution record violates the supported state invariant")
  await mkdir(recordsDirectory(globalRoot), { recursive: true })
  await writeAtomic(recordPath(globalRoot, record.runKey), JSON.stringify(record))
}

export async function queueForReview(globalRoot: string, review: AutomationReviewRecord): Promise<boolean> {
  try {
    await mkdir(reviewDirectory(globalRoot), { recursive: true })
    await writeAtomic(reviewPath(globalRoot, review.runKey), JSON.stringify(review))
    return true
  } catch {
    return false
  }
}

async function hasReviewRecord(globalRoot: string, jobId: string): Promise<boolean> {
  try {
    const entries = await readdir(reviewDirectory(globalRoot))
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue
      try {
        const review = JSON.parse(await readFile(path.join(reviewDirectory(globalRoot), entry), "utf8")) as Partial<AutomationReviewRecord>
        if (review.jobId === jobId) return true
      } catch {
        return true
      }
    }
    return false
  } catch (error: unknown) {
    return (error as NodeJS.ErrnoException).code !== "ENOENT"
  }
}

export async function jobEligibility(globalRoot: string, jobId: string, runKey: string, now: number, cooldownMs: number): Promise<JobEligibility> {
  const currentRecord = await readExecutionRecord(globalRoot, runKey)
  if (currentRecord.kind === "malformed") return "blocked"
  if (currentRecord.kind === "record") {
    if (currentRecord.record.cooldownMs !== cooldownMs) return "blocked"
    return currentRecord.record.exitState === "running" || currentRecord.record.reviewRequired || !isFinalized(currentRecord.record)
      ? "blocked"
      : "cooling_down"
  }
  if (await hasReviewRecord(globalRoot, jobId)) return "blocked"

  let entries: string[]
  try {
    entries = await readdir(recordsDirectory(globalRoot))
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "eligible"
    return "blocked"
  }

  const records = await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map((entry) => readRecord(path.join(recordsDirectory(globalRoot), entry))))
  if (records.some((record) => record.kind === "malformed")) return "blocked"
  const jobRecords = records
    .filter((record): record is Extract<RecordLookup, { kind: "record" }> => record.kind === "record" && record.record.jobId === jobId)
    .map((record) => record.record)
  if (jobRecords.some((record) => record.cooldownMs !== cooldownMs || record.exitState === "running" || record.reviewRequired || !isFinalized(record))) return "blocked"

  const lastRecord = jobRecords.sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]
  if (!lastRecord) return "eligible"
  return Date.parse(lastRecord.nextEligibleAt ?? "") > now ? "cooling_down" : "eligible"
}

export async function automationRecordSummary(globalRoot: string, retentionMs: number): Promise<{ recordCount: number, totalBytes: number, expiredRecordCount: number }> {
  let entries: string[]
  try {
    entries = await readdir(recordsDirectory(globalRoot))
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { recordCount: 0, totalBytes: 0, expiredRecordCount: 0 }
    throw error
  }

  const oldestAllowed = Date.now() - retentionMs
  const summaries = await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map(async (entry) => {
    const targetPath = path.join(recordsDirectory(globalRoot), entry)
    try {
      const [metadata, lookup] = await Promise.all([stat(targetPath), readRecord(targetPath)])
      return { bytes: metadata.size, expired: lookup.kind !== "record" || !isTimestamp(lookup.record.completedAt) || Date.parse(lookup.record.completedAt) < oldestAllowed }
    } catch {
      return { bytes: 0, expired: true }
    }
  }))
  return {
    recordCount: summaries.length,
    totalBytes: summaries.reduce((total, summary) => total + summary.bytes, 0),
    expiredRecordCount: summaries.filter((summary) => summary.expired).length,
  }
}
