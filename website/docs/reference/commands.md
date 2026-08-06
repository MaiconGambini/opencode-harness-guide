---
sidebar_position: 1
---

# Comandos

Comandos globais disponíveis no OpenCode após a instalação do harness.

## Sessão

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-session-start` | Início de toda sessão | Lê estado, handoff, feature list, verifica baseline, declara task ativa |
| `/harness-clean-handoff` | Fim de toda sessão | Registra evidência, blockers, próxima ação e mostra git status |

## Projeto

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-init` | Primeira vez no projeto | Audita sem escrever; produz gap report |
| `/harness-bootstrap` | Instalar o pacote completo | Propõe o full harness com confirmação e detecta stack |

## Trabalho

| Comando | Quando usar | O que faz |
|---|---|---|
| `/prevc` | Qualquer trabalho significativo | Controla lifecycle: plan, review, execute, validate, judge, confirm, handoff |
| `/prevc run` | Trabalho ad-hoc, após aprovar | Autoriza a fase Execute. No [auto mode](../guides/parallel-dispatch) (executar um plano nomeado) não precisa — a instrução já autoriza |
| `/plan` | Criar um plano (v1.1) | Pipeline de planejamento: size-gate `wayfinder`, `grill-with-docs` em AUTO, `to-tickets` = lane table. Para em `awaiting_plan_approval`. Veja [como os planos são feitos](../guides/planning-pipeline) |
| `/harness-standards` | Antes de planejar | Detecta stack e lista standards e skills relevantes |
| `/harness-spec` | Feature media/grande | Cria spec Agent OS em `agent-os/specs/` |
| `/shape-spec` | Escape hatch manual | Fluxo Agent OS pesado. Prefira `/plan` no caminho padrão |

## Segurança e diagnóstico

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-security-scan` | Auditar superficie de segurança | Scan de secrets, supply-chain, permissões |
| `/harness-status` | Verificar readiness | Git, PREVC, goal, handoff, contexto |
| `/harness-context-budget` | Auditar carga de contexto | Skills, plugins, comandos, MCPs |
