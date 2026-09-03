---
sidebar_position: 2
---

# Feature Complexa

> **Identidade OpenCode:** defina metodologia, continuidade, escopo e handoff antes e depois da execução; o exemplo usa FastAPI + Supabase para tornar os limites verificáveis.

Use o pipeline completo para uma feature multi-componente com autorização por tenant, migration e testes.

## Prompt realista

`Adicione GET /api/projects ao FastAPI. O usuário só lista projetos da própria organization_id. Crie a policy Supabase RLS, escreva testes IDOR que rejeitem acesso cross-tenant e deixe comandos de verificação no handoff. Não dependa de credenciais reais.`

## Sprint contract antes do Execute

- **Scope In:** rota FastAPI, dependência de identidade, repository, migration/policy RLS, testes negativos e handoff.
- **Scope Out:** convites, billing, deploy e índices de produção.
- **AC:** token de `org-a` lista somente `org-a`; UUID de `org-b` retorna `404` ou `403` conforme o contrato; ausência de sessão retorna `401`; RLS aplica a mesma comparação no Supabase.
- **Verification Plan:** pytest local para a rota, teste IDOR explícito e `supabase db diff --local`. Sem credenciais, outputs Supabase são esperados/representativos.

## Código e política RLS

```python
@router.get("/api/projects")
async def list_projects(user: CurrentUser, db: AsyncSession) -> list[Project]:
    result = await db.execute(
        select(Project).where(Project.organization_id == user.organization_id)
    )
    return list(result.scalars())
```

```sql
alter table public.projects enable row level security;
create policy "tenant reads own projects" on public.projects
for select using (
  organization_id = (auth.jwt() ->> 'organization_id')::uuid
);
```

O teste negativo usa o token de `org-a`, tenta o UUID conhecido de `org-b` e afirma `404`/`403`; o caso feliz sozinho não prova autorização.

## Fluxo OpenCode

1. `/harness-session-start` lê o estado e declara a task.
2. `/harness-wip-control` decompõe rota, migration, testes e docs; uma subtask fica `in_progress`.
3. `/harness-role-separation` faz planner, generator e evaluator explícitos no sprint contract.
4. PREVC percorre Review → Execute → Validate → Judge; Confirm só ocorre com todas as subtasks `passing`.
5. `session-handoff.md` registra arquivos, decisões, comandos, saída e próximo passo.

**Terminal (runnable em projeto local):**

```powershell
cd C:\projetos\project-api
uv run pytest tests/test_projects_authorization.py -q
supabase db diff --local
```

**Saída esperada/representativa** (não executada neste guia):

```text
tests/test_projects_authorization.py::test_org_a_sees_only_org_a PASSED
tests/test_projects_authorization.py::test_org_a_cannot_read_org_b_idor PASSED
tests/test_projects_authorization.py::test_missing_session_is_401 PASSED
3 passed in 0.42s
create policy "tenant reads own projects" on public.projects ...
```

O OpenCode mantém o manual de metodologia e continuidade: qualquer descoberta fora do Scope In vira próxima task, não extensão silenciosa. Veja o [fluxo de tarefa pequena](./small-task) quando o trabalho ficar em um arquivo.
