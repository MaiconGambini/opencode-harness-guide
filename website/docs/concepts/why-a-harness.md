---
sidebar_position: 1
---

# Por que um harness?

Sem orientação, um agente pode editar arquivos demais, quebrar o build, declarar testes que nunca executou e esquecer o trabalho assim que a sessão termina. A sessão seguinte perde tempo reconstruindo o contexto e não sabe qual tarefa ficou aberta, qual comando prova a mudança ou quando deve parar.

O harness transforma esse fluxo em trabalho rastreável. Regras, estado durável, verificação e handoff tornam explícitos o escopo, a evidência e a continuidade entre sessões.

## Comparativo direto

| Preocupação | Unassisted AI chat | Harness-guided engineering |
|---|---|---|
| Alterações fora de escopo | Edições em muitos arquivos podem escapar ao planejamento | O método define o escopo, a propriedade dos arquivos e a unidade ativa |
| Build quebrado | Não há controle consistente antes de dizer “pronto” | Gates de validação reproduzíveis verificam a mudança |
| Testes alegados | O modelo pode alucinar uma execução que não ocorreu | A conclusão exige evidência do comando e do resultado |
| Contexto entre sessões | O histórico do chat não preserva o estado de forma confiável | Estado durável em arquivo e handoff orientam a próxima sessão |
| Decisão de aceite | “Pronto” é uma opinião do próprio agente | Judge independente compara o resultado com o contrato |

## O que o harness responde

Antes de qualquer mudança importante, a metodologia responde:

1. Onde estou e quais regras este repositório tem?
2. O que já foi feito e o que está bloqueado?
3. Qual é a única unidade de trabalho ativa?
4. Como vou provar que a alteração funcionou?
5. Quem decide se o resultado pode ser aceito?
6. O que uma próxima sessão precisa ler para continuar?

## A identidade do OpenCode

O Harness OpenCode é uma referência de metodologia. Ele organiza o ciclo PREVC, o estado durável, a evidência e os handoffs para que equipes possam retomar o trabalho em múltiplas sessões sem depender da memória do chat. Use esta documentação para definir o processo e os critérios antes de escolher como executar cada lane.

## O que o harness não faz

- Não torna o agente autônomo.
- Não substitui revisão humana.
- Não fornece sandbox de sistema operacional.
- Não garante qualidade de código; garante rastreabilidade.

## Princípio fundamental

O repositório é o sistema de registro. Estado que vive somente no chat não é estado confiável.
