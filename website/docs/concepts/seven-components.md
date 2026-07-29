---
sidebar_position: 2
---

# Os sete componentes

O harness usa sete componentes. Eles não são sete produtos separados; são
lentes para verificar se o workflow está completo.

1. **System Prompt** — Regras ativas, limites e instrução de operar com PREVC.
2. **Tools** — Ferramentas que leem, editam, validam e pedem aprovação.
3. **Context Management** — Carrega apenas instruções, specs e estado
   relevantes.
4. **Verification** — Comandos e evidências que verificam o resultado.
5. **Memory** — Goals, handoffs e artefatos duráveis, com retenção.
6. **Sandboxes** — Não há sandbox de SO. Policy não substitui isolamento.
7. **Hooks** — Integrações permitidas; não criam execução autônoma.

## O que cada componente protege

| Componente | Pergunta que responde | Limite atual |
|---|---|---|
| System prompt | Quais regras valem nesta sessão? | Regras não substituem permissão humana |
| Tools | Qual ação pode ser executada? | Ferramentas mutantes ainda exigem policy e aprovação |
| Context | O que preciso ler antes de decidir? | Contexto deve ser relevante, não um dump global |
| Verification | Que fato prova o resultado? | Evidência declarada pelo modelo não é recibo confiável |
| Memory | Como a próxima sessão continua? | Retenção e auditoria não provam conclusão |
| Sandboxes | O processo está isolado do SO? | Não. Não há sandbox de SO instalada |
| Hooks | O que integra o lifecycle? | Hooks não podem iniciar loops autônomos |

## Próximo passo

Entenda o [PREVC](./prevc) — o controlador que amarra esses componentes num
ciclo de vida.
