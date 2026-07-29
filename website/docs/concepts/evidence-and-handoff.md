---
sidebar_position: 5
---

# Evidência e Handoff

O harness exige que toda conclusão tenha evidência — não basta "funcionou na
minha máquina".

## Camadas de verificação

Antes de declarar uma feature como concluída, três camadas são verificadas:

| Camada | O que verifica |
|---|---|
| **Static** | typecheck e lint passam. |
| **Runtime** | os critérios de aceite do sprint contract são observáveis, comandos foram rodados e o output foi registrado. |
| **System** | o comando de verificação do projeto sai com código 0, e `feature_list.json` e `STATE.md` refletem o novo estado. |

## Exemplo de evidência

```json
{
  "id": "feat-005",
  "status": "passing",
  "evidence": "curl /api/health -> 200 OK, ruff check: OK, pytest: 23 passed, init.ps1: ambos stacks OK"
}
```

A evidência contém output real, não uma descrição do que deveria acontecer.

## Handoff

Toda sessão termina com `harness-clean-handoff`. Ele preenche:

| Campo | Conteúdo |
|---|---|
| **Verified Now** | o que foi concluído nesta sessão. |
| **Changed** | arquivos modificados. |
| **Broken** | o que quebrou (se algo quebrou). |
| **Next Best Step** | a única próxima ação. |

Se o trabalho não terminou, o handoff ainda é feito — a feature vai para
`blocked` com a causa exata e o `Next Best Step` diz exatamente o que fazer.
