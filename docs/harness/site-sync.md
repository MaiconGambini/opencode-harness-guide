# Site Sync — propagating the harness to the portable package and the public guide

Checklist, not automation. Publishing is an operator action (invariant 15 and `spec-lead.md`'s
boundaries, unchanged): this document produces the diff and the checklist; the operator pushes.

## Why this exists

Two propagation paths exist, and both must carry the same harness:

1. **The portable package** — `scripts/export-opencode-harness.ps1` + `scripts/install-opencode-harness.ps1`.
2. **The public guide** — `github.com/MaiconGambini/opencode-harness-guide`, which mirrors the
   harness (`agent/`, `skills/`, `templates/`, `scripts/`, `plugins/`, `opencode.jsonc`, `tests/`)
   and publishes a Docusaurus site under `website/` to GitHub Pages.

If only the first is updated, an install elsewhere produces the new skills and templates with the
**old** reviewer prompts — every ticket installed and none of it working. If only the second is
updated, the site documents what the package does not ship.

## The manifest is the single source of what travels

`scripts/harness-manifest.json` is the shared manifest, read by **both**
`scripts/export-opencode-harness.ps1` and `scripts/install-opencode-harness.ps1` — the include
list, the public-subset exclusions, and the assertions all live there. The code half of this
sync is driven from that same manifest — export, then apply what the export produced. Adding a
file to v1.4 updates both paths at once. Do not maintain a second list.

The manifest must stay in lockstep between the private source
(`~/.config/opencode/scripts/harness-manifest.json`) and this public repo
(`scripts/harness-manifest.json`) — step 0 below keeps them identical.

## Public subset policy — what the guide and the package never carry

The public mirror ships a curated subset. Three classes are excluded, declared in
`scripts/harness-manifest.json` (`exclude` + `routingCheck`) and **machine-checked**:

1. **Offensive skill families and exact exclusions** — any skill matching the four prefix
   families `recon-`, `redteam-`, `hiagosh-`, `chains-`, plus the exact excluded skills
   `auth-saml-sso-attack`, `infra-docker-privesc`, `obsidian`, and `setup-matt-pocock-skills`.
   The exported zip and the guide's `skills/` must not contain them.
2. **Local runtime evidence and docs** — gate reports (`docs/harness/quality/`) and dated
   review notes (`docs/harness/review/`) never leave the private source.
3. **Agent routing to excluded skills** — routing checks cover both `agent/*.md` and
   `skills/*/SKILL.md`: neither may reference the excluded families or exact skills (no
   silent hop from a public agent to a skill the public package does not ship).

Enforcement is layered so a violation fails loudly instead of drifting:

- **Export** (`scripts/export-opencode-harness.ps1`) throws on any violation in staging —
  it refuses to produce a zip that cannot be mirrored.
- **CI** (`.github/workflows/validate-harness.yml`, public-subset step) blocks the guide repo
  itself: same manifest, same checks, run on every harness change.
- **CI lives in the guide repo only.** The private source intentionally has no `.github/`
  (recorded U-FINAL-R1, 2026-08-12: the workflow exists only in the guide, never in the
  source tree or its git history); the source runs the same machine checks locally via the
  export script's staging checks. Do not recreate the workflow here — keep
  `validate-harness.yml` in the guide.
- **Install** asserts the shipped contract on the target (see post-install assertion below).

Legitimate curated public skills are never deleted by this policy: `skills/wstg-*` (OWASP
WSTG checklists) and the defensive `*-security-coder` / `harness-security-scan` skills stay.

## Code half — the guide repo's harness content

0. **Keep the manifest in lockstep first.** This lane's fixes (the manifest, both scripts,
   `agent/security-analyst.md`, `agent/spec-lead.md`, this file, and
   `docs/governance/orcagraphengineer.md`) must be copied back into the private source
   `~/.config/opencode/` **before** the next export — export reads the source tree and now
   fails loudly if the source agent files still route to excluded families. Copy both ways,
   never drift.
1. **Export.** `& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"` —
   pass `-OutputPath` when you want a review copy instead of the default zip.
