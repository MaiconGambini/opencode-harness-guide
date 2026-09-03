---
sidebar_position: 2
---

# Portfólio: Harness OpenCode

Esta página resume o trabalho como um roteiro verificável: problema, método,
implementação e evidência. Ela descreve o adaptador OpenCode e seus mecanismos de
continuidade; não é uma declaração de release, adoção ou performance medida.

## Problema

Sessões com agentes podem espalhar edições, perder decisões entre retomadas e
tratar uma conclusão sem saída de terminal como se fosse prova. O problema
tratado aqui é de processo: tornar escopo, estado, verificação e próxima ação
visíveis para o operador.

O repositório não apresenta esses riscos como métricas de produção. Eles são a
motivação documental para o contrato PREVC e para os artefatos de continuidade.

## Método

O PREVC define o contrato comum de ciclo de vida: preparar, executar, validar e
confirmar, com sete etapas agrupadas em quatro fases operacionais. O plano
aprovado limita o que pode ser executado; a validação coleta evidência; a
confirmação continua sendo uma decisão do operador. Veja o [contrato
PREVC](./concepts/prevc) e a [escada de evidência](./concepts/evidence-and-handoff).

O OpenCode é o adaptador metodológico desta árvore. Ele combina instruções,
skills, plugins e estado em disco para sustentar a continuidade entre sessões.
O Oh My Pi tem motor nativo de despacho paralelo; essa distinção não transforma
os dois runtimes em uma única implementação.

## Implementação

### Continuidade entre sessões

A skill `harness-session-start` em `skills/harness-session-start/SKILL.md` lê
instruções raiz, estado de progresso e de feature quando presentes, handoff,
startup e postura de qualidade. O caminho `docs/harness/progress.md` é uma opção
de estado procurada pela skill; ele não está presente neste checkout público.
O mesmo vale para `docs/harness/session-handoff.md`, que é lido quando existe.

### PREVC e controle de escopo

`website/docs/concepts/prevc.md` documenta o contrato e as transições de estado.
A configuração `opencode.jsonc`, as skills e os plugins implementam o adaptador
OpenCode no runtime. O [guia da primeira sessão](./getting-started/first-session)
mostra como iniciar o fluxo sem confundir a proposta com aprovação.

### Quality reports e observabilidade

`scripts/harness-quality-gate.mjs` contém o gate medido e grava relatórios
Markdown e JSON em `docs/harness/quality/` quando executado. As skills
`harness-quality-gate` e `harness-quality-snapshot` orientam, respectivamente,
o gate e a leitura de snapshots. O plugin
`plugins/harness-tool-activity.ts` registra atividade redigida em
`.opencode/state/tool-activity.jsonl`; esse log é observacional e não prova
conclusão.

## Evidência

### Evidência disponível neste checkout

- Os contratos e limites estão documentados em [PREVC](./concepts/prevc), nas
  [restrições](./adoption/limitations) e nos [artefatos](./reference/artifacts).
- A implementação citada está presente em `opencode.jsonc`, `plugins/`,
  `scripts/harness-quality-gate.mjs` e `skills/`.
- A página de [primeira sessão](./getting-started/first-session) preserva o
  caminho operacional documentado.

### Limites da evidência

Este checkout não contém `docs/harness/progress.md` nem relatórios em
`docs/harness/quality/*.json`. Portanto, esta página não declara gate verde,
aceitação ao vivo, melhoria de liveness, ganho de performance ou adoção. Esses
resultados exigem uma execução real, saída capturada e decisão de aceitação do
operador.
