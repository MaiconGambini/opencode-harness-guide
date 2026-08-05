---
sidebar_position: 4
---

# Estrutura do Repositorio

Organizacao do repositorio `opencode-harness-guide`.

```text
opencode-harness-guide/
|-- opencode.jsonc           Configuracao global (comandos, plugins)
|-- package.json             Dependencias e scripts de verificacao
|-- tsconfig.json            Configuracao TypeScript para plugins
|-- .gitignore               Regras de ignorar para Git
|-- plugins/                 Plugins do runtime (goal, seguranca, scheduler)
|-- skills/                  Skills carregadas pelo OpenCode
|-- command/                 Comandos globais adicionais
|-- scripts/                 Utilitarios PowerShell e Node
|-- templates/               Templates reutilizaveis
|   |-- agent-os/            Specs, standards, judges
|   |-- docs/                Templates de documentacao
|   `-- feature_list.json    Template de lista de features
|-- docs/                    Documentacao interna do harness
|   |-- governance/          Governanca e decisoes de arquitetura
|   `-- superpowers/         Specs e planos
`-- website/                 Site de documentacao (Docusaurus)
    |-- docs/                Fonte da documentacao (pt-BR)
    |-- i18n/                Traducoes (en)
    |-- src/                 Pagina inicial e tema
    `-- static/              Imagens e favicon
```

## O que e carregado pelo OpenCode

O OpenCode le `opencode.jsonc` na inicializacao. Ele registra:

- Comandos globais em `command` (slashes como `/prevc`).
- Skills em `skills/` (qualquer `SKILL.md` dentro de subdiretorio).
- Plugins em `plugins/` (arquivos `.ts` registrados em `opencode.jsonc`).

`package.json` e usado apenas para typecheck e testes dos plugins — nao
afeta o OpenCode diretamente.

## O que NAO e carregado

- `templates/` — sao copiados manualmente para projetos.
- `docs/` — documentacao interna, nao afeta o runtime.
- `scripts/` — utilitarios executados manualmente.
- `website/` — isolado com suas proprias dependencias.
