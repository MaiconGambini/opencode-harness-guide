---
sidebar_position: 2
---

# Skills

Skills são arquivos `SKILL.md` que o OpenCode carrega quando necessário. Cada skill resolve uma classe específica de problema no workflow. Ao todo o repositório traz 106 skills, organizadas abaixo por área.

O OpenCode carrega uma skill de forma preguiçosa (lazy-loading), apenas quando a task combina com a descrição dela.

## Harness — ciclo de vida e workflow

| Skill | Quando usar |
|---|---|
| `prevc-workflow` | Controlar o ciclo de vida de trabalho significativo (Plan → Review → Execute → Validate → Judge → Confirm → Handoff) |
| `harness-session-start` | Início de toda sessão: descobre instruções, estado e task ativa |
| `harness-clean-handoff` | Fim de toda sessão: fecha o estado com evidência e handoff |
| `harness-session-handoff` | Registrar o handoff entre sessões |
| `harness-continuity` | Trabalho multi-sessão: state machine WIP=1 e protocolo de blocked |
| `harness-wip-control` | Antes de um prompt multi-step: decompõe em WIP=1, define AC e non-goals |
| `harness-progress-log` | Manter o log de progresso durável |
| `harness-feature-state` | Antes do Execute: audita o `feature_list.json` |
| `harness-role-separation` | Tarefas complexas ou de UI: separa Planner → Generator → Evaluator |
| `harness-startup-path` | Descobrir o comando de startup do projeto |
| `harness-root-instructions` | Localizar e ler as instruções raiz do repo |
| `harness-runtime-feedback` | Capturar feedback de runtime durante o trabalho |
| `harness-readable-workspace` | Sessão que não orienta: fresh-session test e mapeamento de gaps |
| `harness-context-layer` | Decisões inconsistentes: audita ARCHITECTURE, PRODUCT, RELIABILITY |

## Harness — setup, portabilidade e stack

| Skill | Quando usar |
|---|---|
| `harness-initializer` | Primeira vez no projeto: auditoria não-mutatória das camadas |
| `harness-bootstrap` | Instalar o pacote completo do harness com confirmação |
| `harness-stack-router` | Detectar o stack a partir dos arquivos |
| `harness-standards-router` | Rotear standards de projeto e globais aplicáveis |
| `harness-agent-os-specs` | Criar specs Agent OS a partir dos templates |
| `harness-agent-permissions` | Definir e auditar a matriz de permissão de agentes |
| `harness-portability` | Garantir portabilidade do harness entre projetos |
| `harness-cursor-parity` | Manter paridade de configuração com o Cursor |

## Harness — verificação, qualidade e diagnóstico

| Skill | Quando usar |
|---|---|
| `harness-termination-check` | Antes de declarar "pronto": check em 3 camadas (static → runtime → system) |
| `harness-evaluator-rubric` | Antes do Judge: constrói a rubrica task-specific |
| `harness-eval-contract` | Definir o contrato de avaliação do trabalho |
| `harness-architecture-checks` | Checar aderência arquitetural |
| `harness-quality-snapshot` | Capturar um snapshot de qualidade do código |
| `harness-capstone-audit` | Auditoria abrangente de fechamento |
| `harness-benchmark` | Medir/benchmark do harness |
| `harness-cleanup-scanner` | Escanear resíduos e arquivos a limpar |
| `harness-security-scan` | Auditar secrets e supply-chain sem expor valores |
| `harness-mcp-inventory` | Inventariar MCPs e detectar drift |
| `harness-context-budget` | Auditar carga de contexto e recomendar lazy-loading |
| `harness-status` | Reportar readiness de git, PREVC, goal, handoff, contexto e segurança |
| `harness-worktree-lifecycle` | Segurança do ciclo de vida de worktrees em agentes paralelos |

## Planejamento e specs

| Skill | Quando usar |
|---|---|
| `writing-plans` | Antes de mexer no código, com uma spec ou requisitos de tarefa multi-step |
| `to-spec` | Transformar uma ideia ou nota em uma spec |
| `to-tickets` | Quebrar uma spec em tickets acionáveis |
| `research` | Investigar um tema ou domínio antes de decidir |
| `grill-me` | Ser questionado sem dó sobre um plano ou design até haver entendimento comum |
| `grill-with-docs` | Grilling apoiado na documentação existente |
| `wayfinder` | Orientar-se em um codebase ou domínio desconhecido |
| `domain-modeling` | Modelar o domínio antes de projetar a solução |
| `codebase-design` | Projetar a estrutura do codebase |
| `improve-codebase-architecture` | Melhorar a arquitetura de um codebase existente |
| `prototype` | Construir um protótipo rápido para validar uma ideia |

## Frontend e UI

