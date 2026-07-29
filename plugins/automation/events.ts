/** Typed, validated observations accepted by proactive automation. */
export type TriageEventKind =
  | "ci_failure"
  | "scanner_finding"
  | "stale_goal"
  | "missing_handoff"
  | "repeated_plugin_failure"
  | "retention_threshold";

export type TriageEventSource =
  | "ci"
  | "scanner"
  | "goal_monitor"
  | "handoff_monitor"
  | "plugin_runtime"
  | "retention_monitor";

interface EventEnvelope<Kind extends TriageEventKind, Source extends TriageEventSource, Payload> {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly kind: Kind;
  readonly source: Source;
  readonly occurredAt: string;
  readonly correlationKey: string;
  readonly payload: Readonly<Payload>;
}

export type CiFailureEvent = EventEnvelope<"ci_failure", "ci", {
  readonly pipeline: string;
  readonly stage: string;
  readonly failedCheck: string;
}>;

export type ScannerFindingEvent = EventEnvelope<"scanner_finding", "scanner", {
  readonly scanner: string;
  readonly ruleId: string;
  readonly severity: "low" | "medium" | "high" | "critical";
}>;

export type StaleGoalEvent = EventEnvelope<"stale_goal", "goal_monitor", {
  readonly ageHours: number;
  readonly hasActiveWork: boolean;
}>;

export type MissingHandoffEvent = EventEnvelope<"missing_handoff", "handoff_monitor", {
  readonly sessionId: string;
  readonly missingForHours: number;
}>;

export type RepeatedPluginFailureEvent = EventEnvelope<"repeated_plugin_failure", "plugin_runtime", {
  readonly pluginName: string;
  readonly failureCount: number;
  readonly windowMinutes: number;
}>;

export type RetentionThresholdEvent = EventEnvelope<"retention_threshold", "retention_monitor", {
  readonly store: string;
  readonly usagePercent: number;
  readonly thresholdPercent: number;
}>;

export type TriageEvent =
  | CiFailureEvent
  | ScannerFindingEvent
  | StaleGoalEvent
  | MissingHandoffEvent
  | RepeatedPluginFailureEvent
  | RetentionThresholdEvent;

export interface NormalizedEvent {
  readonly event: TriageEvent;
  readonly eventKind: TriageEventKind;
  readonly fingerprint: string;
  readonly correlationId: string;
  readonly occurredAt: string;
}

export interface RejectedIngress {
  readonly eventKind: "invalid_ingress";
  readonly fingerprint: string;
  readonly correlationId: "invalid_ingress";
  readonly reason: "invalid_envelope" | "invalid_payload";
}

export type NormalizationResult =
  | { readonly accepted: true; readonly value: NormalizedEvent }
  | { readonly accepted: false; readonly rejection: RejectedIngress };

/**
 * Converts an unknown ingress value into one of the six internal typed events.
 * Invalid input is never retained; only the fixed rejection category is exposed.
 */
export function normalizeEvent(ingress: unknown): NormalizationResult {
  if (!isPlainObject(ingress) || !hasExactKeys(ingress, envelopeKeys)) {
    return reject("invalid_envelope");
  }

  const envelope = ingress as Record<string, unknown>;
  if (
    envelope.schemaVersion !== 1 ||
    !isNonEmptyString(envelope.id) ||
    !isEventKind(envelope.kind) ||
    !isEventSource(envelope.source) ||
    !isSourceForKind(envelope.kind, envelope.source) ||
    !isCanonicalIsoTimestamp(envelope.occurredAt) ||
    !isNonEmptyString(envelope.correlationKey) ||
    !isPlainObject(envelope.payload)
  ) {
    return reject("invalid_envelope");
  }

  const event = makeTypedEvent(envelope.kind, envelope.source, envelope);
  if (event === null) {
    return reject("invalid_payload");
  }

  const canonical = [event.kind, event.source, event.correlationKey.toLowerCase(), payloadKey(event)].join("|");
  return {
    accepted: true,
    value: {
      event,
      eventKind: event.kind,
      fingerprint: stableHash(canonical),
      correlationId: stableHash(`${event.kind}|${event.correlationKey.toLowerCase()}`),
      occurredAt: event.occurredAt,
    },
  };
}

const envelopeKeys = ["schemaVersion", "id", "kind", "source", "occurredAt", "correlationKey", "payload"] as const;

