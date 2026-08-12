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

`scripts/export-opencode-harness.ps1` carries the `$include` list. The code half of this sync is
driven from that same manifest — export, then apply what the export produced. Adding a file to
v1.4 updates both paths at once. Do not maintain a second list.

## Code half — the guide repo's harness content

1. **Export.** `& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"` —
   pass `-OutputPath` when you want a review copy instead of the default zip.
2. **Unpack** the zip into a review directory.
3. **Review the diff** against the guide repo's current tree (`agent/`, `tests/`,
   `docs/harness/`, `skills/`, `templates/`, `scripts/`, `plugins/`, `opencode.jsonc`,
   `package.json`). The export script asserts the v1.3 content at staging time — it refuses to
   ship a package whose `agent/code-reviewer.md` lacks the typed-findings contract — so a diff
   that is missing it is a broken export, not a choice.
4. **Apply** the manifest entries to the guide repo. Never copy `node_modules`.
5. **Test.** `npm test` in the guide repo. It has its own `tests/` and `package.json`, so this is
   a real coherence check on the propagated code — use it.
6. **Post-install assertion** on any target machine (assert content, not presence):

   ```powershell
   $reviewer = "$env:USERPROFILE\.config\opencode\agent\code-reviewer.md"
   if (-not (Select-String -LiteralPath $reviewer -Pattern "Typed Findings" -Quiet)) {
       throw "typed-findings contract missing after install"
   }
   ```

## Docs half — website/

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

- [ ] The export output contains `agent/`, `tests/` and `docs/harness/`.
- [ ] A fresh install into a scratch directory produces reviewer prompts **containing** the
      typed-findings contract — assert the content, not the file's presence.
- [ ] `npm test` passes in the guide repo after the code half is applied.
- [ ] `npm --prefix website start` builds; every new page renders; internal links resolve.
- [ ] Grep the new website pages for digit-bearing threshold statements — none.
- [ ] No push, no deploy, no remote git performed by the lane. The completion note hands the
      operator the exact commands to run.

## Operator commands — deferred, never run by this lane

```powershell
# Code half — after reviewing the exported diff
cd "C:\Users\MaiconGambini-AfixCo\opencode-harness-guide"
npm install
npm test

# Docs half — website/ in the bilingual register (pt-BR + en)
npm --prefix website start

# Publish — operator action, never automatic
git add -A
git commit -m "sync harness v1.3"
git push
npm --prefix website run deploy
```
