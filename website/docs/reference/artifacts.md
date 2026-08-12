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
| `quality-thresholds.json` | `agent-os/` | Métricas, risk routing e chaves governantes |
| `learned-rules.json` | `agent-os/` | Ledger local de regras ativas, conflitos e aposentadorias |
| `<run>.json` | `docs/harness/findings/` | Janela append-only de findings tipados ligada ao gate |
| `refine-log.md` | `docs/harness/` | Propostas, rejeições e decisões do ciclo Refine |

## Feature list

Cada feature no `feature_list.json` usa os campos abaixo:

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

## Ownership dos artefatos v1.3

- Reviewers retornam records; o scheduler valida e grava cada arquivo de
  findings uma única vez.
- Refine lê findings e ledger, mas não escreve nenhum dos dois.
- Regras aprovadas entram depois do código, em mudança separada, porque o
  rulebook permanece dentro do hash de fonte do gate.
- Números governantes vivem em `quality-thresholds.json`, nunca na prosa.
