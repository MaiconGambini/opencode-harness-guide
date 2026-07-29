---
sidebar_position: 1
---

# Tarefa Pequena

Este guia mostra o fluxo para tarefas de escopo obvio e ate 3 arquivos.

## Quando usar o modo rapido

Use quando o prompt tem:

- Uma sentenca clara.
- Escopo obvio (1-3 arquivos).
- Nenhuma ambiguidade de design.

## Exemplo

**Prompt:** `Adiciona um endpoint GET /api/health`

**Fluxo:**

1. `/harness-session-start` — le o estado atual, declara a task ativa.

2. `/prevc Adiciona um endpoint GET /api/health`
   - Plan: escopo (1 arquivo), AC (`curl retorna 200`), non-goals.
   - Operator approval: "sim".

3. Execute — cria o arquivo com o endpoint.

4. Validate:
   - Ruff check: OK.
   - Pytest: OK.
   - init.ps1: ambos stacks OK.
   - Curl /api/health: retorna o payload esperado.

5. Confirm — feature vai para `passing` com evidencia.

6. Handoff — `session-handoff.md` registra a conclusao.

**Tempo:** ~2-5 minutos. **Skills usados:** 4 (session-start, wip-control,
termination-check, clean-handoff).

## O que NAO fazer

- Nao pular a verificacao. Mesmo uma tarefa de 2 minutos precisa de evidencia.
- Nao expandir o escopo. Se perceber que precisa de mais, pare, planeje de
  novo e peca aprovacao.
