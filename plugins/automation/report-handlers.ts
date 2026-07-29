import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import { automationRecordSummary } from "./execution-store.ts"
import { reportJobTypes, type ReportEvidence, type ReportHandler, type ReportHandlerContext, type ReportJobType } from "./definitions.ts"

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

async function countFiles(directoryPath: string, predicate: (entry: string) => boolean): Promise<number> {
  let entries: string[]
  try {
    entries = await readdir(directoryPath)
  } catch {
    return 0
  }
  return entries.filter(predicate).length
}

const handlers: Record<ReportJobType, ReportHandler> = {
  "security-report": {
    jobType: "security-report",
    async run(context: ReportHandlerContext): Promise<ReportEvidence> {
      const [configurationPresent, policyPresent, securityPluginPresent] = await Promise.all([
        fileExists(path.join(context.globalRoot, "opencode.jsonc")),
        fileExists(path.join(context.globalRoot, "docs", "governance", "dangerous-command-policy.md")),
        fileExists(path.join(context.globalRoot, "plugins", "harness-security-guard.ts")),
      ])
      return {
        kind: "report",
        metrics: { configurationPresent, policyPresent, securityPluginPresent },
      }
    },
  },
  "context-report": {
    jobType: "context-report",
    async run(context: ReportHandlerContext): Promise<ReportEvidence> {
      const [globalSkillDirectories, globalPlugins] = await Promise.all([
        countFiles(path.join(context.globalRoot, "skills"), () => true),
        countFiles(path.join(context.globalRoot, "plugins"), (entry) => /\.(ts|js)$/.test(entry)),
      ])
      return {
        kind: "report",
        metrics: { globalSkillDirectories, globalPlugins },
      }
    },
  },
  "status-report": {
    jobType: "status-report",
    async run(context: ReportHandlerContext): Promise<ReportEvidence> {
      const [configurationPresent, automationDirectoryPresent] = await Promise.all([
        fileExists(path.join(context.globalRoot, "opencode.jsonc")),
        fileExists(path.join(context.globalRoot, "state", "automation")),
      ])
      return {
        kind: "report",
        metrics: { configurationPresent, automationDirectoryPresent, reportHandlers: reportJobTypes.length },
      }
    },
  },
  "retention-report": {
    jobType: "retention-report",
    async run(context: ReportHandlerContext): Promise<ReportEvidence> {
      const summary = await automationRecordSummary(context.globalRoot, 30 * 24 * 60 * 60 * 1000)
      return { kind: "report", metrics: summary }
    },
  },
}

export function reportHandler(jobType: ReportJobType): ReportHandler {
  return handlers[jobType]
}
