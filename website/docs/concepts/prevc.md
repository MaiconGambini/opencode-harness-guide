---
sidebar_position: 3
---

# PREVC

Uma entrega segura segue uma ordem natural: entender o pedido, executar o que foi combinado, conferir o resultado com provas e pedir o aceite final. PREVC é o nome curto para esses quatro movimentos: **Prepare, Execute, Validate, Confirm**. Pense no ciclo como uma entrega de engenharia sênior: contrato claro antes do código, implementação dentro do contrato, verificação reproduzível e decisão explícita sobre aceitar ou revisar.

## O fluxo de quatro estágios

```text
PEDIDO
  |
  v
PREPARE  ->  EXECUTE  ->  VALIDATE  ->  CONFIRM
 contexto    mudança       provas       aceite + handoff
 contrato    aprovada      observáveis
                 ^              |
                 +--- falha ----+
```

Aprovação do plano, revisão, Judge e Refine são controles dentro dos quatro estágios. Aprovação libera **Execute**; revisão e Judge reforçam **Validate**; a decisão do operador pertence a **Confirm**. Esses controles não devem esconder nem substituir os quatro nomes principais.

### Prepare

Leia contexto, regras, estado e handoff relevantes. Descubra o risco e o comando de verificação. Escreva objetivo, escopo, não-escopo, critérios de aceite, dependências e plano. Quando necessário, pare para aprovação explícita antes de editar.

### Execute

Altere somente o escopo aprovado. Divida trabalho independente em unidades com dono e dependências claras, sem misturar arquivos ou objetivos. WIP=1 mantém uma unidade ativa por vez.

### Validate

Verifique o comportamento observável e registre comandos, workspace, saída e código de saída. Use gates e revisão independente quando o risco pedir. Uma falha, ambiguidade ou prova ausente interrompe o fluxo e pede revisão, nunca uma conclusão automática.

### Confirm

O operador examina resultado, evidência e handoff. O aceite registra a conclusão; uma revisão retorna ao planejamento; um aborto registra o motivo. Sem decisão explícita e continuidade registrada, a entrega permanece em revisão.

## OpenCode e Oh My Pi

O **OpenCode** é a fonte desta metodologia e referência, e fornece continuidade entre sessões para preservar plano, estado e handoff. O **Oh My Pi** fornece o motor nativo de **32 subagentes**, fan-out paralelo e sharding. O caminho OMP é relevante quando há várias unidades independentes que podem ser executadas em paralelo; uma tarefa pequena, sequencial ou com dependências deve permanecer no fluxo normal do OpenCode.

## Uso básico

Inicie preparando o objetivo:

```text
/prevc prepare Adicionar endpoint de health check
```

Depois da aprovação do plano, execute:

```text
/prevc run <goal-id>
```

O plano aprovado, as provas e o handoff permitem retomar o trabalho em uma nova sessão sem reconstruir decisões pela memória da conversa.

## Regras essenciais

- WIP=1 sempre.
- Não toque arquivos fora do escopo.
- Registre trabalho adjacente como `not_started`.
- Exija evidência atual e reproduzível.
- Não confirme sem revisão do operador e handoff.

## Próximo passo

Veja [WIP=1](./wip-one) para foco de execução ou [Evidência e Handoff](./evidence-and-handoff) para a escala de provas.
