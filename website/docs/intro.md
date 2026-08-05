---
sidebar_position: 1
slug: intro
---

# Introducao

O Harness OpenCode transforma o OpenCode de um agente que "redescobre tudo
a cada sessao" em um agente que mantem estado, respeita WIP=1, produz
evidencia e faz handoff limpo entre sessoes.

## O que voce vai encontrar

- **[Comecando](./getting-started/installation)** — instalacao em 3 passos e
  primeira sessao.
- **[Conceitos](./concepts/why-a-harness)** — PREVC, WIP=1, evidencias e os
  sete componentes.
- **[Guias](./guides/small-task)** — fluxo completo para tarefas pequenas e
  complexas.
- **[Referencia](./reference/commands)** — todos os comandos, skills e
  artefatos.
- **[Adocao](./adoption/use-cases)** — casos de uso, pros e contras,
  seguranca e limitacoes.
- **[FAQ](./troubleshooting/faq)** — problemas comuns e solucoes.

## Pre-requisitos

- Windows com PowerShell 5.1+
- OpenCode instalado
- Node.js 20+
- Git

## Instalacao rapida

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

[Guia completo de instalacao &rarr;](./getting-started/installation)
