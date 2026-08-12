import { dirname, join } from "node:path"
import { homedir } from "node:os"
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import type { GoalPluginOptions, GoalRecord, GoalState, GoalStatus } from "./state-schema.ts"
import { emptyGoalState } from "./state-schema.ts"
import { nowIso, sanitizeText } from "./sanitization.ts"
import { stateError } from "./errors.ts"
import { applyGoalRetention } from "./retention-policy.ts"
import { genericTransitionError, resolveOperatorPrevcTransition, type PrevcOperatorAction } from "./prevc-transitions.ts"

const LOCK_RETRY_COUNT = 8
const LOCK_RETRY_DELAY_MS = 25
const STALE_LOCK_MS = 30_000

export type GoalStore = {
  statePath: string
  readState(): Promise<GoalState>
  listSessionGoals(sessionId: string): Promise<GoalRecord[]>
  getCurrentGoal(sessionId: string): Promise<GoalRecord | undefined>
  saveGoal(goal: GoalRecord): Promise<GoalRecord>
  markCurrentGoal(sessionId: string, status: GoalStatus, summary: string): Promise<GoalRecord>
  updateCurrentGoal(sessionId: string, update: (goal: GoalRecord) => GoalRecord | undefined): Promise<GoalRecord | undefined>
  transitionPrevcOperator(sessionId: string, action: PrevcOperatorAction, summary: string): Promise<GoalRecord>
  pruneRetention(): Promise<void>
}

export function createGoalStore(statePath = defaultStatePath(), options?: Pick<GoalPluginOptions, "retention_days">): GoalStore {
  const retentionDays = options?.retention_days ?? 30

  async function readState(): Promise<GoalState> {
    return readStateUnsafe()
  }

  async function readStateUnsafe(): Promise<GoalState> {
    try {
      const raw = await readFile(statePath, "utf8")
      return parseGoalState(raw)
    } catch (error) {
      if (isMissingFile(error)) return emptyGoalState()
      throw stateError(`Unable to read goal state at ${statePath}: ${String(error)}`)
    }
  }

  async function writeStateUnsafe(state: GoalState): Promise<void> {
    const stateDir = dirname(statePath)
    const tempPath = join(stateDir, `.state-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`)
    await mkdir(stateDir, { recursive: true })
    await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
    try {
      await rename(tempPath, statePath)
    } catch (error) {
      await rm(tempPath, { force: true })
      throw stateError(`Unable to replace goal state at ${statePath}: ${String(error)}`)
    }
  }

  return {
    statePath,
    readState,
    async listSessionGoals(sessionId) {
      const state = await readState()
      return state.sessions[sessionId] ?? []
    },
    async getCurrentGoal(sessionId) {
      const goals = await this.listSessionGoals(sessionId)
      return [...goals].reverse().find((goal) => isCurrentStatus(goal.status))
    },
    async saveGoal(goal) {
      await withStateLock(async () => {
        const state = await readStateUnsafe()
        const goals = state.sessions[goal.sessionId] ?? []
        assertNewGoal(goal)
        if (goals.some((item) => item.id === goal.id)) {
          throw stateError(`Goal ${goal.id} already exists in session ${goal.sessionId}; use a scoped mutation instead.`)
        }
        if (goals.some((item) => isCurrentStatus(item.status))) {
          throw stateError(`Session ${goal.sessionId} already has a current goal.`)
        }
        await writeStateUnsafe(applyGoalRetention({ ...state, sessions: { ...state.sessions, [goal.sessionId]: [...goals, goal] } }, retentionDays))
      })
      return goal
    },
    async markCurrentGoal(sessionId, status, summary) {
      const goal = await this.updateCurrentGoal(sessionId, (current) => {
        const error = genericTransitionError(current, status)
        if (error) throw stateError(error)
        return withStatus(current, status, summary)
      })
      if (!goal) throw stateError(`No current goal exists for session ${sessionId}.`)
      return goal
    },
    async updateCurrentGoal(sessionId, update) {
      return withStateLock(async () => {
        const state = await readStateUnsafe()
        const goals = state.sessions[sessionId] ?? []
        const current = [...goals].reverse().find((goal) => isCurrentStatus(goal.status))
        if (!current) return undefined
        const updated = update(current)
        if (!updated) return undefined
        assertGenericMutation(sessionId, current, updated)
        await writeStateUnsafe(applyGoalRetention({ ...state, sessions: { ...state.sessions, [sessionId]: upsertGoal(goals, updated) } }, retentionDays))
        return updated
      })
    },
    async transitionPrevcOperator(sessionId, action, summary) {
      const goal = await withStateLock(async () => {
        const state = await readStateUnsafe()
        const goals = state.sessions[sessionId] ?? []
        const current = [...goals].reverse().find((item) => isCurrentStatus(item.status))
        if (!current) throw stateError(`No current goal exists for session ${sessionId}.`)
        if (current.workflow !== "prevc") throw stateError("Operator PREVC transitions require a PREVC goal.")
        const status = resolveOperatorPrevcTransition(current.status, action)
        if (!status) throw stateError(`Cannot ${action} PREVC goal while status is ${current.status}.`)
        const updated = withStatus(current, status, summary)
        await writeStateUnsafe(applyGoalRetention({ ...state, sessions: { ...state.sessions, [sessionId]: upsertGoal(goals, updated) } }, retentionDays))
        return updated
      })
      return goal
    },
    async pruneRetention() {
      await withStateLock(async () => {
        const state = await readStateUnsafe()
        await writeStateUnsafe(applyGoalRetention(state, retentionDays))
      })
    },
  }

  async function withStateLock<T>(operation: () => Promise<T>): Promise<T> {
    const release = await acquireStateLock(`${statePath}.lock`)
    try {
      return await operation()
    } finally {
      await release()
    }
  }
}

