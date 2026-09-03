---
sidebar_position: 1
slug: intro
---

# Introdução ao Harness OpenCode

Desenvolver com agentes de IA em projetos reais frequentemente resulta em quatro dores universais:

1. **Edições descontroladas em múltiplos arquivos (runaway edits):** O agente toca dezenas de arquivos além do solicitado, introduzindo refatorações acidentais e diffs impossíveis de revisar.
2. **Builds quebrados (broken builds):** O assistente reporta sucesso precoce, mas deixa para trás erros de compilação, tipos inválidos e empacotamento quebrado.
3. **Alucinação de testes (test hallucination):** O modelo afirma categoricamente que "todos os testes passaram", sem ter executado sequer um comando no terminal.
4. **Perda de contexto entre sessões (context loss):** Ao fechar a sessão, todas as decisões, blockers e o estado do trabalho evaporam, forçando um recomeço do zero.

O Harness OpenCode estrutura esses problemas como um processo de engenharia
rigoroso e mensurável para a interação entre o desenvolvedor e o agente.

### Comparativo: Chat tradicional vs Engenharia com Harness

| Chat de IA sem assistência | Engenharia com Harness |
|---|---|
| **Edições descontroladas:** Altera dezenas de arquivos sem fronteira definida, gerando diffs gigantescos e imprevisíveis. | **Escopo delimitado:** Declara e restringe a posse de arquivos por lane; edições ocorrem apenas nos alvos autorizados. |
| **Build quebrado:** Afirma que a tarefa está pronta sem verificar se o projeto ainda compila ou empacota. | **Verificação obrigatória:** Bloqueia a conclusão até que checagens de tipos, linters e builds passem com código de saída zero. |
| **Alucinação de testes:** Inventa resultados de testes ("todos os testes passaram") sem executar comando algum no terminal. | **Evidência real:** Exige saída capturada do terminal e degraus de evidência auditáveis antes de declarar sucesso. |
| **Perda de contexto:** Cada nova sessão começa do zero, esquecendo decisões, bloqueios e tarefas pendentes. | **Continuidade durável:** Mantém estado em disco (WIP=1), registra bloqueios reais e produz handoff limpo para a próxima sessão. |

### Posicionamento do contrato e dos runtimes

O PREVC é o contrato comum de ciclo de vida. Ele agrupa sete etapas em quatro
fases operacionais:

- **Prepare** = `prepare` + `plan`: descobre contexto, risco e escopo.
- **Execute** = `execute`: implementa somente o plano aprovado.
- **Validate** = `validate` + `judge`: coleta evidência e faz avaliação independente.
- **Confirm** = `refine` + `confirm`: apresenta melhorias e aguarda a decisão do operador.

O OpenCode é o adaptador metodológico desta árvore: fornece continuidade entre
sessões, estado durável, plugins e skills. O Oh My Pi tem motor nativo de
despacho paralelo e coordenação própria. O contrato é compartilhado; a
instalação, os comandos específicos e a implementação do runtime não são.

### Autoridade documental e estado de versão

`website/docs/` é a fonte canônica desta árvore. A página [Continual Harness
v1.3](./concepts/continual-harness-v1-3) preserva o baseline do contrato
contínuo. Os incrementos descritos abaixo como v1.4 são mudanças desta árvore
em aceitação, não uma release formal. Capacidades configuradas só devem ser
apresentadas como ativas quando houver evidência de aceitação correspondente.

## Incrementos documentados na série v1.4

A árvore atual adiciona uma camada de **contexto recuperável, estado durável e
qualidade medida** ao loop contínuo do baseline:

- **Estado durável mínimo** — quando presente no projeto, `docs/harness/progress.md`
  registra a próxima ação, blockers e decisões relevantes.
- **Retomada de sessão** — a skill `harness-session-start` relê instruções,
  estado de progresso e de feature, handoff, startup e postura de qualidade.
- **Quality reports** — `scripts/harness-quality-gate.mjs` escreve relatórios em
  `docs/harness/quality/`; as skills `harness-quality-gate` e
  `harness-quality-snapshot` orientam a leitura, o gate e o snapshot desses
  relatórios.

Esses mecanismos estruturam a continuidade e a evidência; não substituem a
aceitação do operador nem afirmam que a qualidade seja automática.

> **Estado de aceitação:** a aceitação ao vivo do baseline v1.3, incluindo
> injeção na lane, findings de execução real e números de liveness, ainda não foi
> executada. As capacidades desta série só ficam disponíveis após reiniciar o
> OpenCode. Veja [Casos de Uso](./adoption/use-cases) para os fluxos descritos.

## O que você encontrará

O método organiza trabalhos significativos em fronteiras explícitas:

| Seção | O que cobre |
|---|---|
| **[Começando](./getting-started/installation)** | Instalação passo a passo e primeira sessão. |
| **[Conceitos](./concepts/why-a-harness)** | PREVC, WIP=1, evidências, os sete componentes e os limites de automação. |
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

> **Instalação limpa:** se `~/.config/opencode` já existe com arquivos seus, renomeie a pasta para `opencode-backup` **antes** de clonar — não há merge automático. O Passo 1 do [guia completo de instalação](./getting-started/installation) mostra o comando exato.

Clone o repositório na configuração do runtime OpenCode e instale as
dependências fixadas pelo lockfile:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm ci
```

- O repositório é clonado direto em `~/.config/opencode`, onde o OpenCode lê a configuração.
- `npm ci` instala as dependências exatas do runtime a partir do lockfile.
- Feche e reabra o OpenCode para carregar a configuração na próxima inicialização.

- prepare — reúne contexto, regras, restrições e risco.
- plan — define objetivo, arquivos sob responsabilidade e critérios de aceite.
- execute — aplica apenas o trabalho aprovado.
- validate — executa os comandos de verificação definidos.
- judge — avalia o resultado contra o contrato inicial.
- refine — registra melhorias sem substituir a decisão humana.
- confirm — o operador confirma a entrega.

## Navegue pela referência

- O repositório é clonado direto em `~/.config/opencode`, onde o OpenCode lê a configuração.
- `npm ci` instala as dependências exatas do runtime a partir do lockfile.
- Feche e reabra o OpenCode para carregar a configuração na próxima inicialização.

1. **[Primeiros passos](./getting-started/installation)** — instale e inicie a primeira sessão.
2. **[Conceitos essenciais](./concepts/why-a-harness)** — entenda PREVC, WIP=1 e evidências.
3. **[Guias práticos](./guides/small-task)** — aplique a metodologia em tarefas reais.
4. **[Referência completa](./reference/commands)** — consulte comandos, agentes e arquivos.
5. **[Adoção e FAQ](./adoption/use-cases)** — avalie casos de uso, segurança e limitações.
