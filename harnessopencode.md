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
10. [Matriz de Completude](#10-matriz-de-completude)
11. [Harness Global Productizado](#11-harness-global-productizado)

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
│               zharnessengineering/index.md  │     se o projeto está saudável?
├─────────────────────────────────────────────┤
│  EVALUATION   harness-judge.md              │  5. O agente consegue avaliar
│               harness-evaluator-rubric      │     o próprio trabalho com
│               harness-role-separation       │     critérios objetivos?
└─────────────────────────────────────────────┘
```

### Por que 5 camadas?

| Camada | Problema que resolve | Sem ela |
|---|---|---|
| Entry | Agente não sabe as regras do projeto | Redescobre setup a cada sessão |
| Context | Agente não entende a arquitetura | Toma decisões inconsistentes |
| State | Agente não sabe o progresso | Começa features pela metade, duplica trabalho |
| Feedback | Agente não verifica baseline | Entrega código quebrado |
| Evaluation | Agente se auto-avalia | Diz "pronto" sem evidência real |

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