function makeTypedEvent(kind: TriageEventKind, source: TriageEventSource, envelope: Record<string, unknown>): TriageEvent | null {
  const base = {
    schemaVersion: 1 as const,
    id: envelope.id as string,
    kind,
    source,
    occurredAt: envelope.occurredAt as string,
    correlationKey: envelope.correlationKey as string,
  };
  const payload = envelope.payload as Record<string, unknown>;

  switch (kind) {
    case "ci_failure":
      return hasExactKeys(payload, ["pipeline", "stage", "failedCheck"]) && strings(payload, ["pipeline", "stage", "failedCheck"])
        ? { ...base, kind, source: "ci", payload: { pipeline: payload.pipeline, stage: payload.stage, failedCheck: payload.failedCheck } }
        : null;
    case "scanner_finding":
      return hasExactKeys(payload, ["scanner", "ruleId", "severity"]) && strings(payload, ["scanner", "ruleId"]) && isSeverity(payload.severity)
        ? { ...base, kind, source: "scanner", payload: { scanner: payload.scanner, ruleId: payload.ruleId, severity: payload.severity } }
        : null;
    case "stale_goal":
      return hasExactKeys(payload, ["ageHours", "hasActiveWork"]) && isNonNegativeNumber(payload.ageHours) && typeof payload.hasActiveWork === "boolean"
        ? { ...base, kind, source: "goal_monitor", payload: { ageHours: payload.ageHours, hasActiveWork: payload.hasActiveWork } }
        : null;
    case "missing_handoff":
      return hasExactKeys(payload, ["sessionId", "missingForHours"]) && isNonEmptyString(payload.sessionId) && isNonNegativeNumber(payload.missingForHours)
        ? { ...base, kind, source: "handoff_monitor", payload: { sessionId: payload.sessionId, missingForHours: payload.missingForHours } }
        : null;
    case "repeated_plugin_failure":
      return hasExactKeys(payload, ["pluginName", "failureCount", "windowMinutes"]) && isNonEmptyString(payload.pluginName) && isPositiveInteger(payload.failureCount) && isPositiveInteger(payload.windowMinutes)
        ? { ...base, kind, source: "plugin_runtime", payload: { pluginName: payload.pluginName, failureCount: payload.failureCount, windowMinutes: payload.windowMinutes } }
        : null;
    case "retention_threshold":
      return hasExactKeys(payload, ["store", "usagePercent", "thresholdPercent"]) && isNonEmptyString(payload.store) && isPercent(payload.usagePercent) && isPercent(payload.thresholdPercent)
        ? { ...base, kind, source: "retention_monitor", payload: { store: payload.store, usagePercent: payload.usagePercent, thresholdPercent: payload.thresholdPercent } }
        : null;
  }
}

function reject(reason: RejectedIngress["reason"]): NormalizationResult {
  return {
    accepted: false,
    rejection: {
      eventKind: "invalid_ingress",
      fingerprint: `invalid-${reason}`,
      correlationId: "invalid_ingress",
      reason,
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
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

function strings(value: Record<string, unknown>, keys: readonly string[]): value is Record<string, string> {
  return keys.every((key) => isNonEmptyString(value[key]));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 512;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeNumber(value) && Number.isInteger(value) && value > 0;
}

function isPercent(value: unknown): value is number {
  return isNonNegativeNumber(value) && value <= 100;
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isEventKind(value: unknown): value is TriageEventKind {
  return ["ci_failure", "scanner_finding", "stale_goal", "missing_handoff", "repeated_plugin_failure", "retention_threshold"].includes(value as string);
}

function isEventSource(value: unknown): value is TriageEventSource {
  return ["ci", "scanner", "goal_monitor", "handoff_monitor", "plugin_runtime", "retention_monitor"].includes(value as string);
}

function isSourceForKind(kind: TriageEventKind, source: TriageEventSource): boolean {
  return (
    (kind === "ci_failure" && source === "ci") ||
    (kind === "scanner_finding" && source === "scanner") ||
    (kind === "stale_goal" && source === "goal_monitor") ||
    (kind === "missing_handoff" && source === "handoff_monitor") ||
    (kind === "repeated_plugin_failure" && source === "plugin_runtime") ||
    (kind === "retention_threshold" && source === "retention_monitor")
  );
}

function isSeverity(value: unknown): value is ScannerFindingEvent["payload"]["severity"] {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function payloadKey(event: TriageEvent): string {
  return JSON.stringify(event.payload);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
