---
sidebar_position: 1
---

# Comandos

Comandos globais disponiveis no OpenCode apos a instalacao do harness.

## Sessao

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-session-start` | Inicio de toda sessao | Le estado, handoff, feature list, verifica baseline, declara task ativa |
| `/harness-clean-handoff` | Fim de toda sessao | Registra evidencia, blockers, proxima acao e mostra git status |

## Projeto

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-init` | Primeira vez no projeto | Audita sem escrever; produz gap report |
| `/harness-bootstrap` | Instalar o pacote completo | Propoe o full harness com confirmacao e detecta stack |

## Trabalho

| Comando | Quando usar | O que faz |
|---|---|---|
| `/prevc` | Qualquer trabalho significativo | Controla lifecycle: plan, review, execute, validate, judge, confirm, handoff |
| `/prevc run` | Após aprovar o plano | Autoriza a fase Execute — passo obrigatório no [dispatch paralelo](../guides/parallel-dispatch) |
| `/harness-standards` | Antes de planejar | Detecta stack e lista standards e skills relevantes |
| `/harness-spec` | Feature media/grande | Cria spec Agent OS em `agent-os/specs/` |

## Seguranca e diagnostico

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-security-scan` | Auditar superficie de seguranca | Scan de secrets, supply-chain, permissoes |
| `/harness-status` | Verificar readiness | Git, PREVC, goal, handoff, contexto |
| `/harness-context-budget` | Auditar carga de contexto | Skills, plugins, comandos, MCPs |
