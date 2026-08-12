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
|-- scripts/                 Utilitários PowerShell e Node (+ harness-manifest.json compartilhado)
|-- templates/               Templates reutilizáveis
|   |-- agent-os/            Gates, ledger, specs e standards
|   |-- docs/                Findings, Refine, handoff e outros templates
|   `-- feature_list.json    Template de lista de features
|-- catalog/                 Documentos de automação proativa (canônico)
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

Ao instalar os templates em um projeto, os artefatos v1.3 vivem no próprio
repositório: `agent-os/quality-thresholds.json`,
`agent-os/learned-rules.json`, `agent-os/standards/` e
`docs/harness/findings/`. O ledger não promove regras entre projetos
automaticamente.

## Observação sobre a distribuição pública

Esta distribuição pública **não inclui** skills ofensivas de segurança (famílias
recon, redteam, hiagosh, chains e ataques avulsos), nem evidência de runtime
local (relatórios de gate em `docs/harness/quality/`, notas de revisão em
`docs/harness/review/`). As exclusões são declaradas em
`scripts/harness-manifest.json` e verificadas por máquina: o script de export
recusa pacotes que as violem e o workflow `.github/workflows/validate-harness.yml`
bloqueia a mirror pública que as contenha. As skills de segurança curadas e
legítimas (`skills/wstg-*` e as defensivas `*-security-coder`) permanecem.
Esses artefatos excluídos existem apenas no repositório privado do autor.
