import path from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin } from "@opencode-ai/plugin"
import { enabledSchedules } from "./schedule-registry.ts"
import { startScheduler } from "./scheduler.ts"

const globalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

export default (async (_input, options) => {
  // This plugin has no configuration hooks and never touches a project worktree.
  // An empty enabled set leaves only the typed framework loaded, not a running job.
  const stopScheduler = startScheduler(globalRoot, enabledSchedules(options))
  return {
    dispose: async () => stopScheduler(),
  }
}) satisfies Plugin