export function defaultStatePath(): string {
  return join(homedir(), ".config", "opencode", "goal", "state.json")
}

function parseGoalState(raw: string): GoalState {
  const parsed = JSON.parse(raw) as unknown
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.sessions)) {
    throw stateError("Goal state must have shape { version: 1, sessions: object }.")
  }
  return {
    version: 1,
    sessions: Object.fromEntries(
      Object.entries(parsed.sessions)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([sessionId, goals]): [string, GoalRecord[]] => [sessionId, goals.map((goal, index) => normalizeGoalRecord(goal, sessionId, index)).filter(isDefined)]),
    ),
    quarantineAudit: arrayValue(parsed.quarantineAudit).map(normalizeQuarantineAudit).filter(isDefined),
  }
}

function normalizeGoalRecord(value: unknown, sessionId: string, index: number): GoalRecord | undefined {
  if (!isRecord(value)) return undefined
  const createdAt = stringValue(value.createdAt) ?? nowIso()
  const status = isGoalStatus(value.status) ? value.status : "blocked"
  const invalidStatus = !isGoalStatus(value.status)
  const requirements = arrayValue(value.requirements).map(normalizeRequirement).filter(isDefined)
  const evidence = arrayValue(value.evidence).map(normalizeEvidence).filter(isDefined)
  const history = arrayValue(value.history).map(normalizeHistory).filter(isDefined)
  const sourcePaths = stringArray(value.sourcePaths)
  const blocker = stringValue(value.blocker)
  const expiresAt = stringValue(value.expiresAt)
  return {
    id: stringValue(value.id) ?? `legacy-${sessionId}-${index}`,
    sessionId,
    objective: stringValue(value.objective) ?? "Legacy goal",
    status,
    requirements,
    evidence,
    ...(blocker ? { blocker } : invalidStatus ? { blocker: "Persisted goal had an invalid status." } : {}),
    ...(isRiskLevel(value.riskLevel) ? { riskLevel: value.riskLevel } : {}),
    ...(sourcePaths.length > 0 ? { sourcePaths } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    containsExternalContent: booleanValue(value.containsExternalContent),
    quarantined: booleanValue(value.quarantined),
    ...(value.workflow === "prevc" ? { workflow: "prevc" as const } : {}),
    createdAt,
    updatedAt: stringValue(value.updatedAt) ?? createdAt,
    history: history.length > 0 ? history : [{ at: createdAt, status, summary: "Legacy goal normalized." }],
  }
}

function normalizeRequirement(value: unknown, index: number): GoalRecord["requirements"][number] | undefined {
  if (!isRecord(value)) return undefined
  return {
    id: stringValue(value.id) ?? `req-${index + 1}`,
    text: stringValue(value.text) ?? "",
    achieved: booleanValue(value.achieved),
    evidenceIds: stringArray(value.evidenceIds),
  }
}

function normalizeEvidence(value: unknown, index: number): GoalRecord["evidence"][number] | undefined {
  if (!isRecord(value)) return undefined
  const exitCode = integerValue(value.exitCode)
  const command = stringValue(value.command)
  const workspace = stringValue(value.workspace)
  const verifier = stringValue(value.verifier)
  return {
    id: stringValue(value.id) ?? `legacy-evidence-${index + 1}`,
    summary: stringValue(value.summary) ?? "",
    status: isEvidenceStatus(value.status) ? value.status : "unknown",
    requirementIds: stringArray(value.requirementIds),
    ...(command ? { command } : {}),
    ...(workspace ? { workspace } : {}),
    ...(exitCode !== undefined ? { exitCode } : {}),
    ...(verifier ? { verifier } : {}),
    createdAt: stringValue(value.createdAt) ?? nowIso(),
  }
}

function normalizeHistory(value: unknown): GoalRecord["history"][number] | undefined {
  if (!isRecord(value)) return undefined
  if (!isGoalStatus(value.status)) return undefined
  return {
    at: stringValue(value.at) ?? nowIso(),
    status: value.status,
    summary: stringValue(value.summary) ?? "Legacy history event.",
  }
}

function normalizeQuarantineAudit(value: unknown): NonNullable<GoalState["quarantineAudit"]>[number] | undefined {
  if (!isRecord(value) || !isGoalStatus(value.status)) return undefined
  const sessionId = stringValue(value.sessionId)
  const goalId = stringValue(value.goalId)
  const objective = stringValue(value.objective)
  const quarantinedAt = normalizedAuditTimestamp(value.quarantinedAt)
  const prunedAt = normalizedAuditTimestamp(value.prunedAt)
  if (!sessionId || !goalId || !objective || !quarantinedAt || !prunedAt) return undefined
  return {
    sessionId: sanitizeText(sessionId, 100),
    goalId: sanitizeText(goalId, 100),
    objective: sanitizeText(objective, 200),
    status: value.status,
    quarantinedAt,
    prunedAt,
  }
}

function normalizedAuditTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return undefined
  return new Date(value).toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function stringArray(value: unknown): string[] {
  return arrayValue(value).filter((item): item is string => typeof item === "string")
}

function booleanValue(value: unknown): boolean {
  return value === true
}

function integerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined
}

