---
sidebar_position: 1
---

# Tarefa Pequena

> **Identidade OpenCode:** registre metodologia, continuidade, escopo e handoff; para um bugfix de dois minutos, a forma é curta, mas a prova continua obrigatória.

> **Estado PREVC:** Fast path simplificado — até 3 arquivos, escopo determinístico, sem cerimônia pesada de spec.

Este guia demonstra o fluxo rápido para tarefas pontuais de engenharia, como
bugfixes cirúrgicos de poucos minutos, mantendo a integridade de evidências e
continuidade de estado sem a sobrecarga de um planejamento completo.

Use quando o prompt tem uma sentença clara, escopo de um arquivo e nenhuma
ambiguidade. O fast path dispensa a cerimônia completa do PREVC, mas nunca
dispensa validação nem o registro do handoff.

## Exemplo de dois minutos

**Prompt:** `Corrija o GET /api/health em app/main.py: retorne {"status":"ok"} com HTTP 200 e verifique o contrato localmente.`

Trecho de `app/main.py`:

```python
@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
```

**Terminal (reproduzível em um projeto FastAPI):**

```powershell
cd C:\projetos\billing-api
python -m pytest tests/test_health.py -q
```

**Evidência esperada/representativa** (não executada neste guia):

```text
tests/test_health.py::test_health_returns_ok PASSED
1 passed in 0.18s
```

O escopo de um arquivo não precisa do scheduler nem de subagents. Depois da
correção, registre no `session-handoff.md` o prompt, o arquivo, o comando e a
saída observada/esperada. Se surgir uma segunda decisão ou arquivo, retorne ao
[fluxo de feature complexa](./complex-feature).

## Por que o modo rápido dispensa a cerimônia do PREVC?

O ciclo completo do PREVC foi projetado para mitigar riscos arquiteturais e
coordenar mudanças complexas. Para uma correção de poucas linhas em um único
arquivo:

- Criar especificações completas gera mais overhead do que o próprio código modificado.
- O risco de dispersão em uma alteração cirúrgica é baixo, desde que haja um teste reprodutor.
- **A regra de ouro:** o fast path dispensa a burocracia documental, mas **nunca dispensa a evidência real**.

## Cenário real: Correção de cálculo de desconto expirado

**Arquivo afetado:** `src/billing/discounts.py`

**Problema:** quando um cupom expirado é aplicado, `apply_discount` retorna valor
negativo em vez de lançar `CouponExpiredError`.

### 1. Prompt do operador

```text
Corrigir cálculo de desconto em src/billing/discounts.py: cupons expirados devem lançar CouponExpiredError em vez de retornar desconto negativo. Adicione teste de regressão em tests/test_discounts.py.
```

### 2. Comandos e execução no terminal

O agente declara a tarefa ativa no `progress.md` (WIP=1) e reproduz a falha antes de editar:

```powershell
# 1. Executar o teste reproduzindo a falha (vermelho)
pytest tests/test_discounts.py -k test_expired_coupon -v
```

*Saída no terminal:*

```text
FAILED tests/test_discounts.py::test_expired_coupon - AssertionError: Expected CouponExpiredError but got discount -15.00
1 failed, 12 passed in 0.28s
```

O agente edita cirurgicamente `src/billing/discounts.py` adicionando a checagem
de validade temporal e executa a verificação:

```powershell
# 2. Re-executar teste para confirmar correção (verde)
pytest tests/test_discounts.py -k test_expired_coupon -v

# 3. Verificação de tipo determinística (Rung 3)
python -m mypy src/billing/discounts.py
```

### 3. Saída de evidência observável

```text
tests/test_discounts.py::test_expired_coupon PASSED [100%]
1 passed, 12 passed in 0.25s
Success: no issues found in 1 source file
```

### 4. Handoff e encerramento

O agente registra a conclusão no `progress.md` e gera a evidência mínima no handoff:

```json
{
  "task": "fix-coupon-expired-discount",
  "status": "passing",
  "files": ["src/billing/discounts.py", "tests/test_discounts.py"],
  "evidence": "pytest: 1 passed; mypy: clean; exit code: 0"
}
```

**Tempo total decorrido:** ~2 minutos.
## O que NÃO fazer

- Não afirmar que passou sem evidência observável.
- Não transformar a correção em uma mudança de autenticação ou banco.
