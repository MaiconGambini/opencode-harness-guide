/**
 * Task 9 runtime entry point.
 *
 * This registered plugin is scheduler-only and intentionally disabled: it
 * registers no timer, event source, automation action, or proactive-triage
 * import. Enabling scheduling requires a separate operator-approved change.
 */
export default async function schedulerPlugin(): Promise<Record<string, never>> {
  return {};
}
