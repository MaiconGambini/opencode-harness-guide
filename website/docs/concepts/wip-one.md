---
sidebar_position: 4
---

# WIP=1

WIP=1 é uma restrição de foco cognitivo para o LLM: somente uma unidade de trabalho fica ativa por vez. A analogia é um desenvolvedor com um ticket na bancada. Ele registra o próximo ticket numa fila, mas não alterna entre várias implementações e depois tenta separar requisitos, arquivos e testes.

## Foco evita mistura

Quando o modelo troca de tarefa no meio do caminho, detalhes de contexto se cruzam. Pode aplicar o critério errado, atribuir um teste a outra mudança ou descrever progresso que não aconteceu. Uma unidade ativa mantém objetivo, decisões e evidência no mesmo contexto.

| Com WIP=1 | Sem WIP=1 |
|---|---|
| Um objetivo guia a sessão | Vários objetivos competem |
| Bloqueios têm causa exata | Bloqueios ficam ambíguos |
| Provas ficam ligadas à mudança | Progresso pode ser alucinado |
| O handoff aponta uma ação | O handoff lista pontas soltas |

## Como aplicar

Mantenha uma única feature como `in_progress`. Ao terminar, marque `passing` com evidência ou `blocked` com a razão exata:

```json
{
  "id": "feat-001",
  "status": "in_progress",
  "title": "Health endpoint"
}
```

Trabalho adjacente não entra silenciosamente no contexto ativo. Registre-o no `feature_list.json` como `not_started`, com escopo suficiente para ser retomado, e continue no item atual. A próxima sessão puxa o item enfileirado. Se isso alterar o contrato, atualize-o e obtenha aprovação antes de prosseguir.

## Paralelismo com fronteiras

O **OpenCode** fornece a metodologia, a referência e a continuidade entre sessões. O **Oh My Pi** fornece o motor nativo de **32 subagentes**, fan-out paralelo e sharding. O caminho OMP é relevante para várias unidades independentes, com donos e dependências sem sobreposição; uma tarefa sequencial continua em uma única lane. Cada lane ainda tem WIP=1 e não compartilha um contexto de trabalho sem contrato explícito.

## Próximo passo

Veja [Evidência e Handoff](./evidence-and-handoff) para conectar foco a provas de conclusão.
