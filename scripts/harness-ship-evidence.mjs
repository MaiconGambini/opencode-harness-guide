// harness-ship-evidence — puts the numbers into the commit and the PR.
//
// It also IS the commit gate: --commit-trailer refuses to emit on a missing, stale, red, or
// unreviewed change, so a compliant commit message cannot be composed without one. That is how
// "commits approved only with a decent quality gate" becomes structural instead of a rule
// someone remembers.
//
// HARD BOUNDARY: this script only prints. No git commit, no push, no PR creation, no branch or
// remote operation. Those stay operator actions (v1.1 invariant 5). "Merge automatico" from the
// whiteboard means nobody reads the diff — never that nobody presses the button.

import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  makeGit,
  readJsonIfExists,
  readTextIfExists,
  redact,
  resolveInsideRoot,
  REPORT_DIR,
  REVIEW_DIR,
  sourceHash,
  THRESHOLDS_PATH,
} from "./harness-quality-core.mjs"
import { assessReport, route, TIER } from "./harness-risk-router.mjs"
import { pathExists } from "./harness-common.mjs"

const REVIEW_MD = path.join("docs", "review.md")

// Match the mode from the PARSED report, not the filename: substring matching accepted
// `...-local-full-lane.json` (a local run whose label starts with "full") as a full report.
export function findReport(root, mode) {
  const dir = path.join(root, REPORT_DIR)
  if (!pathExists(dir)) return null
  const names = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .reverse()
  for (const name of names) {
    const report = readJsonIfExists(path.join(dir, name))
    if (!report) continue
    if (mode && report.mode !== mode) continue
    return { report, file: path.join(REPORT_DIR, name) }
  }
  return null
}

// A recorded review must name the gate report it reviewed. Accepting "any file in the review
// directory" meant one review artifact, once, permanently satisfied the full-tier precondition
// for every subsequent change — for the tier where a human read is mandatory.
// A review must name the change it reviewed AND have approved it. Checking only for the source hash
// closed "a review of a different change" but left "a review that did not approve": a file saying
// REQUEST CHANGES, or a one-line stub containing the hash, satisfied the tier-`full` precondition —
// the one tier that exists to guarantee a human read and agreed.
// The decision comes ONLY from labelled verdict lines, never from prose. Scanning the whole document
// for rejection words failed on the first real review report: every one of them contains
// "Blocking issues: 0" or "0 blocking", which is a statement of APPROVAL, and a bare
// /block(ing)?/ match turned that into a refusal. Found by dogfooding this very commit.
//
// Markdown bold may wrap the label (`- **Recommendation**: PASS`), so asterisks can appear on either
// side of the separator.
const VERDICT_LINE = /^[\s\-*>|]*\**\s*(verdict|recommendation)\s*\**\s*[:=]\s*\**\s*([A-Za-z_ -]{2,40})/gim
const APPROVING_VALUE = /^(approve|approved|pass|passed|accept|accepted)\b/i
const REJECTING_VALUE = /^(request[_\s-]?changes|needs[_\s-]?discussion|block|blocked|revise|reject(ed)?|fail(ed)?)\b/i

export function reviewVerdicts(text) {
  const verdicts = []
  for (const match of String(text ?? "").matchAll(VERDICT_LINE)) {
    const value = match[2].trim()
    if (APPROVING_VALUE.test(value)) verdicts.push({ value, approving: true })
    else if (REJECTING_VALUE.test(value)) verdicts.push({ value, approving: false })
  }
  return verdicts
}

export function reviewApproves(text) {
  const verdicts = reviewVerdicts(text)
  if (verdicts.length === 0) return false
  // Any rejecting verdict anywhere wins: a document that approves one axis and rejects another has
  // not approved the change.
  return verdicts.every((verdict) => verdict.approving)
}