function isGoalStatus(value: unknown): value is GoalStatus {
  return typeof value === "string" && ["active", "paused", "complete", "cleared", "blocked", "awaiting_plan_approval", "awaiting_confirmation", "revision_requested", "aborted"].includes(value)
}

function isEvidenceStatus(value: unknown): value is GoalRecord["evidence"][number]["status"] {
  return typeof value === "string" && ["pass", "fail", "unknown"].includes(value)
}

function isRiskLevel(value: unknown): value is NonNullable<GoalRecord["riskLevel"]> {
  return typeof value === "string" && ["low", "medium", "high", "untrusted"].includes(value)
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function upsertGoal(goals: GoalRecord[], goal: GoalRecord): GoalRecord[] {
  const existingIndex = goals.findIndex((item) => item.id === goal.id)
  if (existingIndex === -1) return [...goals, goal]
  return goals.map((item, index) => (index === existingIndex ? goal : item))
}

function assertNewGoal(goal: GoalRecord): void {
  const expectedStatus = goal.workflow === "prevc" ? "awaiting_plan_approval" : "active"
  if (goal.status !== expectedStatus) {
    throw stateError(`New goal ${goal.id} must start with status ${expectedStatus}; received ${goal.status}.`)
  }
}

function assertGenericMutation(sessionId: string, current: GoalRecord, updated: GoalRecord): void {
  if (updated.id !== current.id) throw stateError(`Goal mutation must preserve id ${current.id}.`)
  if (updated.sessionId !== sessionId) throw stateError(`Goal mutation must preserve session partition ${sessionId}.`)
  if (updated.workflow !== current.workflow) throw stateError("Goal mutation cannot change workflow classification.")
  const error = genericTransitionError(current, updated.status)
  if (error) throw stateError(error)
}

function withStatus(goal: GoalRecord, status: GoalStatus, summary: string): GoalRecord {
  const updatedAt = nowIso()
  return {
    ...goal,
    status,
    updatedAt,
    history: [...goal.history, { at: updatedAt, status, summary: sanitizeText(summary, 500) }],
  }
}

function isCurrentStatus(status: GoalStatus): boolean {
  return ["active", "paused", "blocked", "awaiting_plan_approval", "awaiting_confirmation", "revision_requested"].includes(status)
}

async function acquireStateLock(lockPath: string): Promise<() => Promise<void>> {
  await mkdir(dirname(lockPath), { recursive: true })
  for (let attempt = 0; attempt < LOCK_RETRY_COUNT; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx")
      const lock = { owner: randomUUID(), pid: process.pid, acquiredAt: nowIso() }
      try {
        await handle.writeFile(JSON.stringify(lock), "utf8")
      } catch (error) {
        try {
          await handle.close()
        } finally {
          await releaseLockIfOwned(lockPath, lock.owner)
        }
        throw error
      }
      return async () => {
        try {
          await handle.close()
        } finally {
          await releaseLockIfOwned(lockPath, lock.owner)
        }
      }
    } catch (error) {
      if (!isExistingFile(error)) throw stateError(`Unable to acquire goal state lock at ${lockPath}: ${String(error)}`)
      if (await recoverStaleLock(lockPath)) continue
      if (attempt === LOCK_RETRY_COUNT - 1) {
        throw stateError(`Timed out acquiring goal state lock at ${lockPath} after ${LOCK_RETRY_COUNT} attempts.`)
      }
      await delay(LOCK_RETRY_DELAY_MS)
    }
  }
  throw stateError(`Unable to acquire goal state lock at ${lockPath}.`)
}

