---
sidebar_position: 1
---

# Comandos

Comandos globais disponíveis no OpenCode após a instalação do harness. Cada comando executa uma skill global ou um script de diagnóstico. Esta referência lista todos os comandos por família e, em seguida, detalha o passo a passo dos comandos principais.

Os nomes começam com `/` quando invocados no chat do OpenCode (por exemplo, `/prevc`).

## Visão geral por família

### Sessão

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-session-start` | No início de toda sessão | Descobre instruções raiz, estado de progresso, feature state e caminho de startup; roda o baseline se seguro; declara a task ativa |
| `/harness-clean-handoff` | No fim de toda sessão | Coleta evidência, blockers, notas de progresso, handoff e git status; devolve um relatório de handoff |

### Projeto

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-init` | Primeira vez em um projeto | Audita as camadas do harness sem escrever nada; produz um gap report com correções recomendadas |
| `/harness-bootstrap` | Instalar o pacote completo do harness | Propõe o pacote completo (AGENTS.md, feature_list.json, docs/harness, agent-os) e escreve apenas após confirmação |
| `/harness-standards` | Antes de planejar ou implementar | Detecta o stack e carrega standards de projeto e globais; devolve perfis de risco, validação, permissão e skills aplicáveis |
| `/harness-spec` | Feature média ou grande | Cria ou propõe uma spec Agent OS em `agent-os/specs/YYYY-MM-DD-HHMM-slug/` |

### Trabalho

| Comando | Quando usar | O que faz |
|---|---|---|
| `/prevc` | Qualquer trabalho significativo | Controla o ciclo de vida completo: Plan, Review, Execute, Validate, Judge, Confirm e Handoff |
| `/goal` | Rastrear objetivo de longo prazo | Comando registrado pelo plugin de goal (retenção de 30 dias); memória de objetivo separada do PREVC |

### Agent OS

| Comando | Quando usar | O que faz |
|---|---|---|
| `/plan-product` | Iniciar documentação de produto | Cria a documentação base do produto em `agent-os/product/` |
| `/shape-spec` | Estruturar uma spec leve | Modela uma spec enxuta em modo de planejamento; não implementa até aprovação |
| `/discover-standards` | Documentar padrões do código | Descobre padrões existentes e cria standards em `agent-os/standards/` |
| `/index-standards` | Reconstruir o índice de standards | Escaneia `agent-os/standards/` e regenera o `index.yml` alfabetizado |
| `/inject-standards` | Trazer standards ao contexto | Lê o `index.yml`, sugere standards relevantes e injeta o conteúdo na conversa, skill ou planejamento |

### Segurança e diagnóstico

| Comando | Quando usar | O que faz |
|---|---|---|
| `/harness-security-scan` | Auditar superfície de segurança | Escaneia OpenCode, Cursor, harness do repo, MCPs e memória buscando riscos de supply-chain e secrets; resume PASS/WARN/FAIL sem imprimir valores |
| `/harness-mcp-inventory` | Inventariar MCPs | Lista servidores MCP do OpenCode/Cursor, detecta drift e sinaliza chaves com secret sem expor valores |
| `/harness-context-budget` | Auditar carga de contexto | Reporta o orçamento de contexto de skills, plugins, comandos e MCPs; recomenda lazy-loading |
| `/harness-status` | Verificar readiness | Imprime status de git, PREVC, goal, handoff, contexto e segurança; aponta a próxima melhor ação |
| `/harness-worktree-lifecycle` | Agentes paralelos com worktrees | Reporta segurança do ciclo de vida de worktrees (dirty, clean, stale) sem apagar arquivos |

### Orca Graph Engineer

| Comando | Quando usar | O que faz |
|---|---|---|
| `/orca-graph-plan` | Planejar waves | Plano de waves read-only a partir de `feature_list.json` (waves, chain depth, ciclos); não dispara nada |
| `/orca-graph-run` | Disparar a wave atual | Cria tasks wave a wave, sobe workers Codex, supervisiona e para no gate de merge humano (exige `--confirm`) |
| `/orca-graph-next` | Após você mergear | Verifica o merge real de cada blocker e avança para a próxima wave; não dispara workers |
| `/orca-graph-status` | Acompanhar waves em voo | Mostra task-list, `wave-state.json` e triagem de PR/CI; sinaliza drift; read-only |

### Comandos de interface e investigação

Comandos locais definidos na pasta `command/`, focados em design de interface, investigação e PR.

| Comando | Quando usar | O que faz |
|---|---|---|
| `/init` | Construir UI com craft | Constrói interface (dashboards, apps, ferramentas) seguindo a skill `interface-design`; lê o `SKILL.md` antes de qualquer código |
| `/audit` | Checar código contra o design system | Verifica violações de espaçamento, profundidade, cor e padrão contra `.interface-design/system.md` |
| `/critique` | Revisar craft do build | Critica o build como um design lead e reconstrói o que ficou no padrão genérico |
| `/extract` | Criar system.md a partir de código | Extrai padrões de design do código existente (tsx, jsx, vue, svelte) e gera um `system.md` |
| `/status` | Ver estado do design system | Mostra direção, tokens e padrões do design system atual |
| `/investigate` | Descoberta antes de planejar | Faz de 3 a 5 perguntas focadas e analisa o código antes de planejar ou implementar |
| `/investigate-batch` | Descoberta em lote | Faz até 5 perguntas de uma vez (via AskUserQuestion) e depois analisa o código |
| `/trim` | Encolher descrição de PR | Reduz a descrição do PR atual em 70% preservando o essencial |

## Passo a passo dos comandos principais

