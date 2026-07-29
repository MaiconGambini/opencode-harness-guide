/**
 * Task 10 source-only proactive triage API.
 *
 * This module is intentionally not an OpenCode plugin entry point and must not
 * be registered for runtime loading. Runtime automation is limited to the
 * inert scheduler-plugin.ts entry point.
 */
export { triageProactiveIngress } from "./automation/index";
export type { AutomationResult } from "./automation/index";