| Skill | Quando usar |
|---|---|
| `frontend-design` | Criar interfaces com estética intencional e alto craft |
| `interface-design` | Design de interface: dashboards, apps, ferramentas (não sites de marketing) |
| `emil-design-eng` | Polimento de UI, animação e detalhes invisíveis de design |
| `ui-ux-designer` | Wireframes, design systems, pesquisa de usuário e acessibilidade |
| `frontend-dev-guidelines` | Standards de React + TypeScript (Suspense-first, feature-based) |
| `frontend-developer` | Construir componentes React (React 19, Next.js 15) |
| `frontend-mobile-development-component-scaffold` | Scaffolding de componentes prontos, acessíveis e performáticos |
| `frontend-slides` | Apresentações HTML ricas em animação ou conversão de PPT |
| `frontend-ui-dark-ts` | Apps React dark-theme com Tailwind, glassmorphism e Framer Motion |
| `react` | Boas práticas de React/Next.js para apps modernos |
| `nextjs-app-router-patterns` | Server Components, streaming e data fetching no App Router |
| `nextjs-best-practices` | Princípios do Next.js App Router |
| `shadcn-ui` | Padrões de componentes shadcn/ui em Next.js + TypeScript |

## Backend e arquitetura

| Skill | Quando usar |
|---|---|
| `backend-architect` | Design de API escalável, microserviços e sistemas distribuídos |
| `backend-dev-guidelines` | Standards de Node.js + Express + TypeScript (layered, DI, Prisma, Zod) |
| `nodejs-development` | Internals e práticas de produção do Node.js (event loop, streams, workers) |
| `modular-monolith` | Arquitetura de monolito modular com fronteiras de módulo |
| `software-architecture` | Arquitetura de software focada em qualidade |
| `software-engineering` | Princípios centrais de engenharia para código sustentável |

## Python

| Skill | Quando usar |
|---|---|
| `python-pro` | Python 3.12+ moderno com async e otimização de performance |
| `python-patterns` | Decisões de framework, async e estrutura de projeto |
| `python-development-python-scaffold` | Scaffolding de projetos Python de produção (uv, FastAPI, Django) |
| `python-fastapi-development` | Backend FastAPI com async, SQLAlchemy, Pydantic e auth |
| `async-python-patterns` | Asyncio, programação concorrente e async/await |
| `python-packaging` | Empacotar bibliotecas e publicar no PyPI |
| `python-performance-optimization` | Profiling e otimização de código Python lento |
| `python-testing-patterns` | Testes com pytest, fixtures, mocking e TDD |
| `uv-package-manager` | Gerenciamento de dependências e ambientes com uv |

## TypeScript

| Skill | Quando usar |
|---|---|
| `typescript` | Boas práticas gerais de TypeScript |
| `typescript-pro` | TypeScript avançado em produção |
| `typescript-advanced-types` | Sistema de tipos avançado (generics, conditional, mapped types) |

## Banco de dados e autenticação

| Skill | Quando usar |
|---|---|
| `nextjs-supabase-auth` | Integrar Supabase Auth com Next.js App Router (login, middleware, rotas protegidas) |

## Testes, debug e code review

| Skill | Quando usar |
|---|---|
| `test-driven-development` | Escrever testes antes do código, em disciplina TDD |
| `systematic-debugging` | Diante de qualquer bug, falha de teste ou comportamento inesperado, antes de propor fixes |
| `verification-before-completion` | Antes de declarar trabalho concluído |
| `reviewing-code` | Revisar PRs, commits ou diffs contra standards |
| `requesting-code-review` | Preparar e solicitar code review |
| `receiving-code-review` | Receber feedback de review com rigor técnico, sem concordância performática |

## Segurança e WSTG

| Skill | Quando usar |
|---|---|
| `frontend-security-coder` | Práticas seguras no frontend (XSS, sanitização, segurança client-side) |
| `backend-security-coder` | Práticas seguras no backend (input validation, auth, segurança de API) |
| `frontend-mobile-security-xss-scan` | Detectar XSS em React, Vue, Angular e JS puro |
| `wstg-information-gathering` | WSTG: coleta de informação |
| `wstg-configuration-management` | WSTG: gestão de configuração e deployment |
| `wstg-identity-management` | WSTG: gestão de identidade |
| `wstg-authentication` | WSTG: testes de autenticação |
| `wstg-authorization` | WSTG: testes de autorização |
| `wstg-session-management` | WSTG: gestão de sessão |
| `wstg-input-validation` | WSTG: validação de entrada |
| `wstg-error-handling` | WSTG: tratamento de erros |
| `wstg-weak-cryptography` | WSTG: criptografia fraca |
| `wstg-business-logic` | WSTG: lógica de negócio |
| `wstg-client-side` | WSTG: testes client-side |
| `wstg-api-testing` | WSTG: testes de API |

## Meta e ferramentas

| Skill | Quando usar |
|---|---|
| `writing-skills` | Criar, editar ou verificar skills |
| `writing` | Escrever texto claro e bem estruturado |
| `prompt-engineering` | Melhorar prompts e depurar comportamento de agentes |
| `dispatching-parallel-agents` | Diante de 2+ tarefas independentes sem estado compartilhado |
| `using-git-worktrees` | Isolar trabalho de feature em um worktree dedicado |
| `resolving-merge-conflicts` | Resolver conflitos de merge |
| `playwright-cli` | Automação de browser, scraping e testes E2E com Playwright |
