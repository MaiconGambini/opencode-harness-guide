---
sidebar_position: 4
---

# Estrutura do Repositório

Organização do repositório público `opencode-harness-guide`.

```text
opencode-harness-guide/
|-- opencode.jsonc           Configuração global (comandos, plugins)
|-- package.json             Dependências e scripts de verificação
|-- tsconfig.json            Configuração TypeScript para plugins
|-- .gitignore               Regras de ignorar para Git
|-- harnessopencode.md       Guia monolítico do harness (referência)
|-- plugins/                 Plugins do runtime (goal, segurança, scheduler)
|-- skills/                  Skills carregadas pelo OpenCode
|-- agent/                   Definições de agents (subagentes especializados)
|-- command/                 Comandos globais adicionais
|-- scripts/                 Utilitários PowerShell e Node
|-- templates/               Templates reutilizáveis
|   |-- agent-os/            Specs, standards, judges
|   |-- docs/                Templates de documentação
|   `-- feature_list.json    Template de lista de features
|-- catalog/ plan/ shape/    Documentos de automação proativa
|-- tests/                   Testes dos plugins
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
- Agents em `agent/` (definições de subagentes especializados).

`package.json` é usado apenas para typecheck e testes dos plugins — não
afeta o OpenCode diretamente.

## O que NÃO é carregado

- `templates/` — são copiados manualmente para projetos.
- `scripts/` — utilitários executados manualmente.
- `website/` — isolado com suas próprias dependências.
- `harnessopencode.md` — guia de referência, não afeta o runtime.

## Observação sobre a distribuição pública

Esta distribuição pública **não inclui** material interno de governança,
backups, estado de runtime nem skills ofensivas de segurança (recon,
redteam, exploração). Esses artefatos permanecem apenas no repositório
privado do autor.
