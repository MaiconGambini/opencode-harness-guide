---
sidebar_position: 1
slug: intro
---

# Introdução

O Harness OpenCode transforma o OpenCode de um agente que "redescobre tudo
a cada sessão" em um agente que mantém estado, respeita WIP=1, produz
evidência e faz handoff limpo entre sessões.

## O que você vai encontrar

- **[Começando](./getting-started/installation)** — instalação em 3 passos e
  primeira sessão.
- **[Conceitos](./concepts/why-a-harness)** — PREVC, WIP=1, evidências e os
  sete componentes.
- **[Guias](./guides/small-task)** — fluxo completo para tarefas pequenas e
  complexas, e [como os planos são feitos](./guides/planning-pipeline) (v1.1).
- **[Referência](./reference/commands)** — todos os comandos, skills e
  artefatos.
- **[Adoção](./adoption/use-cases)** — casos de uso, pros e contras,
  segurança e limitações.
- **[FAQ](./troubleshooting/faq)** — problemas comuns e soluções.

## Pré-requisitos

- Windows com PowerShell 5.1+
- OpenCode instalado
- Node.js 20+
- Git

## Instalação rápida

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

[Guia completo de instalação &rarr;](./getting-started/installation)
