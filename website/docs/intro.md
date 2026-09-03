---
sidebar_position: 1
slug: intro
---

# Introdução ao Harness OpenCode

Sem orientação, um agente de IA pode transformar uma correção pontual em uma avalanche de arquivos: altera diversos arquivos sem planejamento, quebra o build, afirma que executou testes que nunca rodaram e perde todo o contexto quando a sessão termina. A próxima sessão começa com amnésia, sem saber o que mudou, o que ficou aberto ou como verificar o resultado.

O **Harness OpenCode** é o **manual de referência e metodologia** para transformar o OpenCode em um sistema de engenharia rigoroso e confiável. Ele define estado durável em arquivo, limites de trabalho, verificação baseada em evidências e handoffs para continuidade entre sessões.

## Comparativo direto

| Preocupação | Unassisted AI chat | Harness-guided engineering |
|---|---|---|
| Alterações fora de escopo | O agente pode editar muitos arquivos sem planejamento ou aviso | O plano declara o escopo, as fronteiras e a unidade ativa |
| Build quebrado | A mudança pode ser aceita sem uma checagem reproduzível | Gates de validação medidos verificam o resultado |
| Testes alegados | O modelo pode afirmar que testou sem ter executado o comando | Evidência de comando e resultado sustenta a conclusão |
| Contexto entre sessões | O histórico do chat desaparece e a sessão recomeça do zero | Estado durável, WIP=1 e handoff preservam a continuidade |
| Decisão de aceite | “Pronto” vira uma opinião do próprio agente | Judge independente compara a entrega com o contrato |

## O ciclo de vida PREVC

O método organiza trabalhos significativos em fronteiras explícitas:

```text
prepare → plan → execute → validate → judge → refine → confirm
```

- prepare — reúne contexto, regras, restrições e risco.
- plan — define objetivo, arquivos sob responsabilidade e critérios de aceite.
- execute — aplica apenas o trabalho aprovado.
- validate — executa os comandos de verificação definidos.
- judge — avalia o resultado contra o contrato inicial.
- refine — registra melhorias sem substituir a decisão humana.
- confirm — o operador confirma a entrega.

## Navegue pela referência

1. **[Primeiros passos](./getting-started/installation)** — instale e inicie a primeira sessão.
2. **[Conceitos essenciais](./concepts/why-a-harness)** — entenda PREVC, WIP=1 e evidências.
3. **[Guias práticos](./guides/small-task)** — aplique a metodologia em tarefas reais.
4. **[Referência completa](./reference/commands)** — consulte comandos, agentes e arquivos.
5. **[Adoção e FAQ](./adoption/use-cases)** — avalie casos de uso, segurança e limitações.
