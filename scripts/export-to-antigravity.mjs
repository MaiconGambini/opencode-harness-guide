#!/usr/bin/env node
// export-to-antigravity.mjs — port the OpenCode harness into Antigravity **IDE** artifacts.
//
// VERIFIED against the IDE itself (created a workflow via the UI and inspected disk + the
// language_server_windows_x64.exe strings). The IDE's ONLY per-directory user customization is
// WORKFLOWS; rules come from a global GEMINI.md. There is NO global_skills/global_agents/
// global_hooks/global_mcp for the IDE — those dirs are ignored (they are 2.0/CLI features).
//
//   ~/.gemini/config/global_workflows/<name>.md   # slash commands (Customizations → Workflows)
//        format:  ---\n name: <name>\n description: <text>\n ---\n\n <prompt body>
//   ~/.gemini/GEMINI.md                            # global Rule (Customizations → Rules)
//
// So the harness in the IDE = the global Rule (discipline) + one workflow per OpenCode command.
// Workflow bodies are self-contained prompts, because the IDE does NOT load skills.
//
// Modes:
//   node scripts/export-to-antigravity.mjs             # BUILD -> antigravity/config/ (in-repo)
//   node scripts/export-to-antigravity.mjs --install   # + copy to ~/.gemini and CLEAN stale
//   node scripts/export-to-antigravity.mjs --install --target "D:\dir\.gemini\config"
//   ...--install --no-clean

import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, "..")
const SRC = path.join(REPO, "antigravity")
const OUT = path.join(SRC, "config")

const argv = process.argv.slice(2)
const doInstall = argv.includes("--install")
const doClean = !argv.includes("--no-clean")
const tIdx = argv.indexOf("--target")
const installTarget = tIdx >= 0 ? argv[tIdx + 1] : path.join(os.homedir(), ".gemini", "config")

const CHAR_LIMIT = 12000
const warnings = []

function readJsonc(file) {
  const raw = fs.readFileSync(file, "utf8")
  return JSON.parse(raw.split("\n").map((l) => (/^\s*\/\//.test(l) ? "" : l)).join("\n"))
}
const ensureDir = (d) => fs.mkdirSync(d, { recursive: true })
function write(file, c) { ensureDir(path.dirname(file)); fs.writeFileSync(file, c) }
function copyDir(from, to) {
  ensureDir(to)
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name)
    if (e.isDirectory()) copyDir(s, d)
    else if (e.isFile()) fs.copyFileSync(s, d)
  }
}
const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }) } catch { /* best effort */ } }
function yamlEscape(s) { return JSON.stringify(String(s)) }  // safe double-quoted YAML scalar

// --- workflows -> config/global_workflows/<name>.md ------------------------
function buildWorkflows(config) {
  const cmds = config.command ?? {}
  const outDir = path.join(OUT, "global_workflows")
  ensureDir(outDir)
  let n = 0
  for (const [name, cmd] of Object.entries(cmds)) {
    const desc = (cmd.description ?? "").replace(/\s+/g, " ").trim()
    const body = (cmd.template ?? "").trim()
    // IDE format: name + description frontmatter, then the prompt body.
    const out = `---\nname: ${name}\ndescription: ${yamlEscape(desc)}\n---\n\n${body}\n`
    write(path.join(outDir, `${name}.md`), out)
    if (out.length > CHAR_LIMIT) warnings.push(`workflow /${name} is ${out.length} chars > ${CHAR_LIMIT} — may be truncated`)
    n++
  }
  return n
}

function copyRule() {
  const gm = path.join(SRC, "GEMINI.md")
  if (!fs.existsSync(gm)) { warnings.push("antigravity/GEMINI.md missing"); return }
  fs.copyFileSync(gm, path.join(OUT, "GEMINI.md"))
  if (fs.readFileSync(gm, "utf8").length > CHAR_LIMIT) warnings.push(`GEMINI.md > ${CHAR_LIMIT} chars (rule limit)`)
}

function install() {
  const target = installTarget                 // ~/.gemini/config
  const geminiRoot = path.dirname(target)        // ~/.gemini
  ensureDir(target)

  if (doClean) {
    // remove everything an earlier (wrong) install put under config/ that the IDE ignores.
    // NEVER touch Antigravity's own files (config.json, .migrated, projects, sidecars) or the
    // user's own UI-created workflows.
    for (const rel of ["workflows", "skills", "agents", "scripts", "hooks.json", "mcp_config.json",
                        "SKILLS-MANIFEST.txt", path.join("plugins", "opencode-harness")]) {
      rmrf(path.join(target, rel))
    }
  }

  copyDir(path.join(OUT, "global_workflows"), path.join(target, "global_workflows"))
  const gm = path.join(OUT, "GEMINI.md")
  if (fs.existsSync(gm)) fs.copyFileSync(gm, path.join(geminiRoot, "GEMINI.md"))
  return { target, geminiRoot }
}

// --- run --------------------------------------------------------------------
const config = readJsonc(path.join(REPO, "opencode.jsonc"))
rmrf(OUT); ensureDir(OUT)
const nWorkflows = buildWorkflows(config)
copyRule()

console.log(`BUILD -> ${path.relative(REPO, OUT)}  (Antigravity IDE model: Rules + Workflows only)`)
console.log(`  workflows: ${nWorkflows}  (config/global_workflows/ — /plan, /prevc, …)`)
console.log(`  rule:      GEMINI.md`)

if (doInstall) {
  const { target, geminiRoot } = install()
  console.log(`\nINSTALL -> ${target}`)
  console.log(`  global_workflows/ -> ${path.join(target, "global_workflows")} (${nWorkflows} files)`)
  console.log(`  GEMINI.md -> ${path.join(geminiRoot, "GEMINI.md")}`)
  if (doClean) console.log(`  cleaned IDE-ignored artifacts: workflows/, skills/, agents/, hooks.json, mcp_config.json, scripts/, plugins/opencode-harness/`)
  console.log(`  NEXT: restart the IDE → Customizations → Workflows lists /plan, /prevc, …; type /plan in Agent.`)
}

if (warnings.length) {
  console.log(`\nWARNINGS (${warnings.length}):`)
  for (const w of warnings) console.log(`  ! ${w}`)
}
