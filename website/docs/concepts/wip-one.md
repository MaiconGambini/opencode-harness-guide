---
sidebar_position: 4
---

# WIP=1

WIP=1 é uma restrição de foco cognitivo para o LLM: somente uma unidade de trabalho fica ativa por vez. A analogia é um desenvolvedor com um ticket na bancada. Ele registra o próximo ticket numa fila, mas não alterna entre várias implementações e depois tenta separar requisitos, arquivos e testes.

## Restrição cognitiva para modelos de linguagem

A janela de contexto de um LLM comporta-se como a memória de trabalho de um desenvolvedor humano. Quando um agente recebe múltiplos objetivos simultâneos, os escopos competem, as restrições ficam menos claras e o progresso pode ser descrito incorretamente.

Com WIP=1, uma unidade delimitada mantém objetivo, decisões e evidência no mesmo contexto. Essa disciplina não substitui testes nem cria lock de arquivos.

## Comparativo: Com vs Sem WIP=1

| Com WIP=1 | Sem WIP=1 |
|---|---|
| Um objetivo guia a sessão | Vários objetivos competem |
| Bloqueios têm causa exata | Bloqueios ficam ambíguos |
| Provas ficam ligadas à mudança | Progresso pode ser alucinado |
| O handoff aponta uma ação | O handoff lista pontas soltas |

## Como funciona

Mantenha uma única feature como `in_progress`. Ao terminar, marque `passing` com evidência ou `blocked` com a razão exata:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

Trabalho adjacente não entra silenciosamente no contexto ativo. Registre-o no
`feature_list.json` como `not_started`, com escopo suficiente para ser retomado, e
continue no item atual. A próxima sessão puxa o item enfileirado. Se isso alterar
o contrato, atualize-o e obtenha aprovação antes de prosseguir.

## Durante a execução

O **OpenCode** fornece a metodologia, a referência e a continuidade entre sessões. O **Oh My Pi** fornece o motor nativo de **32 subagentes**, fan-out paralelo e sharding. O caminho OMP é relevante para várias unidades independentes, com donos e dependências sem sobreposição; uma tarefa sequencial continua em uma única lane. Cada lane ainda tem WIP=1 e não compartilha um contexto de trabalho sem contrato explícito.

## Próximo passo

Não expanda o escopo silenciosamente. Se o escopo crescer, pare, atualize o
sprint contract e peça aprovação.

## OpenCode e Oh My Pi no WIP=1

- **Contrato comum:** WIP=1 limita cada unidade ativa e exige ownership disjunto
  quando há lanes paralelas.
- **OpenCode:** `feature_list.json` e `progress.md` preservam a unidade ativa e a
  próxima ação entre sessões quando esses artefatos estão configurados.
- **Oh My Pi:** `todo` mantém a unidade ativa e o scheduler despacha lanes
  independentes via `tasks[]`.

Lanes que se cruzam devem ser serializadas ou fundidas. Ownership é uma regra de
prompt, não um lock; use worktrees quando precisar de isolamento real.

## Próximo passo

Veja [Evidência e Handoff](./evidence-and-handoff) para entender o que conta como conclusão.
