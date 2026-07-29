---
sidebar_position: 1
slug: intro
---

# Introdução

O Harness OpenCode transforma o OpenCode de um agente que "redescobre tudo
a cada sessão" em um agente que mantém estado, respeita WIP=1, produz
evidência e faz handoff limpo entre sessões.

## O que você vai encontrar

| Seção | O que cobre |
|---|---|
| **[Começando](./getting-started/installation)** | Instalação em 3 passos e primeira sessão. |
| **[Conceitos](./concepts/why-a-harness)** | PREVC, WIP=1, evidências e os sete componentes. |
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
