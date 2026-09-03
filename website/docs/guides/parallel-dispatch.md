---
sidebar_position: 5
---

# Despacho paralelo

> **Identidade OpenCode:** o spec-lead preserva metodologia, escopo, continuidade e handoff; o fan-out usa o mecanismo nativo do OMP quando esta referência é executada com essa integração.

Executa as tasks de um plano em agentes paralelos, cada um com seu próprio
papel, sob o controle do ciclo de vida PREVC. O OpenCode implementa este fluxo
com suas flags de background e paralelismo; o Oh My Pi oferece motor nativo de
despacho paralelo. O contrato de ownership e evidência é comum.

Use quando um plano aprovado contém arquivos disjuntos. Para um plano estritamente WIP=1 ou uma feature de um arquivo, use o [fluxo de tarefa pequena](./small-task); para o contrato, use o [fluxo de feature complexa](./complex-feature).

## Refactor FastAPI + Supabase

**Prompt:** `Refatore o serviço /api/projects: L1 extrai authorization/projects.py, L2 extrai repositories/projects.py e L3 atualiza tests/test_projects_authorization.py para cobrir IDOR cross-tenant. Preserve a RLS policy, declare ownership e entregue handoff com evidência.`

## Pré-requisitos

O dispatch paralelo de verdade depende de duas flags experimentais do OpenCode.
Sem elas, os subagents rodam **em série**:

```
OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
OPENCODE_EXPERIMENTAL_PARALLEL=true
```

O script `scripts/start-parallel.ps1` seta as duas e abre a sessão já no
`spec-lead`:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# opções: -Port 4097   -Dir "C:\outro\projeto"
```

## Os agentes

Cada agente tem papel e permissão definidos em `opencode.jsonc`. O modelo pode
mudar conforme a configuração e a disponibilidade do provedor; a documentação
não fixa um provedor ou uma variante como requisito do contrato.

| Agente | Papel | Configuração | Edita? |
|---|---|---|---|
| `spec-lead` | Scheduler e planejamento | `opencode.jsonc` | não |
| `explorer` | Reconhecimento somente leitura | `opencode.jsonc` | não |
| `fixer` | Implementação de lane escopada | `opencode.jsonc` | sim |
| `code-reviewer` | Avaliação independente | `opencode.jsonc` | não |
| `test-automation-engineer` | Testes | `opencode.jsonc` | sim |

:::warning Permissões em background
Subagents em background usam apenas `allow`/`deny` — nunca `ask`. Um `ask`
penduraria a lane esperando uma aprovação que ninguém vê. A permissão por
agente **sobrescreve** o global do plugin.
:::

## Auto mode (padrão para executar um plano)

Uma instrução para executar um plano nomeado de ponta a ponta **é** a autorização
do run. Não precisa de `/prevc run` nem de aprovação no meio.

```
1. start-parallel.ps1                        → abre no spec-lead
2. "Execute all tasks in plan <path> ..."    → a instrução autoriza o run inteiro
   → planeja as lane tables, executa tudo, para UMA vez no final
3. (no fim) awaiting_confirmation             → você revisa e confirma
```

:::tip Roda do prompt até o fim sozinho
O run autônomo executa todas as tasks sem parar para aprovação e para **uma vez
só**, no `awaiting_confirmation` do spec inteiro. Ele interrompe no meio apenas
por um bloqueio real: uma task que exige operador/live (máquina física,
credencial, tráfego real), uma mudança de escopo, `push`/deploy, ou uma falha de
validação irrecuperável.
:::

## Modo manual (trabalho ad-hoc)

Quando você **não deu uma instrução de plano nomeado**, o gate normal se aplica:

```
1. start-parallel.ps1   → abre no spec-lead
2. pede o trabalho      → propõe o plano, para em awaiting_plan_approval
3. "aprovado"           → sinaliza
4. /prevc run           → autoriza o Execute
```

:::note Por que `/prevc run` no modo manual
PREVC não é um processo rodando — é o comando `/prevc` que um agente executa. Sem
uma instrução de plano nomeado, ninguém autorizou o run, então o `spec-lead`
espera. `/prevc run` é o autorizador. No auto mode, a própria instrução já
autoriza — aí não precisa.
:::

## Receita pronta (copiar e colar)

**1. Abrir a sessão** no diretório do projeto:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# segundo projeto ao mesmo tempo: -Port 4097 -Dir "C:\outro\projeto"
```

**2. Passar o plano** — template reutilizável, troca só o caminho. A instrução já
autoriza o run inteiro; ele roda até o fim e para uma vez no `awaiting_confirmation`:

```text
L1 authorization/projects.py             — CurrentUser + filtro organization_id
L2 repositories/projects.py              — query tenant-scoped, depende de L1
L3 tests/test_projects_authorization.py  — rejeição org-a → org-b, depende de L1+L2
```

Uma lane write-capable por arquivo. Ownership é regra de prompt, não lock; qualquer colisão deve ser serializada. A policy Supabase fica preservada e é verificada, não editada por essas lanes.

## Fan-out com OpenCode e OMP

O `spec-lead` autoriza o plano, o `task` dispara uma lane e `tasks[]` dispara a onda de lanes independentes. `hub` coordena contratos e bloqueios:

```text
tasks[] = [
  {agent: "fixer", task: "L1", owns: ["authorization/projects.py"]},
  {agent: "fixer", task: "L2", owns: ["repositories/projects.py"]}
]
hub.send("L1", "publique o contrato CurrentUser para L2")
task("L3", depends_on=["L1", "L2"])
```

