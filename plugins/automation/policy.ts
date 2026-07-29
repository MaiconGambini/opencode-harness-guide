import { NormalizedEvent, RejectedIngress } from "./events";
import {
  AlertRecord,
  CandidateRecord,
  RedactedDiagnosticRecord,
  ReviewProposal,
  TriageQueueSnapshot,
} from "./queue";

export type TriageRoute = "low" | "medium" | "high" | "untrusted" | "suppressed";
export type TriageObservation = NormalizedEvent | RejectedIngress;

export interface TriagePolicy {
  readonly cooldownMinutes: number;
  readonly maximumEventsPerDay: number;
  readonly maximumOpenProposals: number;
  readonly maximumRecordsPerQueue: number;
  readonly repeatedPluginFailureThreshold: number;
}

export const defaultTriagePolicy: TriagePolicy = {
  cooldownMinutes: 60,
  maximumEventsPerDay: 100,
  maximumOpenProposals: 10,
  maximumRecordsPerQueue: 1_000,
  repeatedPluginFailureThreshold: 3,
};

export function resolveTriagePolicy(policy?: Partial<TriagePolicy>): TriagePolicy {
  const requested = policy ?? {};
  return {
    cooldownMinutes: boundedInteger(requested.cooldownMinutes ?? defaultTriagePolicy.cooldownMinutes, 1, 1_440),
    maximumEventsPerDay: boundedInteger(requested.maximumEventsPerDay ?? defaultTriagePolicy.maximumEventsPerDay, 1, 1_000),
    maximumOpenProposals: boundedInteger(requested.maximumOpenProposals ?? defaultTriagePolicy.maximumOpenProposals, 0, 100),
    maximumRecordsPerQueue: boundedInteger(requested.maximumRecordsPerQueue ?? defaultTriagePolicy.maximumRecordsPerQueue, 1, 1_000),
    repeatedPluginFailureThreshold: boundedInteger(requested.repeatedPluginFailureThreshold ?? defaultTriagePolicy.repeatedPluginFailureThreshold, 1, 100),
  };
}

export interface PolicyDecision {
  readonly route: TriageRoute;
  readonly reason: string;
}

/** Applies budgets and duplicate controls before classifying every risk route. */
export function decideRoute(
  observation: TriageObservation,
  snapshot: TriageQueueSnapshot,
  policy: TriagePolicy = defaultTriagePolicy,
  now: Date = new Date(),
): PolicyDecision {
  if (hasReachedDailyBudget(snapshot, policy, now)) {
    return { route: "suppressed", reason: "daily_event_budget_reached" };
  }
  if (isDuplicateOrCoolingDown(observation, snapshot, policy, now)) {
    return { route: "suppressed", reason: "duplicate_or_correlation_cooldown" };
  }

  if (observation.eventKind === "invalid_ingress") {
    return { route: "untrusted", reason: observation.reason };
  }
  if (observation.event.kind === "repeated_plugin_failure" && observation.event.payload.failureCount >= policy.repeatedPluginFailureThreshold) {
    return { route: "high", reason: "repeated_plugin_failure_threshold" };
  }
  if (observation.event.kind === "scanner_finding" && ["high", "critical"].includes(observation.event.payload.severity)) {
    return { route: "high", reason: "scanner_severity_requires_operator_attention" };
  }
  if (
    observation.event.kind === "retention_threshold" ||
    (observation.event.kind === "scanner_finding" && observation.event.payload.severity === "low")
  ) {
    return { route: "low", reason: "bounded_observation_only" };
  }
  if (openProposalCount(snapshot) >= policy.maximumOpenProposals) {
    return { route: "suppressed", reason: "proposal_budget_reached" };
  }
  return { route: "medium", reason: "operator_plan_review_required" };
}

export function makeDiagnostic(observation: TriageObservation, reason: string, now: Date): RedactedDiagnosticRecord {
  return {
    id: `diagnostic-${observation.fingerprint}-${now.getTime()}`,
    eventKind: observation.eventKind,
    fingerprint: observation.fingerprint,
    correlationId: observation.correlationId,
    createdAt: now.toISOString(),
    risk: "low",
    reason,
  };
}

export function makeCandidate(observation: NormalizedEvent, reason: string, now: Date): CandidateRecord {
  return {
    id: `candidate-${observation.fingerprint}-${now.getTime()}`,
    fingerprint: observation.fingerprint,
    correlationId: observation.correlationId,
    eventKind: observation.eventKind,
    risk: "medium",
    createdAt: now.toISOString(),
    status: "candidate",
    reason,
  };
}

export function makeProposal(candidate: CandidateRecord, now: Date): ReviewProposal {
  return {
    id: `proposal-${candidate.id}`,
    candidateId: candidate.id,
    status: "queue_scoped_operator_plan_review_pending",
    createdAt: now.toISOString(),
    summary: `Review ${candidate.eventKind} candidate ${candidate.id}.`,
    scope: "diagnostic_only",
  };
}

export function makeAlert(observation: TriageObservation, route: "high" | "untrusted", reason: string, now: Date): AlertRecord {
  return {
    id: `alert-${observation.fingerprint}-${now.getTime()}`,
    eventKind: observation.eventKind,
    fingerprint: observation.fingerprint,
    correlationId: observation.correlationId,
    risk: route,
    createdAt: now.toISOString(),
    action: "alert_and_stop",
    reason,
  };
}

function hasReachedDailyBudget(snapshot: TriageQueueSnapshot, policy: TriagePolicy, now: Date): boolean {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return admittedRecords(snapshot).filter((record) => new Date(record.createdAt) >= start).length >= policy.maximumEventsPerDay;
}

function isDuplicateOrCoolingDown(
  observation: TriageObservation,
  snapshot: TriageQueueSnapshot,
  policy: TriagePolicy,
  now: Date,
): boolean {
  const cooldownStart = now.getTime() - policy.cooldownMinutes * 60_000;
  return admittedRecords(snapshot).some((record) => {
    if (record.fingerprint === observation.fingerprint) {
      return true;
    }
    return record.correlationId === observation.correlationId && new Date(record.createdAt).getTime() >= cooldownStart;
  });
}

function openProposalCount(snapshot: TriageQueueSnapshot): number {
  return snapshot.proposals.filter((proposal) => proposal.status === "queue_scoped_operator_plan_review_pending").length;
}

function admittedRecords(snapshot: TriageQueueSnapshot): ReadonlyArray<{ readonly fingerprint: string; readonly correlationId: string; readonly createdAt: string }> {
  return [...snapshot.candidates, ...snapshot.alerts, ...snapshot.diagnostics];
}

function boundedInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return maximum;
  }
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}
