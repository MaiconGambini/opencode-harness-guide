---
sidebar_position: 1
slug: intro
---

# Introdução

O Harness OpenCode transforma o OpenCode de um agente que "redescobre tudo
a cada sessão" em um agente que mantém estado, respeita WIP=1, produz
evidência e faz handoff limpo entre sessões.

## Novidades na v1.4

A v1.4 adiciona uma camada de **contexto recuperável e detecção de loop** sobre
o loop contínuo da v1.3:

- **Estado durável mínimo** — um `docs/harness/progress.md` que responde à única
  próxima ação, mais um **briefing derivado** (`scripts/harness-briefing.mjs`)
  carimbado com `sourceHash` que recusa contexto stale.
- **Detecção de loop / slop** — o plugin de tool-activity agora registra sessão,
  outcome e duração e injeta um **lembrete advisory** quando a mesma chamada se
  repete sem progresso (nunca bloqueia).
- **Benchmark de tempo advisory** — `scripts/harness-benchmark.mjs` mede
  wall-clock por fase para calibrar o roteamento de esforço; duração nunca é
  gate.
- **Regressão só no scheduler** — a suíte pesada roda uma vez sobre a árvore
  reconciliada, não por lane; a regra barata "uma correção precisa de teste"
  continua bloqueando por lane.

> **Honesto:** a aceitação ao vivo do loop contínuo da v1.3 (tabela C, C1–C16) —
> injeção chegando na lane, findings de uma execução real, números de liveness —
> ainda **não** foi executada. As capacidades da v1.4 ficam vivas após um restart
> do OpenCode. Veja [Casos de Uso](./adoption/use-cases) para os fluxos novos.

## O que você vai encontrar

| Seção | O que cobre |
|---|---|
| **[Começando](./getting-started/installation)** | Instalação passo a passo e primeira sessão. |
| **[Conceitos](./concepts/why-a-harness)** | PREVC, WIP=1, evidências, os sete componentes e os limites de automação. |
| **[Guias](./guides/small-task)** | Fluxo completo para tarefas pequenas e complexas. |
| **[Referência](./reference/commands)** | Todos os comandos, skills e artefatos. |
| **[Adoção](./adoption/use-cases)** | Casos de uso, prós e contras, segurança e limitações. |
| **[FAQ](./troubleshooting/faq)** | Problemas comuns e soluções. |

## Pré-requisitos

- Windows com PowerShell 5.1+
- OpenCode instalado
- Node.js 20+
- Git

## Instalação rápida

> **Instalação limpa:** se `~/.config/opencode` já existe com arquivos seus, renomeie a pasta para `opencode-backup` **antes** de clonar — não há merge automático. O Passo 1 do [guia completo de instalação](./getting-started/installation) mostra o comando exato.

Clone o repositório na configuração do OpenCode e instale as dependências:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

O que acontece:

- O repositório é clonado direto em `~/.config/opencode`, onde o OpenCode lê a configuração.
- `npm install` baixa as dependências dos plugins e scripts.
- Os arquivos ficam disponíveis para o OpenCode na próxima inicialização.

[Guia completo de instalação &rarr;](./getting-started/installation)

## O princípio

O Harness não tenta substituir o operador. Ele torna claro o que foi
solicitado, o que foi aprovado, o que foi executado, o que foi verificado e
qual é a próxima ação segura. Todo o resto desta documentação é detalhe desse
princípio.