2. **Unpack** the zip into a review directory.
3. **Review the diff** against the guide repo's current tree (`agent/`, `tests/`,
   `docs/harness/`, `skills/`, `templates/`, `scripts/`, `plugins/`, `opencode.jsonc`,
   `package.json`). The export script asserts the v1.3 content at staging time — it refuses to
   ship a package whose `agent/code-reviewer.md` lacks the typed-findings contract — so a diff
   that is missing it is a broken export, not a choice. It also runs the public-subset machine
   check above, so an export with an excluded family is a policy violation, not a choice.
4. **Apply** the manifest entries to the guide repo. Never copy `node_modules`.
5. **Test.** `npm test` in the guide repo. It has its own `tests/` and `package.json`, so this is
   a real coherence check on the propagated code — use it.
6. **Post-install assertion** on any target machine is now automated in the install script
   (same manifest assertions, asserted on the target after copy). The manual equivalent,
   asserting content not presence:

   ```powershell
   $reviewer = "$env:USERPROFILE\.config\opencode\agent\code-reviewer.md"
   if (-not (Select-String -LiteralPath $reviewer -Pattern "Typed Findings" -Quiet)) {
       throw "typed-findings contract missing after install"
   }
   ```

## Docs half — website/

Canonical site: the guide repo's `website/` tree; the source repo has no `website/` and must not recreate one.
New or updated pages, in the site's existing bilingual register (pt-BR default, `en` locale):

| Page | Content |
|---|---|
| the harness overview | the 5 layers gain the behaviour loop; §12's measured gate is joined by §13's Refine phase |
| a new v1.3 page | what `/refine` is, the one-stop flow, the write-authority table, the rule lifecycle, and the honest cadence table |
| the quality page | the new metric rows and what each proves — **and what adherence does not prove** |
| the agents page | `refiner` added; `code-reviewer` moves to `bash: deny`; the model matrix corrected |

Two things the site must not do:

- **No numbers.** Cite `agent-os/quality-thresholds.json` by key. A published threshold is the
  same drift as a threshold in prose, with a wider audience.
- **No claim of measured gain.** The score projections are projections. If they appear at all
  they are labelled as such, with the weights shown so a reader can disagree with them.

## Verification

- [ ] This file (`docs/harness/site-sync.md`) is byte-identical between the private source
      (`~/.config/opencode/`) and the guide repo — verify with SHA-256 before publishing.
- [ ] The export output contains `agent/`, `tests/` and `docs/harness/`.
- [ ] The export output contains no excluded skill family, no `docs/harness/quality/`,
      no `docs/harness/review/`, and no agent routing to excluded families (the script
      throws otherwise — verify the throw fires by running it once against a tree that
      violates the policy).
- [ ] The public-subset step of `validate-harness.yml` passes on this repo's tree.
- [ ] A fresh install into a scratch directory produces reviewer prompts **containing** the
      typed-findings contract — assert the content, not the file's presence (the install
      script now does this itself).
- [ ] `npm test` passes in the guide repo after the code half is applied.
- [ ] `npm --prefix website start` builds; every new page renders; internal links resolve.
- [ ] Grep the new website pages for digit-bearing threshold statements — none.
- [ ] No push, no deploy, no remote git performed by the lane. The completion note hands the
      operator the exact commands to run.

## Operator commands — deferred, never run by this lane

```powershell
# Step 0 — sync this lane's fixes back into the private source BEFORE the next export:
#   scripts/harness-manifest.json, scripts/export-opencode-harness.ps1,
#   scripts/install-opencode-harness.ps1, agent/security-analyst.md, agent/spec-lead.md,
#   docs/harness/site-sync.md, docs/governance/orcagraphengineer.md
#   (copy from this repo into $env:USERPROFILE\.config\opencode\)

# Code half — after reviewing the exported diff (run from this repo's root, any location)
npm ci
npm run typecheck
npm test

# Docs half — website/ in the bilingual register (pt-BR + en)
npm --prefix website start

# Publish — operator action, never automatic
git add -A
git commit -m "sync harness v1.4"
git push
npm --prefix website run deploy
```