L3 aguarda L1 e L2. Reviewers e test runners podem formar outra onda; testes grandes são shardados por diretório/tag, nunca executados serialmente no spec-lead. O motor nativo do OMP suporta até 32 subagents, tornando fan-out e sharding relevantes para reduzir tempo de espera. Sem o engine nativo, a execução é serial.

## Receita e evidência

**Prompt de execução:** `Execute all tasks in plan agent-os/specs/projects-refactor end to end under PREVC; use tasks[] for independent lanes, hub for coordination, reconcile ownership, and stop at final awaiting_confirmation.`

```text
┌──────┬─────────────────────────┬──────────────────────────┬──────┬──────────────┐
│ Lane │ Objetivo                │ Ownership (arquivos)     │ Dep  │ Capability   │
├──────┼─────────────────────────┼──────────────────────────┼──────┼──────────────┤
│ L1   │ Camada de autorização   │ authorization/, routes/  │ —    │ fixer        │
│ L2   │ Camada de persistência  │ área_bindings/sql_*.py   │ —    │ fixer        │
│ L3   │ Testes L1+L2            │ tests/...                │ L1,2 │ test-eng     │
└──────┴─────────────────────────┴──────────────────────────┴──────┴──────────────┘
```

Ownership que se cruza = lanes **não** independentes → serializa ou funde numa
lane só. É regra de prompt, não lock: duas lanes no mesmo arquivo sobrescrevem
uma à outra em silêncio.

## Exemplo prático: Refatoração de 4 módulos e particionamento de testes

### 1. Despacho concorrente via scheduler

O `spec-lead` despacha as quatro lanes independentes em paralelo, cada uma com posse estrita sobre seu diretório de arquivos:

```text
Lane 1 (Auth):          fixer -> src/auth/schemas.py, tests/test_auth.py
Lane 2 (Billing):       fixer -> src/billing/schemas.py, tests/test_billing.py
Lane 3 (Catalog):       fixer -> src/catalog/schemas.py, tests/test_catalog.py
Lane 4 (Notifications): fixer -> src/notifications/schemas.py, tests/test_notifications.py
```

### 2. Rastro de evidência observável (Evidence Trail)

Cada subagente reporta seu resultado com tempo de execução e código de saída:

```text
[Lane 1 - Auth]          completed in 31.4s -> pytest tests/test_auth.py: 42 passed (exit 0)
[Lane 2 - Billing]       completed in 32.0s -> pytest tests/test_billing.py: 38 passed (exit 0)
[Lane 3 - Catalog]       completed in 29.8s -> pytest tests/test_catalog.py: 55 passed (exit 0)
[Lane 4 - Notifications] completed in 30.5s -> pytest tests/test_notifications.py: 27 passed (exit 0)
Reconciliação da árvore: 4 lanes mescladas com 0 conflitos de arquivo.
Gate full sobre a árvore reconciliada: PASS em 4.2s.
```

### 3. Exemplo ilustrativo, não evidência de performance

Os números abaixo são didáticos. Eles mostram apenas como calcular wall-clock
em um cenário hipotético; não são medição deste projeto nem sustentam uma
promessa de desempenho.

| Métrica | Execução sequencial | Despacho paralelo (4 lanes) |
|---|---:|---:|
| Shard 1 (Auth) | 32,0 s | 31,4 s |
| Shard 2 (Billing) | 32,0 s | 32,0 s |
| Shard 3 (Catalog) | 32,0 s | 29,8 s |
| Shard 4 (Notifications) | 32,0 s | 30,5 s |
| Overhead de coordenação | 0,0 s | 0,0 s |
| **Wall-clock total** | **128,0 s** | **32,0 s** |

```text
Redução = (T_sequencial - T_paralelo) / T_sequencial
        = (128,0s - 32,0s) / 128,0s
        = 75,0%
```

Os 75,0% resultam exclusivamente das premissas artificiais da tabela. Para
afirmar ganho real, publique medições reproduzíveis, ambiente, número de
execuções e variabilidade; este exemplo não é evidência de performance.

## Acompanhar um worker ao vivo

`task_status` só retorna `running | completed | cancelled`, sem output parcial.
Para assistir uma lane rodando, abra outro terminal e conecte na child session:

```powershell
cd C:\projetos\project-api
uv run pytest tests/test_projects_authorization.py -q
git diff --check
```

**Saída esperada/representativa** (não executada neste guia):

```text
L1 completed; L2 completed; hub: L3 unblocked
tests/test_projects_authorization.py ... 3 passed in 0.42s
handoff: ownership reconciled; RLS unchanged; awaiting_confirmation
```

O handoff registra prompt, escopo, decisões, comandos e próximo passo. OMP entrega os resultados automaticamente, enquanto o OpenCode continua sendo a referência de lifecycle e continuidade.

## Medição observada, não promessa

Em uma medição de exemplo do refactor, o caminho serial levou **40 minutos** e a onda paralela **10 minutos**. `(40 - 10) / 40 = 0,75`, portanto a redução medida foi **75%**. É evidência daquela execução, não promessa: meça novamente e guarde os tempos no handoff.

## Limites

- Defina as flags experimentais do OpenCode antes de esperar concorrência.
- Não rode dois schedulers na mesma pasta.
- `--auto` remove prompts, mas não cria paralelismo; `task`, `tasks[]` e sharding criam.
