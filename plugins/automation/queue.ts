import { randomUUID } from "node:crypto";
import { lstat, open, mkdir, readFile, rename, rmdir, unlink } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, relative, resolve } from "node:path";

export const proactiveQueueRoot = resolve(homedir(), ".config", "opencode", "state", "automation", "proactive");
const queueFile = resolve(proactiveQueueRoot, "queue.json");
const lockDirectory = resolve(proactiveQueueRoot, "queue.lock");
const maximumPersistedRecords = 1_000;

export interface CandidateRecord {
  readonly id: string;
  readonly fingerprint: string;
  readonly correlationId: string;
  readonly eventKind: string;
  readonly risk: "medium";
  readonly createdAt: string;
  readonly status: "candidate";
  readonly reason: string;
}

export interface ReviewProposal {
  readonly id: string;
  readonly candidateId: string;
  readonly status: "queue_scoped_operator_plan_review_pending";
  readonly createdAt: string;
  readonly summary: string;
  readonly scope: "diagnostic_only";
}

export interface AlertRecord {
  readonly id: string;
  readonly fingerprint: string;
  readonly correlationId: string;
  readonly eventKind: string;
  readonly risk: "high" | "untrusted";
  readonly createdAt: string;
  readonly action: "alert_and_stop";
  readonly reason: string;
}

export interface RedactedDiagnosticRecord {
  readonly id: string;
  readonly eventKind: string;
  readonly fingerprint: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly risk: "low";
  readonly reason: string;
}

export interface TriageQueueSnapshot {
  readonly candidates: readonly CandidateRecord[];
  readonly proposals: readonly ReviewProposal[];
  readonly alerts: readonly AlertRecord[];
  readonly diagnostics: readonly RedactedDiagnosticRecord[];
}

export class ProactiveTriageQueue {
  public async admit<Result>(
    maximumRecordsPerQueue: number,
    admission: (snapshot: TriageQueueSnapshot) => { readonly snapshot: TriageQueueSnapshot; readonly result: Result },
  ): Promise<Result> {
    await mkdir(proactiveQueueRoot, { recursive: true, mode: 0o700 });
    const rootStats = await lstat(proactiveQueueRoot);
    if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
      throw new Error("Proactive triage state root is not a safe directory; admission stopped.");
    }
    assertPathWithin(proactiveQueueRoot, queueFile);
    assertPathWithin(proactiveQueueRoot, lockDirectory);
    const lock = await acquireLock();

    try {
      const current = await readSnapshot();
      const outcome = admission(current);
      const bounded = capSnapshot(outcome.snapshot, Math.min(maximumPersistedRecords, maximumRecordsPerQueue));
      await writeSnapshot(bounded);
      return outcome.result;
    } finally {
      await releaseLock(lock);
    }
  }
}

export function emptySnapshot(): TriageQueueSnapshot {
  return { candidates: [], proposals: [], alerts: [], diagnostics: [] };
}

export function capSnapshot(snapshot: TriageQueueSnapshot, maximumRecordsPerQueue: number): TriageQueueSnapshot {
  return {
    candidates: newest(snapshot.candidates, maximumRecordsPerQueue),
    proposals: newest(snapshot.proposals, maximumRecordsPerQueue),
    alerts: newest(snapshot.alerts, maximumRecordsPerQueue),
    diagnostics: newest(snapshot.diagnostics, maximumRecordsPerQueue),
  };
}

function assertPathWithin(root: string, candidate: string): void {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const nested = relative(resolvedRoot, resolvedCandidate);
  if (!nested || nested === ".." || nested.startsWith("..\\") || nested.startsWith("../") || isAbsolute(nested)) {
    throw new Error("Proactive queue path escapes its fixed state root.");
  }
}

interface LockMetadata {
  readonly token: string;
  readonly acquiredAt: string;
  readonly pid: number;
}

async function acquireLock(): Promise<{ readonly metadata: LockMetadata; readonly markerFile: string }> {
  const token = randomUUID();
  const metadata: LockMetadata = { token, acquiredAt: new Date().toISOString(), pid: process.pid };
  let markerHandle: FileHandle | undefined;
  try {
    await mkdir(lockDirectory, { recursive: false, mode: 0o700 });
    const directoryStats = await lstat(lockDirectory);
    if (!directoryStats.isDirectory() || directoryStats.isSymbolicLink()) {
      throw new Error("Proactive triage lock is not an owned directory.");
    }
    const markerFile = resolve(lockDirectory, `${metadata.token}.owner`);
    assertPathWithin(lockDirectory, markerFile);
    markerHandle = await open(markerFile, "wx", 0o600);
    await markerHandle.writeFile(JSON.stringify(metadata), "utf8");
    await markerHandle.sync();
    await markerHandle.close();
    markerHandle = undefined;
    return { metadata, markerFile };
  } catch (error: unknown) {
    await markerHandle?.close();
    throw new Error("Proactive triage queue is locked or its lock cannot be created; admission stopped.", { cause: error });
  }
}

