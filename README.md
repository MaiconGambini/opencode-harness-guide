# Harness OpenCode

Workflow de agentes com estado durável, evidências e handoff entre sessões
para projetos [OpenCode](https://opencode.ai).

## Português

O Harness OpenCode organiza o trabalho com agentes em ciclos previsíveis de
planejamento, execução, validação, avaliação e entrega. A versão v1.3 adiciona
um **continual harness**: gates medidos, findings tipados, um ledger local de
regras aprendidas e injeção das regras ativas nas lanes relevantes.

A fase **Refine** lê a trajetória depois do Judge e pode propor uma melhoria,
mas é read-only, não participa do veredito e não escreve regras. A ativação
automática de regras em prosa vem desabilitada por
`learned_rules.auto_activate_prose_observe`; ela não deve ser tratada como
ativa antes da aceitação ao vivo e de um restart do OpenCode.

- [Documentação em português](https://maicongambini.github.io/opencode-harness-guide/)
- [Casos de uso práticos](https://maicongambini.github.io/opencode-harness-guide/docs/adoption/use-cases)
- [Continual harness v1.3](https://maicongambini.github.io/opencode-harness-guide/docs/concepts/continual-harness-v1-3)

## English

OpenCode Harness organizes agent work into predictable planning, execution,
validation, judging, and delivery cycles. Version v1.3 adds a **continual
harness**: measured gates, typed findings, a project-local learned-rule ledger,
and injection of active rules into relevant lanes.

The **Refine** phase reads the trajectory after Judge and may propose an
improvement, but it is read-only, has no vote in the verdict, and does not write
rules. Automatic prose-rule activation ships disabled through
`learned_rules.auto_activate_prose_observe`; do not treat it as live before
live acceptance and an OpenCode restart.

- [English documentation](https://maicongambini.github.io/opencode-harness-guide/en/)
- [Practical use cases](https://maicongambini.github.io/opencode-harness-guide/en/docs/adoption/use-cases)
- [Continual harness v1.3](https://maicongambini.github.io/opencode-harness-guide/en/docs/concepts/continual-harness-v1-3)

## Instalação / Installation

> Instalação limpa / Clean install: se `~/.config/opencode` já existe, renomeie
> para `opencode-backup` antes de clonar — não há merge automático / if
> `~/.config/opencode` already exists, rename it to `opencode-backup` before
> cloning — there is no automatic merge. Passo a passo / Step by step:
> [Guia de instalação / Installation guide](https://maicongambini.github.io/opencode-harness-guide/docs/getting-started/installation).

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

## Verificação / Verification

```powershell
npm run typecheck
npm test
```

## Estrutura / Structure

- `opencode.jsonc` — comandos globais, agents e plugins.
- `skills/` — skills carregadas pelo OpenCode.
- `agent/` — capacidades especializadas e suas permissões.
- `plugins/` — plugins do runtime.
- `scripts/` — gates e utilitários PowerShell e Node.
- `templates/` — artefatos reutilizáveis do harness.
- `website/` — site bilíngue de documentação (Docusaurus).

## Documentação local / Local docs

```powershell
npm --prefix website install
npm --prefix website start
```

Abra / Open `http://localhost:3000/opencode-harness-guide/`.

## Limitações / Limitations

- A instalação limpa não faz merge automático em uma configuração existente.
- Projetado e testado no Windows com PowerShell 5.1+.
- Policies controlam permissões, não isolamento de sistema operacional.
- Findings e gates medem os sinais configurados; ausência de uma métrica ou de
  recall confiável é uma lacuna, não uma aprovação.

## Licença / License

Este repositório é público. Revise os arquivos antes de compartilhar
informações que não deveriam ser públicas.

This repository is public. Review files before sharing information that should
not be public.
