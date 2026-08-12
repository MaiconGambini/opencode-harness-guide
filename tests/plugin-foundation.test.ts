import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { test, type TestContext } from "node:test"
import { canCompleteGoal } from "../plugins/goal/evidence-policy.ts"
import { buildGoal } from "../plugins/goal/goal-record.ts"
import { createGoalStore } from "../plugins/goal/goal-store.ts"
import { sanitizeText } from "../plugins/goal/sanitization.ts"
import { READ_ONLY_AGENTS } from "../plugins/harness-permission-policy.ts"

async function createTemporaryStore(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "opencode-goal-"))
  t.after(async () => rm(directory, { recursive: true, force: true }))
  return createGoalStore(join(directory, "state.json"))
}

test("sanitizeText redacts secrets and removes invisible control characters", () => {
  const result = sanitizeText("token=super-secret-value\u202E hidden")

  assert.equal(result, "[REDACTED_SECRET] hidden")
})

test("goal store persists only its injected temporary state path", async (t) => {
  const store = await createTemporaryStore(t)
  const goal = buildGoal("session-1", "Verify the temporary store", ["State is persisted"])

  await store.saveGoal(goal)

  const saved = await store.getCurrentGoal("session-1")
  assert.equal(saved?.id, goal.id)
  assert.equal(saved?.requirements[0]?.text, "State is persisted")
})

test("a goal completes only when achieved requirements link passing evidence", () => {
  const goal = buildGoal("session-2", "Verify evidence policy", ["Evidence is linked"])
  const incomplete = canCompleteGoal(goal)

  assert.equal(incomplete.ok, false)

  const complete = canCompleteGoal({
    ...goal,
    requirements: [{ ...goal.requirements[0]!, achieved: true, evidenceIds: ["evidence-1"] }],
    evidence: [{
      id: "evidence-1",
      summary: "node --test passed",
      status: "pass",
      requirementIds: ["req-1"],
      command: "node --test",
      workspace: "C:/temporary-workspace",
      exitCode: 0,
      verifier: "node:test",
      createdAt: "2026-07-23T00:00:00.000Z",
    }],
  })

  assert.deepEqual(complete, { ok: false, reason: "Automatic goal completion is disabled until trusted runtime receipts are available." })
})

// --- SEC-R4 (security M5): resolved permissions and sensitive-path guard coverage ---

const CONFIG_PATH = fileURLToPath(new URL("../opencode.jsonc", import.meta.url))

// JSONC is JSON plus `//` and `/* */` comments and trailing commas. Strip both
// string-aware: the config contains URLs like `http://127.0.0.1`, so a naive
// regex comment stripper would corrupt it.
function stripJsonc(source: string): string {
  let out = ""
  let inString = false
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!
    const next = source[index + 1]
    if (inString) {
      out += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      out += char
      continue
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1
      out += "\n"
      continue
    }
    if (char === "/" && next === "*") {
      index += 2
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1
      index += 1
      continue
    }
    if (char === "," && (next === "}" || next === "]")) continue
    out += char
  }
  return out
}

type AgentEntry = { permission?: Record<string, unknown> }

async function loadAgentConfig(): Promise<Record<string, AgentEntry>> {
  const source = await readFile(CONFIG_PATH, "utf8")
  const config = JSON.parse(stripJsonc(source)) as { agent?: Record<string, AgentEntry> }
  return config.agent ?? {}
}

test("opencode.jsonc: read-only review/advisory/recon agents deny external_directory", async () => {
  const agents = await loadAgentConfig()
  const readOnlyAgents = [
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
  ]
  for (const name of readOnlyAgents) {
    assert.equal(agents[name]?.permission?.external_directory, "deny", `${name} must deny external_directory`)
  }
})

test("opencode.jsonc: architecture-reviewer is skill-scoped to its review skill", async () => {
  const agents = await loadAgentConfig()
  assert.deepEqual(agents["architecture-reviewer"]?.permission?.skill, {
    "improve-codebase-architecture": "allow",
    "*": "deny",
  })
})

test("opencode.jsonc: security-analyst is local-only (no general egress)", async () => {
  const agents = await loadAgentConfig()
  assert.equal(agents["security-analyst"]?.permission?.webfetch, "deny")
  assert.equal(agents["security-analyst"]?.permission?.edit, "deny")
  assert.equal(agents["security-analyst"]?.permission?.bash, "deny")
  assert.equal(agents["security-analyst"]?.permission?.external_directory, "deny")
})

