---
sidebar_position: 5
---

# Agents

Agents são subagentes especializados que o harness pode acionar para uma classe específica de trabalho. Cada um vive em um arquivo `.md` na pasta `agent/` e traz, no frontmatter, uma descrição que define quando ele deve ser usado.

A maioria dos agents é advisory e planning-only: eles clarificam fronteiras, tradeoffs e direção antes da implementação, sem escrever código. O PREVC continua sendo o único controlador do ciclo de vida e seleciona uma capacidade ativa e limitada para as tarefas de implementação.

## Arquitetura e design de sistema

| Agent | Quando usar |
|---|---|
| `architecture-advisor` | Clean architecture, hexagonal, event-driven, layered, monolitos modulares, microserviços, fronteiras de módulo, direção de dependência e caminhos de migração. Advisory e planning-only: clarifica ownership, boundaries e direção antes do planejamento de implementação |
| `system-design-advisor` | Design de sistema escalável: APIs, load balancers, filas, workers, caches, bancos, rate limits, observabilidade, confiabilidade, gargalos e diagramas. Advisory e planning-only, não escreve código |
| `design-patterns-advisor` | Guia de padrões de projeto (Factory, Adapter, Strategy, Builder, Observer, Repository, Specification, CQRS), estrutura em nível de código, manutenibilidade e revisão de anti-patterns. Advisory e planning-only |

## Planejamento e especificação

| Agent | Quando usar |
|---|---|
| `requirements-interrogator` | Requisitos vagos, ambíguos ou incompletos: entrevista o usuário sem dó sobre cada ramo da árvore de decisão, explora o código quando as respostas estão nele e devolve requisitos claros e acionáveis |
| `spec-lead` | Clarificar requisitos, definir escopo e critérios de aceitação, modelar ownership e riscos, e preparar um plano revisável para o PREVC (que segue como único controlador do ciclo de vida) |
| `plan-architect` | Planejamento de implementação para escopo Medium+: cria planos com tasks pequenas (2-5 min), caminhos de arquivo exatos, código completo em cada passo, zero placeholders e disciplina TDD |

## Design de interface

| Agent | Quando usar |
|---|---|
| `design-director` | Direção estética, design systems, componentes de UI, decisões de animação e arquitetura de CSS. Produz direções de design com score DFII, sistemas de tokens, especificações de animação e guia de construção de componentes |

## Implementação

| Agent | Quando usar |
|---|---|
| `kotlin-engineer` | Kotlin Multiplatform, Android nativo, Jetpack Compose, Compose Multiplatform, módulos de domínio compartilhado, coroutines, Flow, setup Gradle/KMP e testes mobile. Implementation-capable, mobile-first com forte suporte a KMP; backend Kotlin só quando explicitamente pedido |
| `web-platform-engineer` | Compatibilidade cross-browser, configuração de build tooling, performance web (Core Web Vitals) e bundling de assets. Cuida de preocupações transversais da plataforma web; não escreve código de componente framework-specific nem código de backend/dados |

## Qualidade e testes

| Agent | Quando usar |
|---|---|
| `code-reviewer` | Quando o código está pronto para a revisão final antes de commit, push ou entrega. Atua como quality gate para consistência de estilo, vulnerabilidades de segurança, conformidade com boas práticas e qualidade geral |
| `test-automation-engineer` | Quando é preciso cobertura de testes abrangente: escreve testes unitários e de integração, executa suítes, diagnostica falhas, verifica fixes e conduz UAT. Roda os testes proativamente e reporta resultados, em vez de só gerar código de teste |
