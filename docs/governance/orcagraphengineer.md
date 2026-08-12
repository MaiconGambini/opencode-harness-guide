# Orca Graph Engineer — Orquestrador-Worker com Waves (v5, MVGE)

> Inspirado no workflow do @gkpacker (Graph Engineering / orchestrator-worker).
> Adaptado para **OpenCode + Orca (orquestração nativa) + Codex**, sem Linear, usando
> `feature_list.json`/specs do harness como fonte de verdade e **decision gates + criação
> de tasks wave-a-wave** como gate humano estrutural.

**Status:** MVGE **implementado** (Fase 1+2). Escopo cortado ao núcleo; confiabilidade avançada em §Deferred (adicionar só sob failure mode observado — `harnessopencode.md` §4). Orquestração CLI verificada ao vivo (task/gate lifecycle) + plumbing de worktree/terminal verificado (create/echo/rm no repo real, limpo). Modelos: orquestrador `gpt-5.6-sol`/medium, worker `gpt-5.6-luna`/xhigh. Falta só a Fase 3 (e2e ao vivo com worker Codex real + seu merge).
**Artefatos criados:** `scripts/orca-graph-dag.mjs` · `skills/orca-harness-spec-reader/` · `skills/orca-graph-engineer/` · `templates/wave-config.default.json` · `templates/wave-state.example.json` · edições em `templates/agent-os/specs/_template/tasks.md` e `skills/harness-feature-state/SKILL.md` · 4 comandos `orca-graph-*` no `opencode.jsonc`. Verificado: DAG numa fixture (waves/ciclo/profundidade), JSON válido, `npm run typecheck` verde.
**Última atualização:** 2026-07-24

---

## Fidelidade ao pedido original

O pedido foi: *replicar o fluxo de waves do gkpacker no meu opencode/orca/claude* — orquestrador lê o projeto, monta o grafo de dependências, divide em ondas, cria worktrees, 1 worker por ticket, monitora PRs, libera a próxima onda no merge; semi-auto com merge humano; troca fácil de modelo.

O v4 tinha derivado disso para um spec de confiabilidade de sistemas distribuídos (heartbeat com contagem de misses, lockfiles, reconstrução de estado corrompido, pre-flight de disco). Isso é **over-engineering para um solo founder rodando poucas waves** e contraria a regra do harness de não criar burocracia sem necessidade observada. O v5 volta ao núcleo do pedido.

---

## 0. Fundamentos do ambiente real (verificados)

