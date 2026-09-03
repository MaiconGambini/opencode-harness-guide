---
sidebar_position: 1
---

# Tarefa Pequena

> **Identidade OpenCode:** registre metodologia, continuidade, escopo e handoff; para um bugfix de dois minutos, a forma é curta, mas a prova continua obrigatória.

Este guia mostra uma correção óbvia em um único arquivo, sem abrir um ciclo completo de planejamento.

## Quando usar o modo rápido

Use quando o prompt tem uma sentença clara, escopo de um arquivo e nenhuma ambiguidade. O fast path bypassa a cerimônia completa do PREVC (spec, lane table e scheduler), mas nunca bypassa validação nem o registro do handoff.

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
python -c "from pathlib import Path; p=Path('app/main.py'); p.write_text(p.read_text().replace('healthy', 'ok'))"
python -m pytest tests/test_health.py -q
```

**Evidência esperada/representativa** (não executada neste guia):

```text
tests/test_health.py::test_health_returns_ok PASSED
1 passed in 0.18s
```

O escopo de um arquivo não precisa do scheduler do OpenCode nem de subagents. Depois da correção, registre no `session-handoff.md` o prompt, o arquivo, o comando e a saída observada/esperada; se houver servidor disponível, acrescente `curl http://127.0.0.1:8000/api/health`. Se surgir uma segunda decisão ou arquivo, retorne ao [fluxo de feature complexa](./complex-feature).

## O que NÃO fazer

- Não afirmar que passou sem evidência observável.
- Não transformar a correção em uma mudança de autenticação ou banco.
