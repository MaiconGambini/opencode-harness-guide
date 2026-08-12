import type { Part } from "@opencode-ai/sdk"
import type { Plugin, PluginOptions } from "@opencode-ai/plugin"
import { createGoalStore } from "./goal-store.ts"
import { createGoalTools } from "./tools.ts"
import { buildGoalCommandTemplate, routeGoalCommand } from "./command-router.ts"
import { summarizeGoalForCompaction } from "./goal-record.ts"
import { DEFAULT_OPTIONS, type GoalPluginOptions } from "./state-schema.ts"

export const GoalPlugin: Plugin = async (_input, rawOptions) => {
  const options = normalizeOptions(rawOptions)
  const store = createGoalStore(undefined, options)

  return {
    config: async (config) => {
      if (!options.register_command) return
      config.command = config.command ?? {}
      config.command[options.command_name] = {
        description: "Manage the current session goal: status, create, pause, resume, clear, history.",
        template: buildGoalCommandTemplate(options.command_name),
      }
    },
    tool: createGoalTools(store, options),
    "command.execute.before": async (input, output) => {
      if (input.command !== options.command_name) return
      const text = await routeGoalCommand(store, input.sessionID, input.arguments, options.command_name, options)
      output.parts = [toSyntheticTextPart(input.sessionID, text)]
    },
    "experimental.session.compacting": async (input, output) => {
      const goal = await store.getCurrentGoal(input.sessionID)
      if (!goal) return
      output.context.push(summarizeGoalForCompaction(goal))
    },
  }
}

function normalizeOptions(rawOptions: PluginOptions | undefined): GoalPluginOptions {
  const source = rawOptions ?? {}
  return {
    retention_days: numberOption(source.retention_days, DEFAULT_OPTIONS.retention_days),
    register_command: booleanOption(source.register_command, DEFAULT_OPTIONS.register_command),
    command_name: commandNameOption(source.command_name, DEFAULT_OPTIONS.command_name),
  }
}

function toSyntheticTextPart(sessionID: string, text: string): Part {
  return {
    id: `goal-${Date.now()}`,
    sessionID,
    messageID: `goal-message-${Date.now()}`,
    type: "text",
    text,
    synthetic: true,
  }
}

function booleanOption(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function numberOption(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
}

function stringOption(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function commandNameOption(value: unknown, fallback: string): string {
  const name = stringOption(value, fallback)
  if (/^[a-z][a-z0-9-]{0,63}$/.test(name)) return name
  throw new Error(`Invalid goal command_name "${String(value)}". Expected lowercase command name matching /^[a-z][a-z0-9-]{0,63}$/.`)
}

export default GoalPlugin
