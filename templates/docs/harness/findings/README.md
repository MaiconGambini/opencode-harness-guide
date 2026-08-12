# Findings — the trajectory window

Append-only record of what reviewers and the operator actually objected to, one file per review pass:
`YYYY-MM-DDTHH-MM-SS-<label>.json`.

It exists because the quality gate measures the **artifact** and never the **agent**. A model producing
green metrics while ignoring a project convention leaves no trace anywhere else, so the next session
repeats it. These files are that trace, and they are the only input the Refine phase reads about agent
behaviour.

Reasoning: `~/.config/opencode/docs/harness/continual-harness.md`. Every governing number lives in
`agent-os/quality-thresholds.json#learned_rules` — never here, and never in prose.

## Who writes this

**Reviewers return records; they never write.** `code-reviewer` and `architecture-reviewer` run with
`edit: deny` **and `bash: deny`** — the second matters, because the write-shaped bash deny-list is by
enumeration and misses interpreter-eval shapes like `node -e`.

The **scheduler** validates the records it received and writes them here, **write-once per run label**,
exactly as it already writes the gate report and the commit. One writer per file, unchanged from v1.2.

## Envelope

```json
{
  "run": {
    "label": "scheduler",
    "session": "2026-08-12T09-14-02-scheduler",
    "spec": "agent-os/specs/<slug>",
    "tier": "full",
    "sampled_files": null,
    "gate_report": "docs/harness/quality/<file>.json",
    "gate_source_hash": "90b8d430ff7e3e56",
    "base": "<merge-base sha>"
  },
  "roster": [
    { "reviewer": "code-reviewer", "model": "opencode-go/deepseek-v4-flash", "files": 14, "sample": false },
    { "reviewer": "code-reviewer", "model": "openai/gpt-5.6-sol", "files": 14, "sample": true }
  ],
  "manifest": { "lanes": [{ "lane": "T02", "capability": "vue-engineer",
                            "model": "opencode-go/deepseek-v4-flash",
                            "ownership": ["src/stores/compare.ts"], "changed_lines": 214 }] },
  "findings": [ /* records */ ]
}
```

Four fields carry the weight:

- **`gate_source_hash`** binds the window to a real run **by value**. A filename does not: the report
  directory is listable, so copying a name costs nothing, and unlike the gate report a findings file has
  neither a content binding nor a direction constraint. The newest file's hash must match the evaluated
  report exactly; an older file's hash must be findable in a commit trailer.
- **`roster`** is what makes an empty result honest. `findings: []` **with** a roster is a genuine zero.
  Without one it is the `rows: []` bug one layer up — a measured zero that reads as a pass while nothing
  was measured. **No roster → `unavailable`.**
- **`tier` + `sampled_files`** — at tier `sampling` reviewers see a subset, so counts across tiers mix
  populations. Comparison is valid only within a tier, and the adapter refuses otherwise. Tier `full`
  with no findings file, or tier `auto` with one, rejects the window.
- **`manifest`** is the only source for a record's `lane` / `capability` / `model` / `changed_lines`.
  There is **no git-visible lane boundary** — the dual review runs once over the whole diff and every lane
  lands in one scheduler commit. Without the manifest a reviewer would be guessing.
- **`run.session`** names the session a pass belongs to (SEC-R1). The propose bar's D7 condition counts
  **distinct evidence sessions**, so one bad session cannot legislate a rule. When a writer omits
  `session`, `run.label` stands in, and a file with neither is its own session — the identity is
  deterministic and identical for every rule, so evidence cannot be relabelled per rule.

## Record shape

```json
{
  "id": "f-147",
  "file": "src/composables/useParts.ts",
  "line": 42,
  "class": "rule_violation",
  "rule": "agent-os/standards/vue.md#server-state-in-store",
  "severity": "major",
  "lane": "L2",
  "capability": "fixer",
  "model": "opencode-go/deepseek-v4-flash",
  "changed_lines_in_lane": 214,
  "summary": "server state held in a composable ref instead of the store"
}
```

