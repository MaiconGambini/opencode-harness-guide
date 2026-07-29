---
sidebar_position: 1
---

# Por que um harness?

Sem um harness, o OpenCode responde a um prompt, mas não sabe o que
aconteceu na sessão anterior, qual tarefa ficou aberta, qual comando prova
uma mudança ou quando deve parar.

O Harness resolve isso com regras, estado durável, verificação e handoff.

## O problema que ele evita

| Sem Harness | Com Harness |
|---|---|
| Cada sessão redescobre o projeto | A sessão lê instruções, estado e handoff |
| Várias ideias viram trabalho paralelo | WIP=1 mantém uma única unidade ativa |
| "Pronto" é uma opinião | Conclusão exige evidência e Judge |
| Um erro se perde no histórico do chat | O blocker é registrado para a próxima sessão |
| Skills e plugins acumulam comportamento | PREVC controla o ciclo de vida |

## O que o harness responde

Antes de qualquer mudança importante, o harness responde:

1. Onde estou e quais regras este repositório tem?
2. O que já foi feito e o que está bloqueado?
3. Qual é a única unidade de trabalho ativa?
4. Como vou provar que a alteração funcionou?
5. Quem decide se o resultado pode ser aceito?
6. O que uma próxima sessão precisa ler para continuar?

## O que o harness NÃO faz

- Não torna o agente autônomo.
- Não substitui revisão humana.
- Não fornece sandbox de sistema operacional.
- Não garante qualidade de código — garante rastreabilidade.

## Princípio fundamental

O repositório é o sistema de registro. Estado que vive somente no chat
não é estado confiável.
