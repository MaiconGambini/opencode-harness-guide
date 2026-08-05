---
sidebar_position: 6
---

# Dispatch Paralelo na Prática

Um exemplo ponta a ponta de um plano rodando pelo `spec-lead` em **auto mode** —
do prompt até a confirmação final, sem parar no meio.

## O cenário

**Feature MEDIUM, 3 lanes disjuntas:** card de UI, endpoint de agregação no
backend, e testes dos dois. Como as lanes tocam arquivos diferentes, paralelizam.

**Instrução:**

```text
Execute all tasks in plan agent-os/specs/2026-08-05-compare-props end to end
under PREVC — this authorizes a full autonomous run.
Propose a lane table per phase; parallelize independent lanes,
serialize lanes sharing a file. Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel
over the diff; both must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

## O que acontece (por fora)

A instrução já autoriza o run inteiro. Não tem `/prevc run`, não tem aprovação no
meio — o `spec-lead` planeja, executa tudo e para **uma vez só**, no fim.

```
Você: Execute all tasks in plan .../compare-props end to end under PREVC ...

spec-lead (sol/high):
  [PREPARE — planning]
  Mapeio ownership de arquivo por lane. Despacho @explorer (read-only) pra
  confirmar convenções e call sites.

  → @explorer (deepseek-flash/low): file:line dos readers de frontend_*.json
    e a convenção de erro em src/analysis/

  LANE TABLE (instrução de executar o plano = run autorizado):
  ┌──────┬─────────────────────────┬──────────────────────────────┬──────────┬──────────────────────┐
  │ Lane │ Objetivo                │ Ownership (arquivos)         │ Dep      │ Capability           │
  ├──────┼─────────────────────────┼──────────────────────────────┼──────────┼──────────────────────┤
  │ L1   │ Card de comparação      │ frontend/.../Compare.vue     │ —        │ vue-engineer         │
  │ L2   │ Endpoint de agregação   │ src/analysis/compare.py      │ —        │ python-engineer      │
  │ L3   │ Testes L1+L2            │ tests/test_compare.py        │ L1, L2   │ test-automation-eng  │
  └──────┴─────────────────────────┴──────────────────────────────┴──────────┴──────────────────────┘
  Risco: MEDIUM. Ownership disjunto entre L1 e L2 → paralelizam.
  L3 depende de L1+L2 → roda depois. Verificação: vue-tsc + vitest; pytest.

  [EXECUTE — scheduler, sem parar pra aprovação]
  Despacho L1 e L2 em paralelo (task background: true), registro task IDs.

  → task(python-engineer, L2)  → id=t_a1  [running]
  → task(vue-engineer, L1)     → id=t_b2  [running]

  [poll task_status: t_a1 running, t_b2 running...]
  [t_a1 → completed]  L2: compare.py criado, pytest do módulo passou
  [t_b2 → completed]  L1: Compare.vue criado, vue-tsc + vitest OK

  L1+L2 terminais → despacho L3 (dep satisfeita).
  → task(test-automation-engineer, L3)  → id=t_c3  [running]
  [t_c3 → completed]  L3: test_compare.py, 8 passed 0 failed

  RECONCILE + verificação cross-lane:
  [vue-tsc → OK]  [vitest → OK]  [pytest → 31 passed]

  [GATE FINAL — reviews em paralelo]
  → task(code-reviewer, diff)          → nota 9.5/10, 0 críticos
  → task(architecture-reviewer, diff)  → nota 9/10, 0 blocking
  Ambos ≥9 → recomendo aprovação.

  Commit local do trabalho reconciliado.

PREVC: Validate → Judge → awaiting_confirmation
  Muda: 3 arquivos. Evidência: vue-tsc OK, vitest OK, pytest 31/0,
  code-reviewer 9.5, architecture-reviewer 9.

Você: confirmo
  → feature_list.json: feat-XXX → passing
  → [harness-clean-handoff]
```

## As regras que o scheduler obedeceu

- **Um arquivo, uma lane write-capable por vez.** L1 e L2 disjuntos → paralelo. L3
  depende dos dois → serial depois. (Ownership é regra de prompt, não lock — colisão
  seria sobrescrita silenciosa.)
- **Task ID registrado na hora.** Lane sem task ID não existe.
- **Sem parada no meio.** A instrução de executar o plano autorizou; só parou no
  `awaiting_confirmation` final.
- **Só o scheduler commita.** Os implementadores editam; o `spec-lead` faz o commit
  local reconciliado. Push/branch/worktree seguem travados.
- **Gate duplo com nota.** `code-reviewer` + `architecture-reviewer` em paralelo,
  ambos ≥9, zero crítico → evidência pra aprovar. O operador confirma.

## Quando teria parado no meio

O auto mode é limitado — interrompe só por bloqueio real:

- Task que exige operador/live (máquina física, credencial, tráfego real).
- Mudança de escopo além do plano.
- `push`/deploy/branch/worktree.
- Falha de validação irrecuperável após um reparo.

Um plano com gate de operador (ex: rollout de produção) roda até bater no gate e
para; um plano só de código (como este) vai do prompt ao fim sozinho.

Veja [Dispatch Paralelo](./parallel-dispatch) para a referência completa dos modos,
agentes e receita.
