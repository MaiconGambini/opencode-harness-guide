# Harness OpenCode

Agent workflow with durable state, evidence, and clean handoff between
sessions for [OpenCode](https://opencode.ai) projects.

**[Documentation → opencode-harness-guide](https://maicongambini.github.io/opencode-harness-guide/)**

---

## English

### What it is

Harness OpenCode organizes agent work into predictable cycles: plan,
execute, verify, and hand off. Each session starts knowing where it left
off and ends with a clean handoff for the next one.

Plans are created through the v1.1 planning pipeline — size-gated
`wayfinder`, `grill-with-docs` in AUTO, and `to-tickets` (the lane table) —
then executed by parallel specialists coordinated by `spec-lead`.

### Installation

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

### Verification

```powershell
npm run typecheck
npm test
```

### Structure

- `opencode.jsonc` — global commands and plugins.
- `agent/` — agent definitions (spec-lead, specialists, reviewers).
- `skills/` — skills loaded by OpenCode.
- `plugins/` — runtime plugins (security, permission policy).
- `scripts/` — PowerShell and Node utilities.
- `templates/` — reusable harness templates.
- `website/` — documentation site (Docusaurus).

### Run the docs locally

```powershell
npm --prefix website install
npm --prefix website start
```

Opens `http://localhost:3000/opencode-harness-guide/`.

### Limitations

- Version 1 supports clean install only (clone into an empty folder or after
  a backup). It does not merge into an existing configuration.
- Designed and tested on Windows with PowerShell 5.1+.
- There is no OS sandbox. Policies control permissions, not isolation.

### References

Where this harness was studied and drawn from:

- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Prompt Library](https://code.claude.com/docs/en/prompt-library)
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [Anthropic — Recursive Self-Improvement](https://www.anthropic.com/institute/recursive-self-improvement)
- [mattpocock/skills](https://github.com/mattpocock/skills) — the planning skills (wayfinder, grill-with-docs, to-tickets, implement)
- [walkinglabs/learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering)

### License

This repository is public. Review the files before sharing information that
should not be public.

---

## Português

### O que é

O Harness OpenCode organiza o trabalho com agentes em ciclos previsíveis:
planejar, executar, verificar e entregar. Cada sessão começa sabendo onde
parou e termina com um handoff limpo para a próxima.

Os planos são criados pelo pipeline de planejamento da v1.1 — size-gate
`wayfinder`, `grill-with-docs` em AUTO e `to-tickets` (a lane table) — e
depois executados por specialists em paralelo coordenados pelo `spec-lead`.

### Instalação

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

### Verificação

```powershell
npm run typecheck
npm test
```

### Estrutura

- `opencode.jsonc` — comandos globais e plugins.
- `agent/` — definições de agentes (spec-lead, specialists, reviewers).
- `skills/` — skills carregadas pelo OpenCode.
- `plugins/` — plugins do runtime (segurança, política de permissão).
- `scripts/` — utilitários PowerShell e Node.
- `templates/` — templates reutilizáveis do harness.
- `website/` — site de documentação (Docusaurus).

### Documentação local

```powershell
npm --prefix website install
npm --prefix website start
```

Abre `http://localhost:3000/opencode-harness-guide/`.

### Limitações

- A versão 1 suporta apenas instalação limpa (clone em pasta vazia ou após
  backup). Não faz merge em configuração existente.
- Projetado e testado no Windows com PowerShell 5.1+.
- Não há sandbox de sistema operacional. As policies controlam permissões,
  não isolamento.

### Referências

De onde este harness foi estudado e tirado:

- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Prompt Library](https://code.claude.com/docs/en/prompt-library)
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [Anthropic — Recursive Self-Improvement](https://www.anthropic.com/institute/recursive-self-improvement)
- [mattpocock/skills](https://github.com/mattpocock/skills) — as skills de planejamento (wayfinder, grill-with-docs, to-tickets, implement)
- [walkinglabs/learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering)

### Licença

Este repositório é público. Revise os arquivos antes de compartilhar
informações que não deveriam ser públicas.