async function recoverStaleLock(lockPath: string): Promise<boolean> {
  try {
    const lock = await stat(lockPath)
    if (Date.now() - lock.mtimeMs < STALE_LOCK_MS) return false
    const record = await readLockRecord(lockPath)
    if (!record) throw stateError(`Goal state lock at ${lockPath} is malformed; refusing stale-lock recovery.`)
    if (isProcessAlive(record.pid)) return false
    const tombstonePath = await claimLockForDeletion(lockPath, record.owner)
    if (!tombstonePath) return false
    return deleteClaimedTombstone(tombstonePath, record.owner)
  } catch (error) {
    if (isMissingFile(error)) return true
    throw stateError(`Unable to inspect goal state lock at ${lockPath}: ${String(error)}`)
  }
}

type GoalLockRecord = { owner: string; pid: number; acquiredAt: string }

async function readLockRecord(lockPath: string): Promise<GoalLockRecord | undefined> {
  try {
    const parsed = JSON.parse(await readFile(lockPath, "utf8")) as unknown
    if (!isRecord(parsed) || typeof parsed.owner !== "string" || !parsed.owner || !isPositiveInteger(parsed.pid) || typeof parsed.acquiredAt !== "string" || !Number.isFinite(Date.parse(parsed.acquiredAt))) {
      return undefined
    }
    return { owner: parsed.owner, pid: parsed.pid, acquiredAt: parsed.acquiredAt }
  } catch (error) {
    if (isMissingFile(error)) return undefined
    throw error
  }
}

async function releaseLockIfOwned(lockPath: string, owner: string): Promise<void> {
  const tombstonePath = await claimLockForDeletion(lockPath, owner)
  if (!tombstonePath) return
  await deleteClaimedTombstone(tombstonePath, owner)
}

async function claimLockForDeletion(lockPath: string, owner: string): Promise<string | undefined> {
  const tombstonePath = `${lockPath}.tombstone-${owner}`
  try {
    await rename(lockPath, tombstonePath)
  } catch (error) {
    if (isMissingFile(error) || isExistingFile(error)) return undefined
    throw error
  }
  const record = await readLockRecord(tombstonePath)
  return record?.owner === owner ? tombstonePath : undefined
}

async function deleteClaimedTombstone(tombstonePath: string, owner: string): Promise<boolean> {
  const record = await readLockRecord(tombstonePath)
  if (!record || record.owner !== owner) return false
  await rm(tombstonePath, { force: true })
  return true
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (isMissingProcess(error)) return false
    return true
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function isExistingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST"
}

function isMissingProcess(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ESRCH"
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}
