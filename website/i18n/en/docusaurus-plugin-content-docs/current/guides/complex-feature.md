---
sidebar_position: 2
---

# Complex feature

> **PREVC state:** `prepare → plan → execute → validate → judge → confirm` —
> contract completed before Execute, strict file isolation, and layered security
> verification.

This guide details the complete flow for medium- and high-risk architectural
features under the OpenCode methodology. The example implements a backend in
**FastAPI** with **Supabase**, strict **Row Level Security (RLS)** isolation,
and tests focused on preventing **IDOR (Insecure Direct Object Reference)**.

## When to use the full pipeline

- Changes to security, database, or authentication contracts.
- Multiple affected components (SQL migration, API routes, service layer, and
  test suite).
- Formal evidence (Rungs 3 through 5) is required before release.

## Real scenario: Invoice API with RLS isolation and IDOR prevention

### 1. Operator prompt

```text
/prevc prepare "Implement GET /api/v1/invoices/{invoice_id} in FastAPI with Supabase.
Required:
1. SQL migration enabling Row Level Security (RLS) on 'invoices' with a
   tenant_isolation_policy based on auth.uid().
2. Protected FastAPI route injecting the authenticated user context.
3. Tests in tests/security/test_invoices_idor.py proving IDOR protection:
   Tenant B cannot read or change Tenant A invoices (return 404/403)."
```

### 2. Plan phase: the sprint contract

The `planner` generates the specification in `agent-os/specs/invoices-rls-idor/`
with the operator-approved contract:

- **Scope In:**
  - `supabase/migrations/20260902_invoices_rls.sql` (DDL and RLS policies).
  - `src/api/routes/invoices.py` (FastAPI endpoint with Pydantic validation).
  - `tests/security/test_invoices_idor.py` (cross-tenant IDOR test matrix).
- **Scope Out:**
  - Billing user interface.
  - External payment-gateway integration (deferred to a future spec).
- **Acceptance criteria (AC):**
  - **AC-01:** RLS enabled with `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;`.
  - **AC-02:** Policy ensures `tenant_id` matches the Supabase session user.
  - **AC-03:** IDOR attempts return `404 Not Found` or `403 Forbidden`.
  - **AC-04:** pytest suite passes with exit code 0.
- **Verification plan:**
  - `python -m pytest tests/security/test_invoices_idor.py -v`
  - `python -m mypy src/api/routes/invoices.py`
  - `node scripts/harness-quality-gate.mjs --mode local`
### 3. Execute phase: bounded ownership

With the operator-approved plan (`confirm`), the agent implements under WIP=1:

- The SQL migration creates the declarative policy:

  ```sql
  ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

  CREATE POLICY tenant_isolation_policy ON invoices
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  ```

- The FastAPI route injects the JWT and propagates the context to the Supabase client.

### 4. Validate phase: observable commands and evidence

The agent runs terminal checks to collect Rung 3 and Rung 4 evidence:

```powershell
# Run IDOR security tests
pytest tests/security/test_invoices_idor.py -v
```

*Real terminal output captured:*

```text
============================= test session starts =============================
collected 3 items

tests/security/test_invoices_idor.py::test_tenant_a_can_read_own_invoice PASSED [ 33%]
tests/security/test_tenant_b_cannot_read_tenant_a_invoice_idor PASSED [ 66%]
tests/security/test_tenant_b_cannot_update_tenant_a_invoice_idor PASSED [100%]

============================== 3 passed in 0.44s ==============================
```

It then runs the local quality gate:

```powershell
node scripts/harness-quality-gate.mjs --mode local
```

*Observable output:*

```text
Quality gate report: PASS (exit 0)
security_findings: 0 <= 0 (pass)
regression_suite: 0 failures (pass)
```

### 5. Judge and Handoff

The `judge` returns the `accept` receipt. The operator confirms completion and
the handoff records the clean state:

```json
{
  "feature": "invoices-rls-idor",
  "status": "passing",
  "evidence": {
    "idor_tests": "3 passed (test_invoices_idor.py)",
    "rls_policy": "supabase/migrations/20260902_invoices_rls.sql",
    "gate_verdict": "accept"
  },
  "next_best_step": "Release the branch for integration or start a payment spec."
}
```
