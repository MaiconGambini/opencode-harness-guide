---
sidebar_position: 3
---

# PREVC

Uma entrega segura segue uma ordem natural: entender o pedido, executar o que foi combinado, conferir o resultado com provas e pedir o aceite final. PREVC é o contrato comum de ciclo de vida do harness e o nome curto para quatro movimentos: **Prepare, Execute, Validate, Confirm**. Ele agrupa sete etapas: Prepare (`prepare` + `plan`), Execute (`execute`), Validate (`validate` + `judge`) e Confirm (`refine` + `confirm`).

Nenhum agente modifica código sem plano aprovado, e nenhuma tarefa é concluída sem evidência real.

## A analogia da entrega de engenharia sênior

Pense no PREVC como um fluxo de engenharia usado antes de enviar código para produção:

1. **Prepare:** o agente inspeciona o repositório, mede o risco e propõe um plano.
2. **Execute:** com o plano aprovado, implementa sob WIP=1 e posse de arquivos.
3. **Validate:** roda verificações e recebe uma avaliação independente do Judge.
4. **Confirm:** apresenta o Refine ao operador, que decide se o trabalho pode terminar.

## O fluxo de quatro estágios

Aprovação do plano, revisão, Judge e Refine são controles dentro dos quatro estágios. Aprovação libera **Execute**; revisão e Judge reforçam **Validate**; a decisão do operador pertence a **Confirm**.

## Fluxo visual do ciclo de vida

```text
┌─────────────────┐
│     PREPARE     │  → prepare + plan: contexto, risco e plano
└────────┬────────┘
         │ [Aprovação obrigatória do operador]
         ▼
┌─────────────────┐
│     EXECUTE     │  → execute: implementação dentro do escopo aprovado
└────────┬────────┘
         │ [Código produzido]
         ▼
┌─────────────────┐
│    VALIDATE     │  → validate + judge: gates, testes e avaliação independente
└────────┬────────┘
         │ [Evidência e proposta de melhoria]
         ▼
┌─────────────────┐
│     CONFIRM     │  → refine + confirm: decisão final do operador
└─────────────────┘
```

## OpenCode e Oh My Pi: contrato e adaptadores

- **PREVC:** contrato comum de fases, evidência, WIP=1 e confirmação humana.
- **OpenCode:** adaptador metodológico desta árvore, com continuidade entre sessões, estado durável, plugins e skills.
- **Oh My Pi:** motor nativo de despacho paralelo e coordenação própria. O contrato permanece o mesmo; os mecanismos de runtime variam.

## Como usar no OpenCode

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

- Descobre contexto, classifica risco e prepara o plano.
- Para em `awaiting_plan_approval` aguardando sua confirmação.

Depois que você aprovar, execute:

```text
/prevc run
```

- Executa dentro do escopo aprovado.
- Valida o resultado e entrega o handoff.

## Comando específico do OpenCode: `/goal`

`/goal` é um plugin opcional para rastrear objetivos de longo prazo. Ele não é
necessário para o PREVC, não substitui sua fase durável e não é invocado pelo
comando `/prevc`.

Use-o somente quando precisar manter objetivo, plano e evidência separados do
ciclo de vida:

```text
/goal confirm
/goal revise <motivo>
/goal submit-revision <resumo>
/goal abort <motivo>
```

O comando `/prevc run` não exige `goal-id`. O ciclo PREVC permanece controlado
por suas próprias fases e pela confirmação explícita do operador.

## Por que não há auto-conclusão

Uma mensagem do agente dizendo que rodou um comando **não** é um recibo
confiável do runtime. Os campos de evidência guardam comando, workspace, exit
code e verifier, mas permanecem informativos.

Enquanto não houver recibos confiáveis de execução, nenhuma transição automática
para conclusão final será habilitada. Esse limite é intencional: o sistema
prefere parar em revisão a registrar uma conclusão que não consegue provar.

## Regras do PREVC

- WIP=1 sempre.
- Conclusão exige evidência real.
- Não tocar arquivos fora do escopo.
- Trabalho adjacente vira `not_started`.
- Se a verificação falhar, a feature fica `blocked` com causa explícita.
- Se o Judge não retornar `accept`, não confirma.
- Refine não altera o resultado do Judge nem aprova regras.

## Próximo passo

Veja [Harness Contínuo (baseline v1.3)](./continual-harness-v1-3) para entender
findings, Refine e injeção de regras, ou [WIP=1](./wip-one) para a disciplina
de execução.
