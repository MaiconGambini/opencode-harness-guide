---
sidebar_position: 3
---

# Artefatos

Arquivos que o harness lê e escreve durante o ciclo de vida.

## Estado

| Arquivo | Caminho | Proposito |
|---|---|---|
| `AGENTS.md` | raiz | Regras do projeto, entry points |
| `feature_list.json` | raiz | Fonte da verdade de WIP=1 |
| `STATE.md` | `.specs/project/` | Progresso durável, blockers, decisões |
| `session-handoff.md` | `docs/harness/` | Transferência entre sessões |
| `sprint-contract.md` | `docs/harness/` | Escopo, AC, plano de verificação |

## Feature list

Cada feature no `feature_list.json` tem 9 campos:

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `priority` | Ordem de execução |
| `área` | Área do projeto |
| `title` | Nome curto |
| `user_visible_behavior` | O que o usuário/agente vê quando funciona |
| `dependencies` | IDs de features que devem ser concluídas antes |
| `status` | `not_started`, `in_progress`, `passing` ou `blocked` |
| `verification` | Comando que prova que funciona |
| `evidence` | Output real capturado após verificação |
| `notes` | Informação adicional |

## Regras de status

- Apenas UMA feature `in_progress` por vez.
- `passing` exige `evidence` preenchida com output real.
- `blocked` exige a causa exata no campo `evidence`.
- Nenhuma feature `in_progress` com dependências não resolvidas.
