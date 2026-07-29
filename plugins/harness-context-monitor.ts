import { readdir } from "node:fs/promises"
import path from "node:path"
import type { Event } from "@opencode-ai/sdk"
import type { Plugin } from "@opencode-ai/plugin"

// HARNESS_PROFILE tiers (this guard's behavior):
//   minimal  — recovery profile. The context/scope monitor is SKIPPED entirely;
//              no session warnings are emitted.
//   standard — (default when unset) monitor active with default thresholds
//              (skills > 40, plugins > 8) emitted as warnings only.
//   strict   — monitor active with LOWER thresholds (skills > 25, plugins > 5)
//              so scope creep is flagged earlier.
//
const profile = process.env.HARNESS_PROFILE ?? "standard"

// Strict lowers the thresholds so scope creep trips earlier; standard keeps the
// looser defaults.
const skillThreshold = profile === "strict" ? 25 : 40
const pluginThreshold = profile === "strict" ? 5 : 8

async function countDirectories(directoryPath: string): Promise<number> {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).length
  } catch {
    return 0
  }
}

function warningMessages(skillCount: number, pluginCount: number): string[] {
  const messages: string[] = []
  if (skillCount > skillThreshold) messages.push(`High project skill count: ${skillCount}. Prefer lazy-loading relevant harness skills.`)
  if (pluginCount > pluginThreshold) messages.push(`High project plugin count: ${pluginCount}. Review plugin surface before long tasks.`)
  return messages
}

export default (async ({ client, worktree }) => ({
  // There is no top-level `session.created` hook key on the plugin API; session
  // lifecycle arrives through the generic `event` hook. We gate on the
  // "session.created" event type so the monitor actually fires on new sessions.
  event: async ({ event }: { event: Event }) => {
    if (event.type !== "session.created") return
    // Minimal recovery disables advisory diagnostics only.
    if (profile === "minimal") return
    const skillCount = await countDirectories(path.join(worktree, ".opencode", "skills"))
    const pluginCount = await countDirectories(path.join(worktree, ".opencode", "plugins"))
    for (const message of warningMessages(skillCount, pluginCount)) {
      await client.app.log({ body: { service: "harness-context", level: "warn", message } })
    }
  },
})) satisfies Plugin
