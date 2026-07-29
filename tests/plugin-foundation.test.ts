import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test, type TestContext } from "node:test"
import { canCompleteGoal } from "../plugins/goal/evidence-policy.ts"
import { buildGoal } from "../plugins/goal/goal-record.ts"
import { createGoalStore } from "../plugins/goal/goal-store.ts"
import { sanitizeText } from "../plugins/goal/sanitization.ts"

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