- Skills `orca-cli`/`orchestration` (em `C:\Users\maiki\.agents\skills\`) são **stubs**. Surface real version-matched: `orca skills get orca-cli` / `orca skills get orchestration`. **Nunca hardcodar flag de memória.**
- `orca`, `codex`, `gh`, `git` instalados; `orca status --json` → `ok:true`, runtime+graph `ready`.
- Orquestração CLI **já disponível e verificada** (`orca orchestration task-list --json` → `ok:true`). Os toggles em Settings > Experimental são **opcionais** (visibilidade): **Agents View** + **Agent Dashboard** ajudam a acompanhar as waves; **Agent sleep** deve ficar **OFF** (pode dormir orquestrador/worker idle durante `check --wait`).
- `npm run typecheck` (tsc) e `npm test` existem na raiz `.config/opencode` (verificado).
- Template real do harness: `templates/agent-os/specs/_template/tasks.md`.

### Orca nativo substitui a construção manual

| Construir à mão | Orca nativo |
|---|---|
| DAG em script | `orca orchestration task-create --spec … [--deps <json>]` |
| Wave pronta | `orca orchestration task-list --ready --json` |
| PR-monitor `sleep` | `orca orchestration check --wait --types worker_done,escalation,decision_gate --timeout-ms <n>` |
| orchestration state | task/dispatch state do runtime + autoridade `worker_done` |
| Gate humano | `orca orchestration gate-create` / `gate-resolve` |

> **`orca orchestration run` é PROIBIDO** neste fluxo: é um loop autônomo fire-and-forget que **nunca para no gate humano de merge** — ele dispara e avança sozinho. (A criação wave-a-wave em §3 já impede que uma task dependente exista cedo; o motivo de banir `run` é o auto-avanço sem gate, não early-`ready`.) Usamos **sempre o loop manual** `task-create → dispatch --inject → check --wait → gate`.

### Correções de precisão CLI

1. Codex custom: `codex --model <modelo> -c model_reasoning_effort="<effort>"` (2 flags). `worktree create --agent codex` **não** aceita essas flags → **two-step** obrigatório.
2. `orca worktree set` **exige `--worktree <selector>`** → sempre `--worktree active`.
3. Base git das waves = repo default (`origin/main`); worktree `--no-parent`. `--no-parent` controla só a lineage; a base é escolhida omitindo `--base-branch`.
4. Encerrar terminal: `orca terminal close --terminal <handle>` ou `terminal stop --worktree …`. **Não existe `terminal kill --handle`.**
5. Two-step sem `--agent` pode abrir um **fallback shell**: mirar só o handle do agente; fechar o shell extra só após `terminal list`/`show` confirmar que é shell não usado.

---

## 1. Conceito e papéis

Feature = nó; `dependencies` = aresta. Wave 1 = features sem blocker (paralelas). Wave N+1 = features cujos blockers foram **mergeados em `main`**.

| Papel | Quem | O que faz |
|---|---|---|
| **Orquestrador** | Codex `gpt-5.6-sol` · effort medium | Lê specs → **cria tasks só da wave atual** → dispara workers → supervisiona via `check --wait` → **gate-create + PARA**. Não escreve código, não mergeia, não auto-avança. Vive **uma wave** e morre no gate (não é daemon de horas). |
| **Worker** | Codex `gpt-5.6-luna` · effort xhigh | Implementa UM ticket num worktree isolado, testa, commita, **push só em feature branch**, abre PR, seta card `in-review`, manda `worker_done`. Nunca toca `main`. |
| **Quality Gate** | Humano (você) | Revisa PR, **mergeia em `main`**, resolve o gate, roda `orca-graph-next`. |

Fonte de verdade (sem Linear): `feature_list.json` + `.specs/features/*/tasks.md` + `.specs/project/STATE.md`. Propriedade do orquestrador, no worktree principal.

---

## 2. Reconciliação com o harness (invariantes preservadas)

- **WIP=1 por worktree.** Cada worker roda 1 feature no seu checkout.
- **Sistema de registro = disco, não runtime/chat.** O estado de coordenação vive em **`<projeto>/wave-state.json` (gitignored)** (§3). `feature_list.status` permanece o enum canônico; o `wave-state.json` carrega os estados de coordenação (`dispatched|pr_open|merged`) + mapa `featureId↔orcaTaskId` + `prNumber`.
- **Push=ask preservado pela topologia.** O worker só dá push em feature branch e abre PR; **o único caminho pra `main` é o seu merge manual.** Push de branch isolada não atinge `main`, então a invariante do harness ("nada não-revisado chega em main") é preservada estruturalmente. "Rodar fora do guard" não é resolução.
- **Aprovação pré-dispatch (PREVC), sem cerimônia.** `orca-graph-plan` (read-only) mostra a wave table; você a revisa e roda `orca-graph-run --confirm` — **invocar `run` com a wave table à vista JÁ É a aprovação**. `run` sem `--confirm` só ecoa a wave table e para. (Sem comando `approve` separado nem campo `approvedWave`: era cerimônia preventiva contra um failure mode não observado.)
- **Semi-auto sem self-resume.** `run` termina no `gate-create`. Só um `orca-graph-next` invocado por você dispara a próxima wave.
- **Orquestrador descartável (com guard, não só afirmação).** Workers rodam em terminais Orca que sobrevivem à morte do orquestrador e o estado está no `wave-state.json`. Para que "re-invocável" seja real, `orca-graph-run` tem um **guard de re-attach** (§4 passo 0): antes de `task-create`, checa `wave-state.tasks` por entradas da wave atual em `dispatched`/`pr_open` e **reconecta** o `check --wait` a elas em vez de recriar. Isso, mais a idempotência do worker (§7 passo 7), cobre o crash mid-wave sem precisar do `orca-graph-resume` completo (deferido) nem de watchdog externo. Runbook manual em §Deferred.

---

## 3. Estado durável — `wave-state.json`

Resolve `--deps` (mapa `featureId↔orcaTaskId`) e persistência entre invocações.

```jsonc
{
  "schemaVersion": 1,
  "project": "<repoId>",
  "prBase": "main",
  "currentWave": 1,
  "waves": {
    "1": { "featureIds": ["feat-001","feat-002"], "status": "dispatched" },
    "2": { "featureIds": ["feat-003"], "status": "pending", "blockedByWave": 1 }
  },
  "tasks": {
    "feat-001": { "orcaTaskId":"t_ab12","worktreeId":"<repoId>::<path>","terminalHandle":"h1","prNumber":null,"status":"dispatched" },
    "feat-002": { "orcaTaskId":"t_cd34","worktreeId":"<repoId>::<path>","terminalHandle":"h2","prNumber":42,"status":"pr_open" }
  },
  "gates": { "1": "g_xyz" }
}
```

- **Criação wave-a-wave (gate estrutural):** tasks de uma wave só são criadas quando a wave vira ativa → tasks dependentes **não existem** no Orca até o merge da anterior → nunca ficam `ready` cedo. `--deps` interno é redundante (features de uma wave são independentes por definição).
- **Local:** `<projeto>/wave-state.json`, **gitignored** (durável em disco, não exige commit → não viola "nunca push em main").
- **Escrita atômica:** write no `wave-state.json.tmp` → validar parse → **`fs.renameSync(tmp, dest)`** (Node — no Windows sobrescreve atomicamente via MoveFileEx; `rename` cru de outras runtimes falha sobre arquivo existente no win32). Único item de "confiabilidade" no core. **Sem `.bak`** — o write-rename já é a proteção contra corrupção mid-write; backup/reconstrução ficam no §Deferred.
- **`wave-state.tasks[].status` é cache, não verdade.** Autoridade de merge = GitHub (`gh pr view … state=MERGED`); autoridade de worker = `worker_done` do runtime Orca. Nunca confiar num `"merged"` do cache sem confirmar na fonte.
- **Bootstrap (1ª run):** se ausente, `run` inicializa a partir da saída do `plan` com `currentWave=1`.

---

## 4. Fluxo end-to-end (comandos reais)

> `ORCA` = `orca` (Windows). Rode `orca skills get …` para o surface exato antes de executar.

**Setup (1x por projeto):**
```
orca status --json
orca repo add --path <abs-repo> --json
orca repo set-base-ref --repo id:<repoId> --ref origin/main --json
```

**Wave N (`orca-graph-run`, loop manual):**
```
# 0. precondições: ABORTA se cycles != []; exige flag --confirm (a aprovação da wave).
#    RE-ATTACH GUARD: se wave-state.tasks já tem entradas da wave atual em dispatched/pr_open,
#    NÃO recriar — reconectar o check --wait a elas (evita task/worktree duplicados após crash).
# 1. tasks SÓ da wave atual; no máx maxConcurrent por vez (sublotes se a wave for maior)
orca orchestration task-create --spec "<prompt autocontido do ticket>" --json    # guarda orcaTaskId no wave-state

# 2. worker Codex custom (two-step; base = origin/main via --no-parent):
#    slug = "<featureId>-<short>" (prefixado pelo ID → branch/PR únicos, idempotência à prova de colisão)
orca worktree create --name <slug> --no-parent --json
orca terminal create --worktree id:<repoId>::<path> --title <slug>-luna \
  --command 'codex --model <WORKER_MODEL> -c model_reasoning_effort="<WORKER_EFFORT>"' --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <orcaTaskId> --to <handle> --inject --json
#   (opcional) orca terminal read --terminal <handle> --json  → confirma que o preâmbulo chegou

# 3. supervisão — LOOP até toda task da wave reportar worker_done (check --wait devolve 1 msg/vez):
orca orchestration check --wait --types worker_done,escalation,decision_gate --timeout-ms 900000 --json
#   worker_done → validar PR/CI (triage abaixo); ask → responder; escalation → intervir
#   timeout/{count:0} = checkpoint, NÃO falha

# 4. wave elegível ao gate = TODA task tem PR aberto e review-ready
#    (worker_done com falha/sem PR NÃO conta → re-dispatch/ask/escalar antes do gate)
orca orchestration gate-create --task <orcaTaskId-daWave> \
  --question "Wave N: PRs #.. review-ready. Mergeie em main e rode /orca-graph-next." --json
#   NOTA: como worker_done já marca a task 'completed', este gate NÃO bloqueia o DAG —
#   é um checkpoint de notificação/registro humano. O gate REAL é você mergear. run TERMINA aqui.
```

**Você mergeia no GitHub. Depois `orca-graph-next`:**
```
# 5. resolve gate
orca orchestration gate-resolve --id <gateId> --resolution "merged: #.." --json

# 6. verificar MERGE real (não só worker_done) para CADA blocker de CADA feature da Wave N+1
#    (inclusive blockers de waves anteriores não-adjacentes; ler prNumber de wave-state.tasks[])
gh pr view <prNumber> --repo <owner/repo> --json state,mergedAt,mergeCommit    # exigir state=MERGED
#   o SHA para o passo 7 é .mergeCommit.oid (objeto {oid}), não o campo mergeCommit inteiro

# 7. cortar de origin/main FRESCA (verificada) e avançar
git fetch origin
git merge-base --is-ancestor <mergeCommit.oid> origin/main   # confirma que origin/main contém o merge
#   só então: currentWave++. orca-graph-next NÃO dispara workers — apenas avança e PARA.
#   A PRÓXIMA invocação (plan → run --confirm) reinicia no passo 1 para a Wave N+1.
```

**Triage PR/CI (no worker_done):**
```
gh pr checks <num> --repo <owner/repo> --json name,state,link
```
- `FAILURE/ERROR` → falha real → `ask`/re-dispatch.
- `CANCELLED` → tratar como cancelado-por-push só se SHA do run ≠ `headRefOid` atual; senão escalar.
- **Escopo do PR:** o diff mexe só nos arquivos/áreas do ticket? Se expandiu escopo → escalar a você (não mergear).
- Reviews (Code Rabbit/Codex/humano): correctness/security → fix; maintainability/perf → só com ganho concreto; question → responder; scope-expanding → escalar; stale → responder com evidência.

---

## 5. Componentes a criar

### 5.1 `wave-state.json`
Shape e regras em §3. Escrito por `run`, lido por `next`/`status`.

### 5.2 Skill `skills/orca-harness-spec-reader/SKILL.md` (read-only) ✅ criado
Ponte specs→grafo. **Delega normalização a `harness-feature-state`**; adiciona grafo/waves, profundidade de cadeia, ciclos, e monta o "ticket-as-prompt". A matemática do grafo é determinística via **`scripts/orca-graph-dag.mjs`** (waves por longest-path, ciclos, `maxChainDepth`, `missingDeps`; exit 1 gateia ciclos/deps ausentes). A skill enriquece a saída do script com os campos do `tasks.md`.

**Mapa de campos** (`feature_list.json` → saída; `.specs/features/<id>/tasks.md` → saída):

| Saída | Origem |
|---|---|
| `id`/`title`/`dependencies`/`status`/`verification` | campos homônimos do `feature_list` |
| `expected_behavior` | `feature_list.user_visible_behavior` |
| `acceptance_criteria` | `### Acceptance Criteria` do `tasks.md`; `[]` se ausente |
| `scope_in`/`scope_out` | `### Scope` do `tasks.md`; `""`/`[]` se ausente |
| `files` | `### Technical Details`; `[]` se ausente |
| `risk`/`feature_flag`/`rollout` | linhas `Risk:`/`Feature flag:`/`Rollout:` em `### Technical Details`; default `"low"`/`null`/`""` |

**Saída (schema literal):**
```json
{
  "waves": [ { "wave": 1, "featureIds": ["feat-001","feat-002"] } ],
  "maxChainDepth": 2,
  "cycles": [],
  "features": [ { "id":"feat-001","title":"...","dependencies":[],"status":"not_started",
    "verification":"...","expected_behavior":"...","acceptance_criteria":[],
    "scope_in":"","scope_out":[],"files":[],"risk":"low","feature_flag":null,"rollout":"" } ]
}
```
Regras: **reporta ciclos** em `cycles` (não trava; `run` aborta se não-vazio) e **avisa `maxChainDepth > 4`**. Fan-in espera **todos os PRs blockers mergeados**.

### 5.3 `wave-config.json` — troca fácil de modelo
**Resolução:** `<projeto>/wave-config.json`; se ausente, fallback `~/.config/opencode/templates/wave-config.default.json` (**artefato a criar**). Project root via `orca worktree current --json`, **com fallback para `git rev-parse --show-toplevel`/cwd** (funciona mesmo fora de um worktree Orca).
```json
{
  "roles": {
    "orchestrator": { "codexModel": "gpt-5.6-sol",  "reasoningEffort": "medium" },
    "worker":       { "codexModel": "gpt-5.6-luna", "reasoningEffort": "xhigh"  }
  },
  "maxConcurrent": 3,
  "prBase": "main"
}
```
O `--command 'codex --model <codexModel> -c model_reasoning_effort="<reasoningEffort>"'` é montado daqui. Trocar worker pra `claude`/`grok` = uma linha.

### 5.4 Skill `skills/orca-graph-engineer/SKILL.md` (o combinador)
- Carrega surface via `orca skills get`; lê spec-reader + wave-state + wave-config.
- **Aborta** se `cycles != []` (imprime o ciclo e manda corrigir no `feature_list.json`); **exige `--confirm`** (a aprovação da wave).
- **Re-attach guard:** antes de criar qualquer task, reconecta a tasks da wave atual já em `dispatched`/`pr_open` no wave-state, em vez de recriar (idempotência de re-invoke pós-crash).
- **Cria tasks só da wave atual**; se `len(wave) > maxConcurrent`, processa em sublotes; `gate-create` só após o último sublote.
- **Two-step error handling (básico):** se algum passo entre `worktree create` e `dispatch` falhar, faz cleanup do worktree parcial (`orca worktree rm --worktree id:<…> --force`), remove a entrada do wave-state, re-tenta 1x; na 2ª falha, escala.
- **Nunca** `orchestration run`, nunca merge/push, nunca self-resume.

### 5.5 Edições
- `templates/agent-os/specs/_template/tasks.md` → campos ticket-as-prompt (§6 do worker).
- `skills/harness-feature-state/SKILL.md` → campos opcionais + regras de ticket (≤5 pts; migration+schema juntos; nunca ticket só de teste; **sem ticket de "foundation"**; alvo de PR não-trivial **< ~400 linhas**; feature arriscada nasce com rollback+observabilidade; grafo explícito, não inferido do título; i18n/factories quando aplicável) **e a semântica do `in_progress`**: features em voo NÃO ficam `in_progress` no `feature_list.json` (violaria WIP=1 com N workers); o in-flight vive no `wave-state.json` (autoridade); `feature_list.status` vira `passing` (evidência PR#+CI) só após o merge.

---

## 6. Comandos (`opencode.jsonc`) — 4 chaves

Uma chave por comando (`description` + `template`), como no resto do repo.

| Chave | Ação |
|---|---|
| `orca-graph-plan` | spec-reader → wave table + profundidade/ciclos + o que falta de contrato. **Read-only** (nenhum dispatch, nenhuma escrita de estado). É a peça que você revisa antes de aprovar. |
| `orca-graph-run` | aborta se `cycles != []`; **exige `--confirm`** (invocar com a wave table à vista = aprovação); re-attach guard; cria tasks da wave (≤`maxConcurrent`), dispara workers (two-step + retry), supervisiona, `gate-create`, **PARA**. |
| `orca-graph-next` | resolve gate, verifica merge real (`gh state=MERGED` + `.mergeCommit.oid` ancestral de `origin/main`), `currentWave++`, escreve wave-state, **PARA** (imprime "rode /orca-graph-plan para a Wave N+1"). Não dispara workers. |
| `orca-graph-status` | `task-list --json` + `wave-state.json` + triage PR/CI. **Sinaliza drift:** entradas do wave-state cujos terminais/worktrees não existem mais, worktrees órfãos, e idade/último-evento por task (stand-in manual do heartbeat deferido). |

Template (`orca-graph-run`): *"Execute a skill global orca-graph-engineer. Confirme `orca status --json` e a orquestração experimental; carregue o surface via `orca skills get`; leia feature_list.json + wave-config.json + wave-state.json. ABORTE se `cycles != []`. Exija `--confirm`; sem ele, ecoe a wave table e pare. Aplique o re-attach guard (reconectar a tasks já dispatched/pr_open da wave). Crie tasks Orca SOMENTE da wave atual (≤maxConcurrent); dispare workers Codex custom (two-step, `--no-parent`, base origin/main); supervisione com check --wait em loop até toda task ter PR review-ready; ao completar a wave, gate-create e PARE. NUNCA use `orchestration run`, nunca push/merge, nunca auto-avance. Não assuma caminhos do repo."*

---

## 7. Template de prompt do worker (corpo do `--spec`)

```text
## Task: <TICKET_ID> — <TÍTULO IMPERATIVO>
### Context / Scope (In/Out) / Dependencies (já mergeadas em origin/main)
### Technical Details (módulos, arquivos, stack, feature flag/rollout — default OFF)
### Acceptance Criteria / Test Scenarios / Events & Metrics

### WORKFLOW (exato — sem Linear)
1. orca worktree set --worktree active --workspace-status in-progress --json
2. Ler arquivos relevantes ANTES de editar
3. Implementar SÓ o escopo; testes e implementação como workstreams distintos
4. Verificação do ticket (comando de feature_list.verification) + **pre-commit hooks**
5. Corrigir falhas relacionadas
6. Commit convencional: feat(scope): …
7. Idempotência: gh pr list --head <branch> → se PR já existe, usar; senão git push (SÓ feature branch) + gh pr create --base main
8. orca worktree set --worktree active --workspace-status in-review --comment "PR #<n> aberto" --json
9. worker_done: --type worker_done --payload {taskId,dispatchId,filesModified,prNumber,reportPath?}
10. NÃO mergear. Idle após worker_done.
```
`dispatch --inject` já injeta o preâmbulo de lifecycle (`worker_done`/`ask`). Payload real do `worker_done` (do guia): `{taskId, dispatchId, filesModified, reportPath?}` — `prNumber` é extra inofensivo. **Idempotência (passo 7)** é o único item de recovery mantido: barato e evita PR/branch duplicados em qualquer re-run.

---

## 8. Pré-requisitos e riscos

- [x] Orquestração CLI já disponível (verificado). Opcional p/ visibilidade: Agents View + Agent Dashboard; deixar Agent sleep OFF.
- [x] Modelos Codex definidos: orquestrador `gpt-5.6-sol` (medium), worker `gpt-5.6-luna` (xhigh). Trocar em uma linha no `wave-config.json` se mudar.
- [ ] Custo: N workers xhigh consomem a sub GPT rápido → `maxConcurrent` baixo (3).
- [ ] Windows: PowerShell não tem `&&` (usar `; if ($?) { … }`); atenção a MAX_PATH (260) com worktrees.

---

## 9. Roadmap

**Fase 1 — Fundação:** `orca-harness-spec-reader` (mapa de campos + ciclos/profundidade); `wave-state.json` shape + escrita atômica; `templates/wave-config.default.json` (com fallback de resolução); editar template de tasks + `harness-feature-state`.
**Fase 2 — Orquestrador:** `orca-graph-engineer`; registrar 4 comandos; dry-run `plan` com 3 features (2 indep + 1 dep) → 2 waves, sem dispatch.
**Fase 3 — Ponta-a-ponta:** ligar experimental; **smoke test de 1 ticket** (1 wave, 1 worker → dispatch → PR → worker_done) para isolar o round-trip do worker; depois `run --confirm` (2 tickets → 2 worktrees, 2 PRs, gate); merge manual; `next` → `plan` → `run --confirm` p/ Wave 2. Documentar lições.

---

## 10. Verificação

1. **Spec reader:** feature_list de teste (5 features, 1 ciclo, 1 cadeia de 5) → waves corretas, `cycles` preenchido (sem travar), `maxChainDepth>4` avisado.
2. **Wave plan:** `orca-graph-plan` → Wave 1 sem blocker, Wave 2 dependentes; nenhum dispatch.
3. **Gate estrutural:** task de wave-2 **não existe** antes do `next` (inspeção `task-list --json`).
4. **Merge real:** `next` recusa avançar se `gh pr view … state != MERGED`.
5. **Config swap:** mudar `worker.codexModel` → `--command` gerado reflete.
6. **Semi-auto:** inspeção da skill → nenhum `orchestration run`, nenhum merge/push automático, nenhum self-resume.
7. **Harness:** `/harness-context-budget` + `npm run typecheck` sem regressão.

---

## Deferred — adicionar SÓ quando um failure mode real aparecer

Movido do v4 para evitar over-engineering. Cada item tem um gatilho observável:

| Item | Adicionar quando |
|---|---|
| `orca-graph-resume` (recovery de crash: reconecta workers vivos, adota PRs, re-dispatch mortos) | o orquestrador cair de fato no meio de uma wave e você perder o fio |
| `orca-graph-check` (pre-flight de 10 checks: disco, MAX_PATH, etc.) | um run quebrar por um pré-requisito não óbvio |
| Heartbeat protocol (5min + miss-counting + auto-redispatch) | um worker travar silenciosamente e você não perceber via `status`. **Nota:** auto-kill por tempo é perigoso — tarefas xhigh rodam 15-60min normalmente |
| Lockfile com PID | você começar a rodar 2 orquestradores no mesmo projeto |
| Backup (`.bak`) + reconstrução de estado corrompido (rebuild via `task-list`/`worktree ps`/`gh pr list`) | o `wave-state.json` corromper de fato (write-rename já previne corrupção mid-write) |
| Batching sofisticado / rate-limit de `gh` | waves grandes (>10 features) começarem a estourar algo mensurável |

**Regra:** não construir nada desta tabela preventivamente. Núcleo primeiro, confiabilidade sob demanda.

### Runbook manual — orquestrador caiu / run abortado mid-wave

Enquanto `orca-graph-resume` está deferido, o guard de re-attach cobre o re-invoke simples; para o resto, reatar à mão (não hand-editar JSON às cegas):

1. `orca-graph-status` → ver o que o wave-state diz vs. realidade.
2. `orca orchestration task-list --json` + `orca worktree ps --json` + `gh pr list --state open --json number,headRefName` → estado real (tasks, worktrees, PRs).
3. Reconciliar: para cada feature da wave, se há PR aberto → marcar `pr_open` no wave-state (worker terminou); se worktree vivo sem PR → deixar seguir; se worktree morto sem PR → `orca worktree rm --worktree id:<…> --force` e re-rodar `orca-graph-run --confirm` (o re-attach guard + idempotência do worker evitam duplicados).
4. Só então continuar o fluxo normal (`check --wait` / gate).

---

## Perguntas em aberto
1. ~~IDs de modelo Codex~~ → definidos: `gpt-5.6-sol` (medium) / `gpt-5.6-luna` (xhigh).
2. `maxConcurrent` inicial (sugestão: 3).

## Referências
- [@gkpacker](https://x.com/gkpacker/status/2080306086653894733) · [skill](https://x.com/gkpacker/status/2080312052128546865) · [Graph Engineering](https://x.com/gkpacker/status/2080311008871035015)
- [Harness OpenCode — Guia](./2026-07-22-1910-global-opencode-rationalization/harnessopencode.md)
- Orca skills (stubs): `C:\Users\maiki\.agents\skills\{orca-cli,orchestration}\SKILL.md` — surface real via `orca skills get <skill>`

> **Princípio:** o orquestrador lê, planeja, dispara, supervisiona e para no gate — não escreve código, não mergeia, não auto-avança. Quem implementa é o worker (branch isolada). Quem mergeia e libera cada wave é você. Núcleo primeiro; confiabilidade quando um failure mode aparecer.