test("plugin roster backstops every read-only agent in opencode.jsonc, each denying webfetch (FINAL-R1)", async () => {
  const agents = await loadAgentConfig()
  const configReadOnly = Object.entries(agents).filter(([, entry]) => entry.permission?.edit === "deny")
  assert.ok(configReadOnly.length >= 12, `expected the twelve read-only blocks, found ${configReadOnly.length}`)
  for (const [name, entry] of configReadOnly) {
    assert.ok(READ_ONLY_AGENTS.has(name), `${name} must be in the plugin roster — config is not live until a restart, the plugin is the runtime backstop`)
    assert.equal(entry.permission?.webfetch, "deny", `${name} must deny webfetch explicitly — the default is not a guarantee`)
    assert.equal(entry.permission?.bash, "deny", `${name} must deny bash`)
    assert.equal(entry.permission?.task, "deny", `${name} must deny task`)
    assert.equal(entry.permission?.external_directory, "deny", `${name} must deny external_directory`)
  }
})

test("opencode.jsonc: every read-only agent denies webfetch (config-level parity)", async () => {
  const agents = await loadAgentConfig()
  const readOnlyAgents = [
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
  ]
  for (const name of readOnlyAgents) {
    assert.equal(agents[name]?.permission?.webfetch, "deny", `${name} must deny webfetch`)
  }
})

test("opencode.jsonc: implementation agents keep workspace access", async () => {
  const agents = await loadAgentConfig()
  const implementers = [
    "web-platform-engineer",
    "kotlin-engineer",
    "python-engineer",
    "vue-engineer",
    "postgres-engineer",
    "backend-infra-engineer",
    "test-automation-engineer",
    "fixer",
  ]
  for (const name of implementers) {
    assert.equal(agents[name]?.permission?.external_directory, "allow", `${name} needs external_directory for real project work`)
  }
  assert.equal(agents["spec-lead"]?.permission?.external_directory, "allow", "spec-lead is the primary scheduler")
})

async function createSecurityGuard() {
  const module = await import("../plugins/harness-security-guard.ts")
  const hooks = await module.default()
  return hooks["tool.execute.before"]
}

test("security guard blocks npm, gh, docker and git-credential stores", async () => {
  const before = await createSecurityGuard()
  const sensitivePaths = [
    "~/.npmrc",
    "C:/Users/me/.npmrc",
    "C:/Users/me/_npmrc",
    "C:/Users/me/npmrc",
    "C:/repo/project/.npmrc",
    "C:/Users/me/.config/gh/hosts.yml",
    "C:/Users/me/.config/gh/hosts.yaml",
    "C:/Users/me/.docker/config.json",
    "C:/Users/me/.git-credentials",
  ]
  for (const filePath of sensitivePaths) {
    await assert.rejects(before({ tool: "read", args: { filePath } }, {}), /sensitive path/i, `expected block for ${filePath}`)
  }
})

test("security guard keeps blocking the original sensitive surfaces", async () => {
  const before = await createSecurityGuard()
  const sensitivePaths = [
    "C:/Users/me/.env",
    "C:/Users/me/.env.local",
    "C:/Users/me/.ssh/id_rsa",
    "C:/Users/me/.aws/credentials",
    "C:/Users/me/project/mcp.json",
    "C:/Users/me/backup.pem",
  ]
  for (const filePath of sensitivePaths) {
    await assert.rejects(before({ tool: "read", args: { filePath } }, {}), /sensitive path/i, `expected block for ${filePath}`)
  }
})

test("security guard leaves ordinary project files alone", async () => {
  const before = await createSecurityGuard()
  const benignPaths = [
    "C:/Users/me/projects/app/src/main.ts",
    "C:/Users/me/projects/app/src/config.ts",
    // A repo directory named .docker that is not the auth store must not be blocked.
    "C:/repo/ci/.docker/Dockerfile",
    // Plain .config directories (this harness lives under .config/opencode) stay readable.
    "C:/Users/me/.config/opencode/opencode.jsonc",
  ]
  for (const filePath of benignPaths) {
    await assert.doesNotReject(before({ tool: "read", args: { filePath } }, {}), `expected allow for ${filePath}`)
  }
})
