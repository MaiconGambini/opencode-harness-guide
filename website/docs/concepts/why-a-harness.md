---
sidebar_position: 1
---

# Por que um harness?

Sem um harness, o OpenCode responde a um prompt, mas nao sabe o que
aconteceu na sessao anterior, qual tarefa ficou aberta, qual comando prova
uma mudanca ou quando deve parar.

O Harness resolve isso com regras, estado duravel, verificacao e handoff.

## O problema que ele evita

| Sem Harness | Com Harness |
|---|---|
| Cada sessao redescobre o projeto | A sessao le instrucoes, estado e handoff |
| Varias ideias viram trabalho paralelo | WIP=1 mantem uma unica unidade ativa |
| "Pronto" e uma opiniao | Conclusao exige evidencia e Judge |
| Um erro se perde no historico do chat | O blocker e registrado para a proxima sessao |
| Skills e plugins acumulam comportamento | PREVC controla o ciclo de vida |

## O que o harness responde

Antes de qualquer mudanca importante, o harness responde:

1. Onde estou e quais regras este repositorio tem?
2. O que ja foi feito e o que esta bloqueado?
3. Qual e a unica unidade de trabalho ativa?
4. Como vou provar que a alteracao funcionou?
5. Quem decide se o resultado pode ser aceito?
6. O que uma proxima sessao precisa ler para continuar?

## O que o harness NAO faz

- Nao torna o agente autonomo.
- Nao substitui revisao humana.
- Nao fornece sandbox de sistema operacional.
- Nao garante qualidade de codigo — garante rastreabilidade.

## Principio fundamental

O repositorio e o sistema de registro. Estado que vive somente no chat
nao e estado confiavel.