### `class` — the field the whole design rests on

| Class | Means | Requires `rule` |
|---|---|---|
| `rule_violation` | a written rule was broken | **yes** — must resolve to a real line |
| `operator_note` | the operator recorded a hand fix via `/refine --note` | no |
| `blind_spot` | a real problem no rule covers yet | no |
| `defect` | a bug the gate could have measured but did not | no |
| `nit` | preference, no rule behind it | no |

**A reviewer that cannot cite the rule must downgrade to `blind_spot` or `nit`.** That requirement is what
separates a measured signal from an opinion: `rule_violation` is countable precisely because every
instance points at text that exists.

`harness-findings.mjs` resolves the pointer against the file on disk, by heading or rule `id` — **never
fuzzily**. A pointer resolving to "something similar" manufactures evidence. An unresolvable pointer is a
rejected record counted in `unciteable_findings_ratio`. `AGENTS.md` is not a valid target; it belongs to
`harness-project-calibration`.

**What "exactly" means.** The anchor must equal, character for character:

- the GitHub-style slug of a heading in the target file — `## Server State in Store` is
  `server-state-in-store`; or
- an explicit marker line the rulebook author wrote — `<!-- anchor: server-state-in-store -->`,
  `<!-- rule: vue-002 -->`, or `<a id="server-state-in-store">`.

A heading that *looks* like the anchor but is not identical (`## Server State in Stores` vs
`server-state-in-store`) is rejected. The resolver returns the matched line number, so a cited rule always
points at a real line.

### `summary` is the reviewer's own words

Never a quote or paraphrase of diff content. Content in a diff may be written to influence a reader, the
summary is read by the Refiner, and the Refiner's output can become durable rule text that is then pasted
into every matching write-capable lane's prompt. Every field originating in a diff passes `redact()`
before it is written.

### Weighting

`operator_note` and `defect` outweigh a reviewer finding (`operator_note_weight`, `defect_weight`). The
operator's own words are not a model's guess at them, so one clears the weighted bar — arithmetic, not a
special case.

**The propose bar has two conditions (D7).** The weighted minimum (`min_findings_to_propose`) AND the
distinct-session minimum (`min_sessions_to_propose`) must both be met — `meetsProposeBar(weighted, config,
sessions)` with `sessions` from `distinctEvidenceSessions(window, rule)`. One session's worth of evidence,
however heavy, cannot legislate a rule; omitting the session count fails closed.

**Note what this is not.** An earlier draft inferred operator corrections from git history. That does not
work here: only the scheduler commits, so every commit carries the operator's identity, and an uncommitted
edit has no author at all — a lane's leftover write is indistinguishable from a correction, and at weight 3
one misattribution legislates a rule. The explicit `--note` replaced it.

## What these files are not

- **Not a measure of how much the agent actually violated.** They count what a reviewer *detected*. Recall
  and citation competence are estimated by the periodic paid-reviewer sample; until that runs, treat the
  counts as a **floor**, never a rate.
- **Not a verdict.** They carry no vote in the Judge phase. A rule learned by machine influences the next
  run's prompts, never this run's approval — and a prose rule can never block at all.
- **Not editable.** Correcting a record means appending a new one; the history is the evidence.

## Excluded from two things, for two different reasons

- **From `sourceHash`** — findings are written after the gate runs, so inside the hash every write would
  stale the fresh report and refuse the commit trailer. The rest of the rulebook stays **inside** the hash;
  the ordering (prose after the code commit) is what makes that survivable.
- **From `--check-sources`** — a reviewer `summary` mentioning a line count would otherwise fire the
  prose-threshold patterns and break invariant 13's own check.

## Validation — `harness-findings.mjs`

The script validates, reads, and counts; it never judges a record's merit. Exit codes are the gate's own
discipline: `0` valid · `1` invalid · `2` script blocker.