export function findReviewFor(root, report, explicitPath) {
  const needle = report?.sourceHash

  const judge = (text, file) => {
    if (needle && !text.includes(needle)) {
      return { found: false, reason: `review does not reference this gate report's source hash (${needle}) — a review of a different change does not count` }
    }
    if (!reviewApproves(text)) {
      return {
        found: false,
        reason: `review ${file} cites this change but records no approving verdict (expected "Verdict: APPROVE" or "Recommendation: PASS", and no REQUEST CHANGES / BLOCK)`,
      }
    }
    return { found: true, file }
  }

  if (explicitPath) {
    // Confined to the repo, exactly like `commands.coverage_artifact`. Without this an absolute or
    // `../../..` path let a never-committed file in the system temp dir satisfy the tier-`full`
    // precondition — defeating the reason the review has to live somewhere reviewable at all.
    const resolved = resolveInsideRoot(root, explicitPath)
    if (!resolved) return { found: false, reason: `--review path resolves outside the repository: ${explicitPath}` }
    if (!pathExists(resolved)) return { found: false, reason: `--review path does not exist: ${explicitPath}` }
    return judge(readTextIfExists(resolved), explicitPath)
  }

  const dir = path.join(root, REVIEW_DIR)
  if (!pathExists(dir)) return { found: false, reason: `no ${REVIEW_DIR} directory` }
  let nearest = null
  for (const name of fs.readdirSync(dir).filter((entry) => /\.md$/i.test(entry))) {
    const file = path.join(REVIEW_DIR, name)
    const verdict = judge(readTextIfExists(path.join(dir, name)), file)
    if (verdict.found) return verdict
    if (needle && readTextIfExists(path.join(dir, name)).includes(needle)) nearest = verdict
  }
  return (
    nearest ?? {
      found: false,
      reason: `no approving review in ${REVIEW_DIR} references this gate report's source hash (${needle ?? "none"})`,
    }
  )
}

// Pure: everything it needs is passed in, so the commit gate's decision is testable without a
// repository. `checkPreconditions` is the thin wrapper that gathers the inputs.
export function evaluatePreconditions({ report, reportFile, routing, currentHash, review, mode }) {
  const problems = []

  if (!report) {
    problems.push(`no ${mode}-mode gate report in ${REPORT_DIR}. Run the gate at --mode ${mode} first.`)
    return { ok: false, problems }
  }

  const assessment = assessReport(report, {
    currentHash,
    configuredMetrics: (report.rows ?? []).map((row) => row.metric),
  })
  if (!assessment.credible) problems.push(`gate report is not credible: ${assessment.reason}. Re-run the gate.`)

  for (const row of (report.rows ?? []).filter((item) => item.status === "fail")) {
    problems.push(`blocking metric red: ${row.metric} = ${row.value} (needs ${row.direction === "min" ? ">=" : "<="} ${row.threshold}).`)
  }

  // A blocking metric the gate could not measure is not a green — it is a gap exactly
  // where the commit gate would refuse. `unavailable` never fails the gate's exit code,
  // so ship-evidence must refuse on its own: a missing number is not a pass (code-review
  // W2, measured-gates: "a green exit code over N measured rows means little").
  for (const row of (report.rows ?? []).filter((item) => item.status === "unavailable" && item.mode === "blocking")) {
    problems.push(`blocking metric unavailable: ${row.metric} — the gate could not measure a metric that must block; a missing number is not a pass.`)
  }

  if (routing?.tier === TIER.FULL && !review?.found) {
    problems.push(
      `tier is full (${routing.tierReason}) and no code-review result is recorded for this change. ` +
        `${review?.reason ?? ""} Run /code-review, save it under ${REVIEW_DIR} citing the report's source hash, or pass --review <path>.`,
    )
  }

  return { ok: problems.length === 0, problems }
}

export function checkPreconditions(root, { mode = "full", reviewPath = null } = {}) {
  const git = makeGit(root)
  const thresholds = readJsonIfExists(path.join(root, THRESHOLDS_PATH))
  const found = findReport(root, mode)
  const currentHash = sourceHash(root, { git, thresholds, fresh: true })
  const review = found ? findReviewFor(root, found.report, reviewPath) : { found: false, reason: "no report" }
  // Pass the already-chosen report into the router so the trailer and the tier cannot describe
  // two different reports.
  const routing = found ? route({ root, git, thresholds, gate: assessedGate(found, currentHash) }) : route({ root, git, thresholds })

  const verdict = evaluatePreconditions({ report: found?.report, reportFile: found?.file, routing, currentHash, review, mode })
  return { ...verdict, report: found?.report ?? null, reportFile: found?.file ?? null, routing, review }
}

