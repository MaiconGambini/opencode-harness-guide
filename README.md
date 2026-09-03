# Harness OpenCode

Workflow de agentes com estado durável, evidências e handoff entre sessões
para projetos [OpenCode](https://opencode.ai).

## Português

O Harness OpenCode adapta o contrato PREVC para o runtime OpenCode. PREVC é o
contrato comum: organiza planejamento, execução, validação, avaliação e entrega.
O OpenCode fornece a referência metodológica, a continuidade entre sessões e os
plugins que implementam esse contrato. O Oh My Pi fornece um motor nativo de
despacho paralelo; nenhum runtime é substituto do outro.

A documentação canônica desta árvore é `website/docs/`. O baseline do harness
contínuo está documentado como v1.3 em [Continual Harness v1.3](https://maicongambini.github.io/opencode-harness-guide/docs/concepts/continual-harness-v1-3).
Os incrementos descritos em [Introdução](https://maicongambini.github.io/opencode-harness-guide/docs/intro)
como v1.4 pertencem à árvore atual e continuam em aceitação; não são anúncio
de uma release formal. Não trate capacidades configuradas como aceitas sem a
evidência correspondente.

- [Documentação em português](https://maicongambini.github.io/opencode-harness-guide/)
- [Casos de uso práticos](https://maicongambini.github.io/opencode-harness-guide/docs/adoption/use-cases)
- [Contrato do harness contínuo](https://maicongambini.github.io/opencode-harness-guide/docs/concepts/continual-harness-v1-3)

## English

The OpenCode Harness adapts the PREVC contract to the OpenCode runtime. PREVC is
the shared contract for planning, execution, validation, judging, and delivery.
OpenCode provides the methodological reference and multi-session continuity.
Oh My Pi provides a native parallel-dispatch engine; neither runtime supersedes
the other.

The canonical documentation for this tree is `website/docs/`. The continual
harness baseline is documented as v1.3. Changes described as v1.4 in the
[Introduction](https://maicongambini.github.io/opencode-harness-guide/en/docs/intro)
belong to the current tree and remain under acceptance; they are not a formal
release announcement.

- [English documentation](https://maicongambini.github.io/opencode-harness-guide/en/)
- [Practical use cases](https://maicongambini.github.io/opencode-harness-guide/en/docs/adoption/use-cases)
- [Continual harness contract](https://maicongambini.github.io/opencode-harness-guide/en/docs/concepts/continual-harness-v1-3)

## Instalação / Installation

### Runtime OpenCode / OpenCode runtime

> Instalação limpa / Clean install: se `~/.config/opencode` já existe, renomeie
> para `opencode-backup` antes de clonar — não há merge automático / if
> `~/.config/opencode` already exists, rename it to `opencode-backup` before
> cloning — there is no automatic merge.

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm ci
```

Feche e reabra o OpenCode após a instalação. Para o passo a passo, veja o
[guia de instalação](https://maicongambini.github.io/opencode-harness-guide/docs/getting-started/installation).

### Site de documentação / Documentation site

As dependências do site são independentes do runtime:

```powershell
npm ci --prefix website
npm --prefix website start
```

Abra / Open `http://localhost:3000/opencode-harness-guide/`.

## Roteiro de portfólio / Portfolio narrative

**Problema:** agentes podem ampliar o escopo, declarar sucesso sem prova e
perder decisões entre sessões.

**Método:** PREVC delimita ownership, exige aprovação humana, WIP=1 e evidência
antes de cada transição.

**Implementação:** OpenCode fornece estado durável, plugins, skills e gates;
o contrato também pode ser adaptado ao motor nativo do Oh My Pi.

**Evidência:** consulte os artefatos, comandos e limites documentados em
[Evidência e Handoff](https://maicongambini.github.io/opencode-harness-guide/docs/concepts/evidence-and-handoff)
e nos guias de execução.

**Problem:** agents can widen scope, claim success without proof, and lose
decisions between sessions.

**Method:** PREVC defines ownership, requires human approval, WIP=1, and
evidence before each transition.

**Implementation:** OpenCode provides durable state, plugins, skills, and gates;
the same contract can also adapt to Oh My Pi's native engine.

**Evidence:** see the documented artifacts, commands, and limits in
[Evidence and Handoff](https://maicongambini.github.io/opencode-harness-guide/en/docs/concepts/evidence-and-handoff)
and the execution guides.

## Estrutura / Structure

- `opencode.jsonc` — comandos globais, agents e plugins.
- `skills/` — skills carregadas pelo OpenCode.
- `agent/` — capacidades especializadas e suas permissões.
- `plugins/` — plugins do runtime.
- `scripts/` — gates e utilitários PowerShell e Node.
- `templates/` — artefatos reutilizáveis do harness.
- `website/` — site bilíngue de documentação (Docusaurus).

## Verificação / Verification

```powershell
npm run typecheck
npm test
npm run build --prefix website
```

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
