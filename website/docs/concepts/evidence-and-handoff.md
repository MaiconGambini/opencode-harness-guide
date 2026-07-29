---
sidebar_position: 5
---

# Evidencia e Handoff

O harness exige que toda conclusao tenha evidencia — nao basta "funcionou na
minha maquina".

## Camadas de verificacao

Antes de declarar uma feature como concluida, tres camadas sao verificadas:

1. **Static** — typecheck e lint passam.
2. **Runtime** — os criterios de aceite do sprint contract sao observaveis,
   comandos foram rodados e o output foi registrado.
3. **System** — o comando de verificacao do projeto sai com codigo 0, e
   `feature_list.json` e `STATE.md` refletem o novo estado.

## Exemplo de evidencia

```json
{
  "id": "feat-005",
  "status": "passing",
  "evidence": "curl /api/health -> 200 OK, ruff check: OK, pytest: 23 passed, init.ps1: ambos stacks OK"
}
```

A evidencia contem output real, nao uma descricao do que deveria acontecer.

## Handoff

Toda sessao termina com `harness-clean-handoff`. Ele preenche:

- **Verified Now** — o que foi concluido nesta sessao.
- **Changed** — arquivos modificados.
- **Broken** — o que quebrou (se algo quebrou).
- **Next Best Step** — a unica proxima acao.

Se o trabalho nao terminou, o handoff ainda e feito — a feature vai para
`blocked` com a causa exata e o `Next Best Step` diz exatamente o que fazer.