function assessedGate(found, currentHash) {
  const assessment = assessReport(found.report, {
    currentHash,
    configuredMetrics: (found.report.rows ?? []).map((row) => row.metric),
  })
  return { credible: assessment.credible, reason: assessment.reason ?? null, report: found.report, path: found.file }
}

// ---------------------------------------------------------------------------
// commit trailer
//
// A trailer, not prose: `git log --grep=Quality-Gate` becomes the project's quality history for
// free, and the ratchet can read baselines out of history rather than trusting one mutable field.

export function renderTrailer({ report, reportFile, routing }) {
  const value = (metric) => {
    const row = (report.rows ?? []).find((item) => item.metric === metric)
    if (!row) return null
    if (row.status === "unavailable") return "unavailable"
    if (row.value === undefined) return null
    return String(row.value)
  }

  const pairs = [
    ["line", value("line_coverage")],
    ["branch", value("branch_coverage")],
    ["cyclo", value("cyclomatic_max")],
    ["module", value("module_lines_max")],
    ["security", value("security_findings")],
    ["boundaries", value("boundary_violations")],
    ["regression", value("regression_suite")],
    ["mutation", value("mutation_kill_ratio")],
  ].filter(([, found]) => found !== null)

  const sampled = routing?.sample && !routing.sample.empty ? ` (reviewed ${routing.sample.selected.length}/${routing.sample.total} files)` : ""

  // The adherence evidence (continual harness, T07 rows), same shape as Metrics: a row
  // present but unavailable renders `unavailable`; a row the report does not carry at all
  // (e.g. a full-speed row filtered out of a local run) is omitted. `violations` maps to
  // rule_violations_enforced — the only adherence count that may ever become blocking; prose
  // violations are pinned to observe and stay in their own row. This is additional evidence,
  // never a new pass condition: --commit-trailer still refuses on a red, missing or stale gate.
  const adherence = [
    ["violations", value("rule_violations_enforced")],
    ["unciteable", value("unciteable_findings_ratio")],
    ["citation-competence", value("citation_competence")],
    ["rules-active", value("rules_active")],
  ].filter(([, found]) => found !== null)

  return [
    `Quality-Gate: ${report.verdict} (${report.mode})`,
    `Metrics: ${pairs.map(([name, found]) => `${name}=${found}`).join(" ")}`,
    `Adherence: ${adherence.map(([name, found]) => `${name}=${found}`).join(" ")}`,
    `Risk-Tier: ${routing?.tier ?? "unknown"}${sampled}`,
    `Gate-Report: ${reportFile.replace(/\\/g, "/")}`,
    `Source-Hash: ${report.sourceHash ?? "unknown"}`,
  ].join("\n")
}

// ---------------------------------------------------------------------------
// PR body

function renderMetricTable(report) {
  const header = "| Metric | Value | Threshold | Status |\n|---|---|---|---|"
  const body = (report.rows ?? [])
    .map((row) => {
      if (row.status === "unavailable") return `| ${row.metric} | – | – | unavailable — ${row.reason} |`
      const bar = `${row.direction === "min" ? "≥" : "≤"} ${row.threshold}${row.ratchet ? " (ratchet)" : ""}`
      return `| ${row.metric} | ${row.value} | ${bar} | ${row.status === "fail" ? "**FAIL**" : row.status} |`
    })
    .join("\n")
  return `${header}\n${body}`
}

function blindSpotChecklist(root) {
  const text = readTextIfExists(path.join(root, REVIEW_MD))
  if (!text) {
    return [
      "- [ ] business-logic correctness — was the *right* thing built?",
      "- [ ] race conditions / concurrency",
      "- [ ] unbounded loops or slow paths that aren't N+1 shaped",
      "- [ ] authorization logic and trust boundaries",
      "- [ ] idiomatic fit with this codebase",
      `- [ ] (no ${REVIEW_MD} in this project — install it so this list reflects what actually escapes here)`,
    ].join("\n")
  }
  const section = /##+\s*Only a human sees this([\s\S]*?)(?=\n##|$)/i.exec(text)
  const source = section ? section[1] : text
  const items = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => `- [ ] ${line.slice(2)}`)
  return items.length ? items.join("\n") : "- [ ] see docs/review.md"
}

