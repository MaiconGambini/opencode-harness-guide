---
sidebar_position: 5
---

# Evidência e Handoff

Dizer "funcionou" é uma afirmação, não uma conclusão. Evidência confiável sobe em degraus, da declaração inicial até a verificação do sistema rodando. O handoff registra esses degraus para que uma nova sessão continue sem depender da memória da conversa.

## A escada de evidências (Evidence Rungs 1–5)

Para eliminar a ambiguidade sobre o que constitui "prova", o harness classifica a evidência em cinco degraus cumulativos de rigor crescente:

1. **Rung 1 — Assertion (afirmação):** o agente diz que concluiu ou prevê um resultado. É um ponto de partida, não uma validação, e nunca basta para fechar uma tarefa.
2. **Rung 2 — Artifact (artefato):** diff, arquivos alterados ou estado persistido mostram a mudança. Isso prova alteração, não funcionamento.
3. **Rung 3 — Command output (saída de comando):** um comando foi realmente executado e registra diretório, saída e código de saída. Ferramentas estáticas determinísticas podem provar integridade estrutural, tipos e schema; não provam o fluxo ao vivo.
4. **Rung 4 — Acceptance (aceite observável):** critérios de aceite são conferidos um a um e ligados a resultados observados, com testes ou gate de acordo com o risco.
5. **Rung 5 — Live running verification (verificação ao vivo):** o sistema real é iniciado, o caminho alterado é exercitado e inicialização, resposta, logs relevantes e código de saída são registrados.

Não trate um degrau menor como se fosse um maior. Um diff não prova comportamento, e uma saída de teste não prova que o fluxo ao vivo foi executado.

## Camadas de verificação

Antes de declarar uma feature como concluída, três camadas estruturadas são verificadas:

1. **Static (Rung 3)** — typecheck, linters e validações de schema passam.
2. **Runtime (Rungs 4–5)** — critérios de aceite são observáveis, comandos foram rodados e a saída real foi registrada.
3. **System** — o comando de verificação unificado do projeto sai com código 0, e o estado em disco reflete a conclusão.

## Exemplo de evidência

```json
{
  "status": "ok",
  "summary": "resultado conciso da lane",
  "artifact": "local://evidencia-completa",
  "failures": []
}
```

`status` aceita `ok` ou `error`; `artifact` e `failures` são opcionais. O
envelope filho não inclui `files`, `verification`, `blocker` nem `next_step`.
Esses dados pertencem ao scheduler e ao registro da sessão pai, que
reconcilia arquivos, verificações, bloqueios e a próxima ação. O envelope
filho deve apontar logs longos para `local://` ou `artifact://`.

## Estrutura de handoff

Toda sessão termina com um registro que a próxima sessão possa consumir:

```text
Verified now: o que terminou e o maior rung alcançado
Changed: arquivos e contratos modificados
Evidence: comandos, saídas, códigos de saída e artefatos
Broken: falhas reproduzíveis ou "none"
Decisions: decisões e limites a preservar
Next best step: uma única próxima ação
```

Se o trabalho não terminou, o handoff ainda é feito — a feature vai para
`blocked` com a causa exata e o `Next Best Step` diz exatamente o que fazer.

## OpenCode vs Oh My Pi na coleta de evidências

- **OpenCode como referência metodológica:** o OpenCode organiza a política de evidências, a escala de rungs, as transições PREVC e a continuidade entre sessões.
- **Oh My Pi como motor nativo:** o Oh My Pi fornece ferramentas nativas para despacho paralelo, processos supervisionados e coleta de resultados quando esse runtime for usado.
- **Quando usar o caminho OMP:** quando a validação exigir múltiplas unidades independentes, serviços interdependentes ou testes ponta a ponta; cada lane ainda deve devolver provas separadas para reconciliação.

## Próximo passo

Veja [PREVC](./prevc) para o ciclo de entrega ou [WIP=1](./wip-one) para manter o foco durante a execução.
