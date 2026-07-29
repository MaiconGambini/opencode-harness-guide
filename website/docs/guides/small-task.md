---
sidebar_position: 1
---

# Tarefa Pequena

Este guia mostra o fluxo para tarefas de escopo óbvio e até três arquivos. É o
caminho mais curto do harness: sem sprint contract, sem decomposição em
subtasks, mas ainda com verificação e handoff obrigatórios.

## Quando usar o modo rápido

Use o modo rápido quando o prompt tem, ao mesmo tempo:

- Uma sentença clara e uma única intenção.
- Escopo óbvio, tipicamente de um a três arquivos.
- Nenhuma ambiguidade de design a resolver antes de começar.

Se qualquer um desses pontos falhar — o prompt pede várias coisas, você não
sabe quais arquivos tocar, ou há uma decisão de arquitetura pendente — pare e
vá para o guia de [Feature Complexa](./complex-feature.md).

## Fluxo passo a passo

O exemplo a seguir cobre uma tarefa real de ponta a ponta.

**Prompt:** `Adiciona um endpoint GET /api/health`

### 1. Abrir a sessão

```text
/harness-session-start
```

- Lê o estado atual do projeto (`STATE.md`, `feature_list.json`).
- Declara qual é a task ativa e confirma que o WIP está em 1.
- Roda a verificação de baseline para garantir que o projeto está saudável
  antes de qualquer mudança.

### 2. Planejar com o PREVC

```text
/prevc Adiciona um endpoint GET /api/health
```

- **Plan** — define o escopo (um arquivo), os critérios de aceite (`curl`
  retorna `200`) e os non-goals (nada de autenticação, métricas ou banco).
- **Operator approval** — o harness apresenta o plano e aguarda o seu "sim"
  antes de tocar em qualquer arquivo.

Um plano bom para uma tarefa pequena cabe em poucas linhas. Se o plano começar
a crescer, é sinal de que a tarefa não era pequena.

### 3. Executar

- Cria o arquivo com o endpoint e nada além disso.
- Mantém a mudança dentro do escopo aprovado.

### 4. Validar

A validação é obrigatória mesmo em tarefas de dois minutos. Cada comando é
rodado e o output é capturado como evidência:

```text
ruff check .
pytest
./init.ps1
curl http://localhost:8000/api/health
```

- **Ruff check** — sem erros de lint.
- **Pytest** — todos os testes passam.
- **init.ps1** — ambos os stacks sobem sem erro.
- **Curl `/api/health`** — retorna o payload esperado com status `200`.

### 5. Confirmar

- A feature vai para o estado `passing`, acompanhada da evidência coletada
  no passo anterior.
- Sem evidência, não há confirmação.

### 6. Handoff

```text
/harness-clean-handoff
```

- O `session-handoff.md` registra a conclusão, os arquivos tocados e o
  resultado da verificação.

## Resumo

**Tempo típico:** cerca de 2 a 5 minutos.
**Skills usados:** 4 — `session-start`, `wip-control`, `termination-check` e
`clean-handoff`.

## O que NÃO fazer

- **Não pule a verificação.** Mesmo uma tarefa de dois minutos precisa de
  evidência objetiva. "Parece que funcionou" não é evidência.
- **Não expanda o escopo no meio do caminho.** Se perceber que a tarefa é
  maior do que parecia, pare, planeje de novo e peça nova aprovação. Trabalho
  adjacente descoberto vira uma próxima tarefa, nunca uma extensão silenciosa
  da tarefa ativa.
- **Não deixe o handoff para depois.** O handoff é o que permite retomar o
  contexto em outro dia — pular é perder continuidade.