async function releaseLock(lock: { readonly metadata: LockMetadata; readonly markerFile: string }): Promise<void> {
  const tombstoneFile = resolve(lockDirectory, `${lock.metadata.token}.tombstone`);
  assertPathWithin(lockDirectory, tombstoneFile);
  try {
    await rename(lock.markerFile, tombstoneFile);
    const tombstoneStats = await lstat(tombstoneFile);
    if (!tombstoneStats.isFile() || tombstoneStats.isSymbolicLink() || tombstoneStats.size > 512) {
      throw new Error("Proactive triage tombstone has an unsafe shape.");
    }
    const tombstone = parseLockMetadata(await readFile(tombstoneFile, "utf8"));
    if (
      tombstone.token !== lock.metadata.token ||
      tombstone.acquiredAt !== lock.metadata.acquiredAt ||
      tombstone.pid !== lock.metadata.pid
    ) {
      throw new Error("Proactive triage tombstone ownership metadata does not match.");
    }
    await unlink(tombstoneFile);
    await rmdir(lockDirectory);
  } catch {
    // A failed marker claim or non-empty lock directory deliberately blocks admission.
  }
}

function parseLockMetadata(raw: string): LockMetadata {
  const parsed: unknown = JSON.parse(raw);
  if (!isExactObject(parsed, ["token", "acquiredAt", "pid"])) {
    throw new Error("Proactive triage lock metadata has an invalid shape.");
  }
  const metadata = parsed as Record<string, unknown>;
  if (
    typeof metadata.token !== "string" ||
    typeof metadata.acquiredAt !== "string" ||
    typeof metadata.pid !== "number" ||
    !Number.isInteger(metadata.pid) ||
    metadata.pid < 0
  ) {
    throw new Error("Proactive triage lock metadata has invalid values.");
  }
  return { token: metadata.token, acquiredAt: metadata.acquiredAt, pid: metadata.pid };
}

async function readSnapshot(): Promise<TriageQueueSnapshot> {
  try {
    const queueStats = await lstat(queueFile);
    if (!queueStats.isFile() || queueStats.size > 1_000_000) {
      throw new Error("Proactive triage queue has an unsafe file shape.");
    }
    const parsed: unknown = JSON.parse(await readFile(queueFile, "utf8"));
    if (!isSnapshot(parsed)) {
      throw new Error("Proactive triage queue has an invalid snapshot.");
    }
    return parsed;
  } catch (error: unknown) {
    if (isMissingFile(error)) {
      return emptySnapshot();
    }
    throw error;
  }
}

async function writeSnapshot(snapshot: TriageQueueSnapshot): Promise<void> {
  const temporaryFile = resolve(proactiveQueueRoot, `${basename(queueFile)}.${process.pid}.${randomUUID()}.tmp`);
  assertPathWithin(proactiveQueueRoot, temporaryFile);
  let temporaryHandle: FileHandle | undefined;
  try {
    temporaryHandle = await open(temporaryFile, "wx", 0o600);
    await temporaryHandle.writeFile(`${JSON.stringify(snapshot)}\n`, "utf8");
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = undefined;
    await rename(temporaryFile, queueFile);
  } catch (error: unknown) {
    await temporaryHandle?.close().catch(() => undefined);
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

function isSnapshot(value: unknown): value is TriageQueueSnapshot {
  if (!isExactObject(value, ["candidates", "proposals", "alerts", "diagnostics"])) {
    return false;
  }
  const snapshot = value as Record<string, unknown>;
  return (
    isBoundedArray(snapshot.candidates, isCandidate) &&
    isBoundedArray(snapshot.proposals, isProposal) &&
    isBoundedArray(snapshot.alerts, isAlert) &&
    isBoundedArray(snapshot.diagnostics, isDiagnostic)
  );
}

function isBoundedArray(value: unknown, itemValidator: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.length <= maximumPersistedRecords && value.every(itemValidator);
}

function isCandidate(value: unknown): value is CandidateRecord {
  return isExactObject(value, ["id", "fingerprint", "correlationId", "eventKind", "risk", "createdAt", "status", "reason"]) &&
    (value as Record<string, unknown>).risk === "medium" && (value as Record<string, unknown>).status === "candidate" && validRecordStrings(value);
}

function isProposal(value: unknown): value is ReviewProposal {
  return isExactObject(value, ["id", "candidateId", "status", "createdAt", "summary", "scope"]) &&
    (value as Record<string, unknown>).status === "queue_scoped_operator_plan_review_pending" && (value as Record<string, unknown>).scope === "diagnostic_only" && validRecordStrings(value);
}

function isAlert(value: unknown): value is AlertRecord {
  const record = value as Record<string, unknown>;
  return isExactObject(value, ["id", "fingerprint", "correlationId", "eventKind", "risk", "createdAt", "action", "reason"]) &&
    (record.risk === "high" || record.risk === "untrusted") && record.action === "alert_and_stop" && validRecordStrings(value);
}

function isDiagnostic(value: unknown): value is RedactedDiagnosticRecord {
  const record = value as Record<string, unknown>;
  return isExactObject(value, ["id", "eventKind", "fingerprint", "correlationId", "createdAt", "risk", "reason"]) &&
    record.risk === "low" && validRecordStrings(value);
}

function validRecordStrings(value: unknown): boolean {
  return Object.values(value as Record<string, unknown>).every((entry) => typeof entry === "string");
}

function isExactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }
  const actual = Object.keys(value);
  return (
    Object.getOwnPropertySymbols(value).length === 0 &&
    actual.length === keys.length &&
    actual.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return keys.includes(key) && descriptor?.enumerable === true && "value" in descriptor;
    })
  );
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && (error as NodeJS.ErrnoException).code === "ENOENT";
}

function newest<Record extends { readonly createdAt: string }>(records: readonly Record[], maximum: number): readonly Record[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, maximum);
}