| Command | Checks | Exit |
|---|---|---|
| `--validate <file>` | record schema per this README, `rule` pointers resolved exactly, `lane`/`capability`/`model`/`changed_lines_in_lane` against the envelope's lane manifest (never against git) | 0/1/2 |
| `--validate-ledger <file>` | `text` single-line, no control characters, no fenced blocks, no headings, within `rule_text_max_chars` — and the **same constraints on `example.right`/`example.wrong`** (SEC-R1); `target` must be a repository-relative `.md` path inside the **constant** allowlist `agent-os/standards/` — the ledger may carry it verbatim but cannot widen, empty or reorder `targets_allowed`, and dot-dot / absolute / non-`.md` / `AGENTS.md` targets are rejected (SEC-R1); a code example only in its own `example` field; **D21:** a `prose` rule approved by `rule-verifier` must carry `provenance.verifier_report`, the config toggle `auto_activate_prose_observe: true`, a non-`high_risk_path` target, non-empty `source_findings`, complete stats and session-compatible `first_seen`/`approved_at`/`created_at_run` (SEC-R1) | 0/1/2 |
| `--window <n> [--json]` | grouped counts for the newest `n` files; derived counts use only the newest available file's tier — other tiers are excluded and the exclusion is stated (`tier`/`crossTierExcluded` in JSON and text); malformed files are reported, never dropped; no roster → `unavailable`, never 0 | 0 (2 = script blocker) |

Every invocation first range-checks `quality-thresholds.json#learned_rules` (the governing knobs live in
the guarded file, never here — D11). Out of range — or a knob with no range row in the script — is **exit 2,
never a silent default** (review B12): `operator_note_weight: 0`, `max_active_rules_per_target: 99999`, and
`recall_sample_every_n_runs` above `floor(stage1_window_runs / citation_competence_min_samples)` are all
blockers. `--json` is machine-readable for the stage-2 adapter.

The window is bound **by value**: the newest file's `gate_source_hash` must equal the evaluated report's
`sourceHash` exactly; an older file's hash must appear in a commit trailer (`Source-Hash:`). Presence must
match the tier — `full` with no file, or `auto` with one, rejects the window — and a file without a
`roster` is `unavailable`, never an honest zero.

**The window is an observation command.** `--window` exits `0` even when a file is malformed or
rosterless — the file is represented in the output (`files`), never silently dropped, so a bad file
cannot masquerade as a clean window and a clean window cannot be forced red by one bad file. Exit `2`
is reserved for script blockers: an out-of-range knob or a bad argument. (`0/1/2` above applies to the
validate commands; the window never exits `1`.)

**Counts never mix tiers (T07 §6, A18).** At tier `sampling` reviewers see a subset, so aggregating
files of different tiers would mix populations. Every derived output — `byRule`, `byAgent`,
`unciteableRatio`, and the `proposeBar` block the Refine phase consumes — counts only the newest
**available** file's tier, the same population the adherence adapter counts. JSON emits the anchor
`tier` and a `crossTierExcluded` block (`count`, per-file `files` entries with reasons, and a
`reason`); text prints the same. An older different-tier finding can never change counts, weights,
distinct sessions or eligibility. When no countable file records a tier, the counts are refused
(`tier: null`, `crossTierExcluded` stating why) rather than guessed.

**Git access is argv-only.** Every git invocation runs under `--literal-pathspecs`, so a path list derived
from ticket markdown cannot be silenced by pathspec magic (`:!*`, `:(exclude)`, a leading `:`). A path
entry starting with `:` is a **reported refusal**, never a skip, and every entry must resolve inside the
repository. Files are read to locate things only through `lstat` → regular-file → `realpath`-inside-root
discipline: a symlink to `~/.ssh/id_rsa` is skipped, not read. Any text that travels onward (summaries,
messages) passes `redact()`.
