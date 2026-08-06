---
sidebar_position: 4
---

# Estrutura do Repositório

Organização do repositório `opencode-harness-guide`.

```text
opencode-harness-guide/
|-- opencode.jsonc           Configuração global (comandos, plugins)
|-- package.json             Dependências e scripts de verificação
|-- tsconfig.json            Configuração TypeScript para plugins
|-- .gitignore               Regras de ignorar para Git
|-- plugins/                 Plugins do runtime (goal, segurança, scheduler)
|-- skills/                  Skills carregadas pelo OpenCode
|-- command/                 Comandos globais adicionais
|-- scripts/                 Utilitários PowerShell e Node
|-- templates/               Templates reutilizáveis
|   |-- agent-os/            Specs, standards, judges
|   |-- docs/                Templates de documentação
|   `-- feature_list.json    Template de lista de features
|-- docs/                    Documentação interna do harness
|   |-- governance/          Governanca e decisões de arquitetura
|   `-- superpowers/         Specs e planos
`-- website/                 Site de documentação (Docusaurus)
    |-- docs/                Fonte da documentação (pt-BR)
    |-- i18n/                Traduções (en)
    |-- src/                 Página inicial e tema
    `-- static/              Imagens e favicon
```

## O que é carregado pelo OpenCode

O OpenCode lê `opencode.jsonc` na inicialização. Ele registra:

- Comandos globais em `command` (slashes como `/prevc`).
- Skills em `skills/` (qualquer `SKILL.md` dentro de subdiretório).
- Plugins em `plugins/` (arquivos `.ts` registrados em `opencode.jsonc`).

`package.json` e usado apenas para typecheck e testes dos plugins — não
afeta o OpenCode diretamente.

## O que NÃO é carregado

- `templates/` — são copiados manualmente para projetos.
- `docs/` — documentação interna, não afeta o runtime.
- `scripts/` — utilitários executados manualmente.
- `website/` — isolado com suas próprias dependências.