### 1. Trabalhar em algo significativo — `/prevc`

```
/prevc prepare <objetivo>
```

- Executa a skill global `prevc-workflow`, o único controlador do ciclo de vida para trabalho significativo.
- `prepare <objetivo>` faz descoberta, classifica o risco e cria um plano, parando em `awaiting_plan_approval` na conversa.
- Nunca invoca `/goal` nem as ferramentas de goal; os rótulos do ciclo de vida ficam na conversa e nos arquivos de harness existentes.
- Roteia operações rotineiras de baixo risco (session-start, checagens de status, instalação explícita de dependência, formatação, reparos de teste estreitos) por um fast path com verificação objetiva, sem a cerimônia do PREVC.

```
/prevc run
```

- Aceita aprovação explícita do operador em linguagem normal ou `/prevc run`; não exige goal ID nem `/goal confirm`.
- Automatiza Review → Execute → Validate → Judge dentro do escopo aprovado e dos orçamentos declarados (arquivos, permissões, verificação, retry, ferramentas, duração).
- Em trabalho de baixo risco, permite um passe de reparo limitado para um pré-requisito de verificação recém-exposto (teste, lint, typecheck ou build dev-dependency ausente) e então roda a validação completa de novo.
- Preserva os caminhos de risco low, medium, high e untrusted: medium+ exige evidência de contexto/segurança ou skip documentado; high/untrusted exige reconhecimento explícito de risco antes de executar.
- Nunca faz commit, push, deploy, troca de branch ou operações Git remotas automaticamente.

### 2. Auditar um projeto — `/harness-init`

```
/harness-init
```

- Executa a skill global `harness-initializer`.
- Detecta a raiz do repo, instruções raiz, estado de progresso, feature state, caminho de startup, camada de Judge/avaliação, skills de harness, postura de segurança, postura de hooks/plugins, higiene de MCP/plugins, orçamento de contexto, higiene de memória de goal, worktrees, permissões de agentes e paridade com Cursor.
- Produz um gap report não-mutatório com correções recomendadas.
- Não cria nem edita arquivos a menos que o usuário aprove uma correção específica.
- Não assume que `init.ps1`, `feature_list.json` ou `.specs/project/STATE.md` existam.

### 3. Instalar o harness completo — `/harness-bootstrap`

```
/harness-bootstrap
```

- Executa a skill global `harness-bootstrap`.
- Sempre propõe o pacote completo: `AGENTS.md`, `feature_list.json`, `docs/harness` (progress, handoff, sprint-contract, security-policy, hook-policy, context-budget, eval-contract, agent-permission-matrix, status), `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/RELIABILITY.md`, `agent-os/judges/project-judge.md`, `agent-os/standards` e templates de spec incluindo `evals.md`.
- Primeiro audita o repo atual, detecta o stack com `harness-stack-router` e descobre o caminho de startup.
- Mostra os arquivos exatos a criar, mesclar ou pular e pede confirmação explícita antes de escrever qualquer coisa.
- Nunca assume `init.ps1`, `feature_list.json`, `.specs/project/STATE.md` nem caminhos do repo.

### 4. Iniciar a sessão — `/harness-session-start`

```
/harness-session-start
```

- Executa a skill global `harness-session-start` como operação de rotina direta, não como trabalho de PREVC.
- Nunca invoca `/goal` nem as ferramentas de goal.
- Lê instruções raiz, se existirem.
- Localiza o estado de progresso em `.specs/project/STATE.md`, `docs/harness/progress.md` ou `agent-progress.md`.
- Localiza o feature state em `feature_list.json` ou `.specs/features/*/tasks.md`.
- Lê `docs/harness/session-handoff.md`, se presente.
- Descobre o comando de startup com `harness-startup-path` e o roda se for seguro.
- Roda `git log --oneline -3` em repos git.
- Aplica WIP=1 quando há estado durável.
- Termina declarando: Active task, AC (critérios observáveis). Se o startup falhar, registra o erro exato no arquivo de progresso e para.

### 5. Fechar a sessão — `/harness-clean-handoff`

```
/harness-clean-handoff
```

- Executa a skill global `harness-clean-handoff` como subrotina de handoff do PREVC.
- Coleta evidência, blockers, notas de progresso, um session handoff, resultados de verificação aprovada e git status.
- Somente o PREVC escreve transições de ciclo de vida após o desfecho do operador.
- Quando invocado diretamente, devolve apenas um relatório de handoff: não marca feature state, não infere confirmação nem afirma conclusão.

### 6. Carregar standards e skills — `/harness-standards`

```
/harness-standards
```

- Executa `harness-stack-router` e depois `harness-standards-router`.
- Detecta o stack a partir dos arquivos antes de adivinhar.
- Carrega primeiro os standards de projeto em `agent-os/standards`, depois os templates de standards globais.
- Devolve perfil de risco, perfil de validação, perfil de permissão de agente, standards de segurança, mínimos de checagem e skills aplicáveis à task atual.
- Não implementa código: produz apenas o relatório de roteamento de standards e skills.

### 7. Criar uma spec — `/harness-spec`

```
/harness-spec <objetivo>
```

- Executa `harness-agent-os-specs` para o objetivo pedido.
- Cria ou propõe `agent-os/specs/YYYY-MM-DD-HHMM-slug/` com `spec.md`, `plan.md`, `tasks.md`, `verification.md` e `decisions.md` a partir dos templates globais.
- Substitui placeholders por requisitos concretos, critérios de aceitação, comandos de verificação e decisões.
- Pergunta antes de escrever se o repo alvo ainda não tem harness.
