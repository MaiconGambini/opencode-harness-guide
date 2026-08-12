import type { Plugin } from "@opencode-ai/plugin"

// HARNESS_PROFILE tiers (this guard's behavior):
//   minimal  — recovery profile. Approval prompts and read-only-agent denies remain
//              active; only non-security diagnostics may be reduced elsewhere.
//   standard — (default when unset) same runtime permission enforcement.
//   strict   — same permission enforcement; stricter risky-read blocking lives in
//              harness-security-guard.ts.
//
// No environment variable disables approval or deny rules.

// H8: per-agent permissions.
//
// API outcome — the `config` hook receives only the global OpenCode `Config`
// (no agent identity), and it runs once at load, so agent-scoped defaults cannot
// be expressed there. `permission.ask` (`Permission`) and `tool.execute.before`
// ({ tool, sessionID, callID }) also carry NO agent field. Agent identity is only
// exposed on `chat.message`/`chat.params` (keyed by sessionID). We therefore bridge
// the two: record sessionID -> agent as messages arrive, then enforce per-agent
// rules inside `permission.ask` by looking the agent up from that session map.
//
// Rule model, applied ON TOP of the global defaults from the config hook:
// review/advisory agents are read-only (write/deploy-style bash denied). All other
// active capabilities fall through to the global default unchanged.
//
// FINAL-R1 (objective 6): this roster is the runtime backstop for the read-only blocks in
// opencode.jsonc — config is not live until an OpenCode restart, the plugin is. Every agent
// whose config block denies `edit` must appear here, or a restart gap lets it run
// write/deploy bash with no denial. The generic legacy names ("reviewer", "advisor", "plan",
// "planner") stay because other projects' configs use them.
export const READ_ONLY_AGENTS = new Set([
  // legacy generic names
  "reviewer",
  "advisor",
  "plan",
  "planner",
  // opencode.jsonc read-only blocks (parity is asserted in tests/plugin-foundation.test.ts)
  "code-reviewer",
  "architecture-reviewer",
  "security-analyst",
  "plan-architect",
  "architecture-advisor",
  "system-design-advisor",
  "requirements-interrogator",
  "design-patterns-advisor",
  "design-director",
  "explorer",
  "refiner",
  "rule-verifier",
])

// Bash command shapes that mutate state / deploy — denied for read-only agents.
const writeOrDeployBash = [
  /\b(rm|mv|cp|chmod|chown|mkdir|touch|dd|truncate)\b/i,
  /\bgit\s+(push|commit|reset|clean|rebase|merge|tag)\b/i,
  /\b(npm|pnpm|yarn|uv|pip|cargo)\s+(publish|install|add|remove)\b/i,
  /\b(docker|kubectl|helm|terraform|ansible|serverless|vercel|netlify|flyctl|heroku)\b/i,
  /\b(remove-item|set-content|out-file|new-item)\b/i,
  />>?/,
]

const approvalBashPatterns = [
  "git push", "git push *", "git * push *",
  "git -C * push", "git -C * push *", "git -C* push", "git -C* push *",
  "git --git-dir * push", "git --git-dir * push *", "git --git-dir=* push", "git --git-dir=* push *",
  "git --work-tree * push", "git --work-tree * push *", "git --work-tree=* push", "git --work-tree=* push *",
  "npm install", "npm install *", "npm i", "npm i *", "npm ci", "npm ci *", "npm uninstall *", "npm update", "npm update *", "npm publish *",
  "pnpm add *", "pnpm remove *", "pnpm update *", "pnpm install", "pnpm install *", "pnpm i", "pnpm i *", "pnpm publish *",
  "yarn add", "yarn add *", "yarn remove *", "yarn upgrade *", "yarn install", "yarn install *", "yarn publish *",
  "bun add", "bun add *", "bun remove *", "bun update *", "bun install", "bun install *", "bun publish *",
  "pip install *", "pip uninstall *", "uv add *", "uv remove *", "uv sync *",
  "cargo add *", "cargo remove *", "cargo update *", "cargo install *", "cargo publish *",
  "docker *", "kubectl *", "helm *", "terraform *", "ansible *", "serverless *",
  "vercel *", "netlify *", "flyctl *", "heroku *",
]

const sessionAgents = new Map<string, string>()

export default (async () => {
  return {
    config: async (cfg) => {
      cfg.permission ??= {}
      cfg.permission.bash ??= { "*": "ask" }
      const bashPermissions = cfg.permission.bash as Record<string, "ask" | "deny" | "allow">
      for (const pattern of approvalBashPatterns) bashPermissions[pattern] = "ask"
      cfg.permission.external_directory = "ask"
    },
    // Record which agent owns each session so permission.ask can scope decisions.
    "chat.message": async (input: { sessionID: string; agent?: string }) => {
      if (input.agent) sessionAgents.set(input.sessionID, input.agent)
    },
    "permission.ask": async (
      input: { type: string; pattern?: string | Array<string>; sessionID: string },
      output: { status: "ask" | "deny" | "allow" },
    ) => {
      const agent = sessionAgents.get(input.sessionID)
      if (!agent) return
      if (READ_ONLY_AGENTS.has(agent) && isWriteOrDeployBash(input)) {
        output.status = "deny"
        return
      }
    },
  }
}) satisfies Plugin

function isWriteOrDeployBash(input: { type: string; pattern?: string | Array<string> }): boolean {
  if (input.type !== "bash") return false
  const patterns = Array.isArray(input.pattern) ? input.pattern : input.pattern ? [input.pattern] : []
  return patterns.some((pattern) => writeOrDeployBash.some((rule) => rule.test(pattern)))
}
