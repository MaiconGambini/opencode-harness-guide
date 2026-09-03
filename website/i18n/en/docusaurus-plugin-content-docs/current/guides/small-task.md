---
sidebar_position: 1
---

# Small task

> **PREVC state:** Simplified fast path — up to 3 files, deterministic scope,
> without the heavy spec ceremony.

This guide demonstrates the fast path for focused engineering tasks, such as a
two-minute surgical bug fix, while preserving evidence and durable continuity
without the overhead of a full planning ceremony.

## Two-minute example

**Prompt:** `Fix GET /api/health in app/main.py: return {"status":"ok"} with HTTP 200 and verify the local contract.`

The one-file scope does not need a scheduler or subagents. After the fix, record
the prompt, file, command, and observed output in `session-handoff.md`. If a
second decision or file appears, return to the [complex feature flow](./complex-feature).

## Why does fast mode skip the PREVC ceremony?

The full PREVC cycle mitigates architectural risk and coordinates complex
changes. For a few-line fix in one file:

- Complete specifications (`spec.md`, `plan.md`, `verification.md`,
  `decisions.md`, and tickets) create more overhead and tokens than the changed
  code itself.
- The risk of drift or *context mixing* is low when a reproducing test exists.
- **The golden rule:** fast mode skips documentation overhead, but **never skips
  real evidence**. The fix must be proved by an automated test (Rung 4).

## Real scenario: Fixing an expired discount calculation

**Affected file:** `src/billing/discounts.py`
**Problem:** applying an expired coupon returns a negative discount instead of
raising `CouponExpiredError`.

### 1. Operator prompt

```text
Fix the discount calculation in src/billing/discounts.py: expired coupons must
raise CouponExpiredError instead of returning a negative discount. Add a
regression test in tests/test_discounts.py.
```

### 2. Terminal commands and execution

The agent declares the active task in `progress.md` (WIP=1) and reproduces the
failure before editing:

```powershell
# 1. Run the test reproducing the failure (red)
pytest tests/test_discounts.py -k test_expired_coupon -v
```

*Terminal output:*

```text
FAILED tests/test_discounts.py::test_expired_coupon - AssertionError: Expected CouponExpiredError but got discount -15.00
1 failed, 12 passed in 0.28s
```

The agent surgically edits `src/billing/discounts.py` to add the temporal
validity check and runs verification:

```powershell
# 2. Re-run the test to confirm the fix (green)
pytest tests/test_discounts.py -k test_expired_coupon -v

# 3. Deterministic type verification (Rung 3)
python -m mypy src/billing/discounts.py
```

### 3. Observable evidence output

```text
tests/test_discounts.py::test_expired_coupon PASSED [100%]
1 passed, 12 passed in 0.25s
Success: no issues found in 1 source file
```

### 4. Handoff and closure

The agent records completion in `progress.md` and creates the minimum evidence
in the handoff:

```json
{
  "task": "fix-coupon-expired-discount",
  "status": "passing",
  "files": ["src/billing/discounts.py", "tests/test_discounts.py"],
  "evidence": "pytest: 1 passed; mypy: clean; exit code: 0"
}
```

**Total elapsed time:** ~2 minutes.

## What NOT to do

- Do not skip verification. Even a two-minute task needs evidence.
- Do not expand the scope. If you realize you need more, stop, plan again, and
  ask for approval.
