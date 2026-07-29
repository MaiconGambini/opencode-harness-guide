import { normalizeEvent } from "./events";
import {
  decideRoute,
  makeAlert,
  makeCandidate,
  makeDiagnostic,
  makeProposal,
  resolveTriagePolicy,
  TriagePolicy,
} from "./policy";
import { ProactiveTriageQueue } from "./queue";

export type AutomationResult =
  | { readonly route: "low"; readonly recordId: string }
  | { readonly route: "medium"; readonly candidateId: string; readonly proposalId: string }
  | { readonly route: "high" | "untrusted"; readonly alertId: string }
  | { readonly route: "suppressed"; readonly reason: string };

/**
 * Library-only entry point. No producer is registered or enabled by this module.
 * It accepts unknown ingress, validates it under the queue lock, and stores only
 * redacted queue records in the fixed global automation state directory.
 */
export async function triageProactiveIngress(
  ingress: unknown,
  policyOverride?: Partial<TriagePolicy>,
): Promise<AutomationResult> {
  const policy = resolveTriagePolicy(policyOverride);
  const queue = new ProactiveTriageQueue();

  return queue.admit<AutomationResult>(policy.maximumRecordsPerQueue, (snapshot) => {
    const normalized = normalizeEvent(ingress);
    const observation = normalized.accepted ? normalized.value : normalized.rejection;
    const decision = decideRoute(observation, snapshot, policy);

    if (decision.route === "suppressed") {
      return { snapshot, result: { route: "suppressed", reason: decision.reason } };
    }
    if (decision.route === "low") {
      const diagnostic = makeDiagnostic(observation, decision.reason, new Date());
      return {
        snapshot: { ...snapshot, diagnostics: [...snapshot.diagnostics, diagnostic] },
        result: { route: "low", recordId: diagnostic.id },
      };
    }
    if (decision.route === "medium") {
      if (!normalized.accepted) {
        return { snapshot, result: { route: "suppressed", reason: "medium_route_requires_accepted_event" } };
      }
      const event = normalized.value;
      const candidate = makeCandidate(event, decision.reason, new Date());
      const proposal = makeProposal(candidate, new Date());
      return {
        snapshot: {
          ...snapshot,
          candidates: [...snapshot.candidates, candidate],
          proposals: [...snapshot.proposals, proposal],
        },
        result: { route: "medium", candidateId: candidate.id, proposalId: proposal.id },
      };
    }

    const alert = makeAlert(observation, decision.route, decision.reason, new Date());
    return {
      snapshot: { ...snapshot, alerts: [...snapshot.alerts, alert] },
      result: { route: decision.route, alertId: alert.id },
    };
  });
}