export function renderPrBody(root, { report, reportFile, routing }) {
  const template = readTextIfExists(path.join(root, "docs", "pull-request.md"))
  const rows = report.rows ?? []
  const unavailable = rows.filter((row) => row.status === "unavailable")

  const sections = [
    "## What changed and why",
    "",
    "<!-- one paragraph: the behaviour that is different now, and the reason. Not a file list. -->",
    "",
    "## Measured",
    "",
    renderMetricTable(report),
    "",
    `Report: \`${reportFile.replace(/\\/g, "/")}\` · phase \`${report.phase}\` · verdict **${report.verdict}** · source hash \`${report.sourceHash}\``,
    "",
    ...(unavailable.length
      ? [
          `> **${unavailable.length} of ${rows.length} metric(s) unavailable** — this gate measured ${rows.length - unavailable.length} rows. A green verdict here means less than it looks. Gaps: ${unavailable
            .map((row) => row.metric)
            .join(", ")}.`,
          "",
        ]
      : []),
    "## Review depth",
    "",
    `- Tier: **${routing?.tier}** — ${routing?.tierReason}`,
    `- Risk: ${routing?.risk}${routing?.riskReasons?.length ? ` (${routing.riskReasons[0]})` : ""}`,
    `- Complexity: ${routing?.complexity?.score} (${routing?.complexity?.level})${
      routing?.complexity?.reasons?.length ? ` — ${routing.complexity.reasons.join("; ")}` : ""
    }`,
    ...(routing?.sample
      ? routing.sample.empty
        ? ["- **Sampling tier with nothing to sample** — treated as full; the whole diff needs reading."]
        : [
            `- Sampled: ${routing.sample.selected.length} of ${routing.sample.total} ${routing.sample.kind} files — ${routing.sample.selected.join(", ")}`,
            ...(routing.sample.capped ? [`- **Not sampled:** ${routing.sample.total - routing.sample.cap} files rest on green metrics.`] : []),
          ]
      : []),
    "",
    "## What the gate cannot see — please read for these",
    "",
    blindSpotChecklist(root),
    "",
    "## Rollback",
    "",
    "<!-- how to undo this if it goes wrong -->",
    "",
  ]

  const body = sections.join("\n")
  const composed = template.trim() ? `${body}\n---\n\n<!-- project template: docs/pull-request.md -->\n${template}` : body
  // The body is published; a command line or env value that leaked into a detail must not travel.
  return redact(composed)
}

// ---------------------------------------------------------------------------
// cli

function runCli() {
  const args = process.argv.slice(2)
  const valueOf = (flag, fallback) => {
    const index = args.indexOf(flag)
    return index !== -1 && args[index + 1] ? args[index + 1] : fallback
  }
  const root = path.resolve(valueOf("--project", process.cwd()))
  const mode = valueOf("--mode", "full") === "local" ? "local" : "full"
  const reviewPath = valueOf("--review", null)

  const wantsTrailer = args.includes("--commit-trailer")
  const wantsPrBody = args.includes("--pr-body")
  if (!wantsTrailer && !wantsPrBody) {
    console.error("usage: harness-ship-evidence.mjs (--commit-trailer | --pr-body) [--mode full|local] [--review <path>]")
    process.exitCode = 2
    return
  }

  let checked
  try {
    checked = checkPreconditions(root, { mode, reviewPath })
  } catch (error) {
    console.error(`harness-ship-evidence could not run: ${redact(error.message)}`)
    process.exitCode = 2
    return
  }

  if (wantsTrailer && !checked.ok) {
    console.error("harness-ship-evidence: refusing to emit a commit trailer.\n")
    for (const problem of checked.problems) console.error(`  - ${redact(problem)}`)
    console.error("\nThe refusal IS the gate: fix the cause, do not hand-write the trailer.")
    process.exitCode = 1
    return
  }

  if (wantsTrailer) {
    console.log(renderTrailer(checked))
    return
  }

  if (!checked.report) {
    console.error("harness-ship-evidence: no gate report to build a PR body from. Run the gate first.")
    process.exitCode = 1
    return
  }
  // --pr-body still renders when preconditions fail: a PR that must show a red gate is exactly
  // when the body matters most. It says so at the top.
  if (!checked.ok) {
    console.log("> ⚠️ **This change does not pass the quality gate.**\n>")
    for (const problem of checked.problems) console.log(`> - ${redact(problem)}`)
    console.log("")
  }
  console.log(renderPrBody(root, checked))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli()
