---
sidebar_position: 5
---

# Agents

Agents são subagentes especializados que o harness pode acionar para uma classe específica de trabalho. A maioria vive em um arquivo `.md` na pasta `agent/` e traz, no frontmatter, uma descrição que define quando ele deve ser usado. Alguns agentes são definidos apenas na configuração (`opencode.jsonc`) — como `refiner` e `rule-verifier` — e podem não ter arquivo próprio em `agent/`.

A maioria dos agents é advisory e planning-only: eles clarificam fronteiras, tradeoffs e direção antes da implementação, sem escrever código. O PREVC continua sendo o único controlador do ciclo de vida e seleciona uma capacidade ativa e limitada para as tarefas de implementação.

**Permissões:** revisores (`code-reviewer`, `architecture-reviewer`) e os agentes do continual harness (`refiner`, `rule-verifier`) rodam com `edit` e `bash` negados: leem e reportam, não alteram arquivos nem executam comandos. Implementadores (kotlin, web, python, vue, postgres, backend-infra, test-automation, fixer) têm `edit`/`bash` permitidos apenas para as tarefas da lane.

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
| `python-engineer` | Serviços e bibliotecas Python: endpoints FastAPI, modelos Pydantic, SQLAlchemy 2.0, async I/O, CLIs, lógica de dados/domínio e cobertura pytest. Implementation-capable; adapta ao stack detectado (uv, ruff, pytest) |
| `vue-engineer` | Frontends Vue 3: Composition API, TypeScript, Pinia, Vue Router, Vite/Vitest e Nuxt quando o projeto usa. Implementation-capable; adapta ao stack detectado (Vite ou Nuxt, `<script setup>`, vue-tsc) |
| `postgres-engineer` | PostgreSQL: schema e migrations Alembic, indexação, performance de query, isolamento de transação, locking (advisory locks, FOR UPDATE, SKIP LOCKED) e padrões de acesso SQLAlchemy 2.0. Implementation-capable para schema/query/migration; nunca escreve em banco de produção diretamente |
| `backend-infra-engineer` | Plataforma e infraestrutura backend fora de código de componente: Docker/Compose, pipelines de CI, env e configuração, drivers/ODBC e preflight de conectividade, scripts de deploy, observabilidade e confiabilidade (timeouts, retries, health checks, rollback). Implementation-capable para config/infra; não escreve lógica de negócio |
| `fixer` | Executa uma lane de implementação bounded já planejada dentro de um run PREVC aprovado: objetivo explícito, ownership declarado e comando de verificação; escreve apenas os arquivos declarados e reporta evidência. Não planeja, não negocia escopo e não despacha subagentes |

## Qualidade e testes

| Agent | Quando usar |
|---|---|
| `code-reviewer` | Quando o código está pronto para a revisão final antes de commit, push ou entrega. Atua como quality gate para consistência de estilo, vulnerabilidades de segurança, conformidade com boas práticas e qualidade geral. Read-only: `edit` e `bash` negados |
| `test-automation-engineer` | Quando é preciso cobertura de testes abrangente: escreve testes unitários e de integração, executa suítes, diagnostica falhas, verifica fixes e conduz UAT. Roda os testes proativamente e reporta resultados, em vez de só gerar código de teste |

## Continual harness v1.3

| Agent | Quando usar |
|---|---|
| `architecture-reviewer` | Revisão estrutural read-only em paralelo com `code-reviewer`; retorna findings tipados ao scheduler e não grava arquivos (`edit`/`bash` negados) |
| `refiner` | Depois do Judge, lê a janela de trajetória e propõe uma melhoria limitada; não escreve, não delega e não participa do veredito. Definido em `opencode.jsonc` — pode não ter arquivo próprio em `agent/` |
| `rule-verifier` | Tenta refutar uma proposta de regra em prosa antes de qualquer ativação elegível; permanece read-only e não substitui a confirmação exigida para regras bloqueantes ou efeitos de alto risco. Definido em `opencode.jsonc` — pode não ter arquivo próprio em `agent/` |

## Segurança e reconhecimento

| Agent | Quando usar |
|---|---|
| `security-analyst` | Teste de segurança autorizado e revisão defensiva: roteia o trabalho para as skills de segurança que **fazem parte desta distribuição pública** (`wstg-*`, `*-security-coder`, `harness-security-scan`) e devolve um plano bounded e evidence-first para o alvo. Famílias que não são distribuídas (recon, redteam, hiagosh, chains e skills de ataque standalone) são **rejeitadas com uma nota de instalação** — rodar no harness privado onde estão instaladas, ou instalar as skills separadamente — nunca roteadas para um nome que não existe em `skills/`. Read-only e advisory por padrão; exige contexto autorizado (pentest, CTF ou ativo próprio); não executa ataques destrutivos nem evasão |
| `explorer` | Reconhecimento read-only de codebase durante o Prepare do PREVC ou perguntas de roteamento do scheduler: onde algo vive, quais arquivos uma mudança tocaria, qual é o padrão existente, onde estão os call sites. Devolve evidência file:line; nunca edita nem executa comandos |

O scheduler valida e grava findings. Reviewers e Refine nunca são escritores do
ledger ou da janela. Veja [Continual Harness v1.3](../concepts/continual-harness-v1-3).
