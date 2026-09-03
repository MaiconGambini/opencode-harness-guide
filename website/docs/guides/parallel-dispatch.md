---
sidebar_position: 5
---

# Dispatch Paralelo

> **Identidade OpenCode:** o spec-lead preserva metodologia, escopo, continuidade e handoff; o fan-out usa o mecanismo nativo do OMP quando esta referência é executada com essa integração.

Use quando um plano aprovado contém arquivos disjuntos. Para um plano estritamente WIP=1 ou uma feature de um arquivo, use o [fluxo de tarefa pequena](./small-task); para o contrato, use o [fluxo de feature complexa](./complex-feature).

## Refactor FastAPI + Supabase

**Prompt:** `Refatore o serviço /api/projects: L1 extrai authorization/projects.py, L2 extrai repositories/projects.py e L3 atualiza tests/test_projects_authorization.py para cobrir IDOR cross-tenant. Preserve a RLS policy, declare ownership e entregue handoff com evidência.`

Lane table:

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

**Terminal representativo:**

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
