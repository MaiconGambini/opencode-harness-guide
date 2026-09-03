---
sidebar_position: 5
---

# Evidência e Handoff

Dizer "funcionou" é uma afirmação, não uma conclusão. Evidência confiável sobe em degraus, da declaração inicial até a verificação do sistema rodando. O handoff registra esses degraus para que uma nova sessão continue sem depender da memória da conversa.

## Os cinco degraus da evidência

A ordem é explícita e cumulativa:

1. **Rung 1 — Assertion (afirmação):** o agente diz que concluiu ou prevê um resultado. A prova esperada é somente a declaração. É um ponto de partida, não uma validação.
2. **Rung 2 — Artifact (artefato):** diff, arquivos alterados ou estado persistido mostram a mudança. A prova esperada lista caminhos e conteúdo revisável. Isso prova alteração, não funcionamento.
3. **Rung 3 — Command output (saída de comando):** um comando foi realmente executado. A prova esperada registra comando, diretório, saída e código de saída, incluindo falhas. Isso permite repetir a checagem.
4. **Rung 4 — Acceptance (aceite observável):** os critérios de aceite são conferidos um a um e ligados a resultados observados, com gate ou revisão de acordo com o risco. A prova esperada é o mapa critério → resultado, sem esconder itens bloqueados.
5. **Rung 5 — Live running verification (verificação ao vivo):** o sistema real é iniciado e o caminho alterado é exercitado. A prova esperada registra inicialização, ação ou requisição, resposta, logs relevantes e código de saída. É a evidência mais forte.

Não trate um degrau menor como se fosse um maior. Um diff não prova comportamento, e uma saída de teste não prova que o fluxo ao vivo foi executado.

## Envelope filho da lane

Cada lane retorna ao pai um envelope curto com exatamente quatro chaves:

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

Se o trabalho não terminou, registre `blocked`, a causa exata e a ação que pode destravar. Um handoff claro preserva contexto, mas não converte uma afirmação em evidência.

## OpenCode e Oh My Pi

O **OpenCode** fornece a metodologia, a referência dos degraus e a continuidade entre sessões para preservar estado, decisões e handoffs. O **Oh My Pi** fornece o motor nativo de **32 subagentes**, fan-out paralelo e sharding. O caminho OMP é relevante quando a coleta de evidência pode ser dividida em unidades independentes; cada lane deve devolver provas separadas para posterior reconciliação.

## Próximo passo

Veja [PREVC](./prevc) para o ciclo de entrega ou [WIP=1](./wip-one) para manter o foco durante a execução.
