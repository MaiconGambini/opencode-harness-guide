---
sidebar_position: 1
---

# Por que um harness?

Sem orientação, um agente pode editar arquivos demais, quebrar o build, declarar testes que nunca executou e esquecer o trabalho assim que a sessão termina. A sessão seguinte perde tempo reconstruindo o contexto e não sabe qual tarefa ficou aberta, qual comando prova a mudança ou quando deve parar.

O contrato PREVC transforma a assistência de IA em um fluxo de engenharia rigoroso, governado por regras em disco, verificações executáveis e transições auditáveis.

## Comparativo estrutural

| Chat de IA sem assistência | Engenharia com Harness |
|---|---|
| **Edições descontroladas:** Altera dezenas de arquivos sem fronteira definida, gerando diffs gigantescos e imprevisíveis. | **Escopo delimitado:** Declara e restringe a posse de arquivos por lane; edições ocorrem apenas nos alvos autorizados. |
| **Build quebrado:** Afirma que a tarefa está pronta sem verificar se o projeto ainda compila ou empacota. | **Verificação obrigatória:** Bloqueia a conclusão até que checagens de tipos, linters e builds passem com código de saída zero. |
| **Alucinação de testes:** Inventa resultados ("todos os testes passaram") sem executar comando algum no terminal. | **Evidência real:** Exige saída capturada do terminal e degraus de evidência auditáveis antes de declarar sucesso. |
| **Perda de contexto:** Cada nova sessão começa do zero, esquecendo decisões, bloqueios e tarefas pendentes. | **Continuidade durável:** Mantém estado em disco (WIP=1), registra bloqueios reais e produz handoff limpo para a próxima sessão. |

> **Contrato PREVC:** as sete etapas `prepare → plan → execute → validate →
> judge → refine → confirm` são agrupadas em quatro fases: Prepare, Execute,
> Validate e Confirm. Cada transição exige a evidência da etapa anterior.
## O que o harness responde

Antes de qualquer mudança importante, a metodologia responde:

1. Onde estou e quais regras este repositório tem?
2. O que já foi feito e o que está bloqueado?
3. Qual é a única unidade de trabalho ativa?
4. Como vou provar que a alteração funcionou?
5. Quem decide se o resultado pode ser aceito?
6. O que uma próxima sessão precisa ler para continuar?

## A identidade do OpenCode

O Harness OpenCode é uma referência de metodologia. Ele organiza o ciclo PREVC,
o estado durável, a evidência e os handoffs para que equipes possam retomar o
trabalho em múltiplas sessões sem depender da memória do chat. Use esta
documentação para definir o processo e os critérios antes de escolher como
executar cada lane.

## Como isso é implementado no OpenCode

- **Contrato comum** — PREVC define fases, WIP=1, evidência e confirmação humana
  para OpenCode e Oh My Pi.
- **Adaptador metodológico** — o OpenCode fornece estado durável, continuidade
  entre sessões, plugins e skills que implementam o contrato nesta árvore.
- **Degraus de evidência auditáveis** — exige evidência executável (Rungs 1 a 5)
  antes de avançar fases ou permitir handoff.

## O que o harness NÃO faz

- Não torna o agente autônomo.
- Não substitui revisão humana.
- Não fornece sandbox de sistema operacional.
- Não torna a qualidade de código automática — exige evidência rastreável.

## Princípio fundamental

O repositório é o sistema de registro. Estado que vive somente no chat não é estado confiável.
