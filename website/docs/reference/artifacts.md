---
sidebar_position: 3
---

# Artefatos

Arquivos que o harness le e escreve durante o ciclo de vida.

## Estado

| Arquivo | Caminho | Proposito |
|---|---|---|
| `AGENTS.md` | raiz | Regras do projeto, entry points |
| `feature_list.json` | raiz | Fonte da verdade de WIP=1 |
| `STATE.md` | `.specs/project/` | Progresso duravel, blockers, decisoes |
| `session-handoff.md` | `docs/harness/` | Transferencia entre sessoes |
| `sprint-contract.md` | `docs/harness/` | Escopo, AC, plano de verificacao |

## Feature list

Cada feature no `feature_list.json` tem 9 campos:

| Campo | Descricao |
|---|---|
| `id` | Identificador unico |
| `priority` | Ordem de execucao |
| `area` | Area do projeto |
| `title` | Nome curto |
| `user_visible_behavior` | O que o usuario/agente ve quando funciona |
| `dependencies` | IDs de features que devem ser concluidas antes |
| `status` | `not_started`, `in_progress`, `passing` ou `blocked` |
| `verification` | Comando que prova que funciona |
| `evidence` | Output real capturado apos verificacao |
| `notes` | Informacao adicional |

## Regras de status

- Apenas UMA feature `in_progress` por vez.
- `passing` exige `evidence` preenchida com output real.
- `blocked` exige a causa exata no campo `evidence`.
- Nenhuma feature `in_progress` com dependencias nao resolvidas.
