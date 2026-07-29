---
sidebar_position: 2
---

# Os sete componentes

O harness usa sete componentes. Eles nao sao sete produtos separados; sao
lentes para verificar se o workflow esta completo.

1. **System Prompt** — Regras ativas, limites e instrucao de operar com PREVC.
2. **Tools** — Ferramentas que leem, editam, validam e pedem aprovacao.
3. **Context Management** — Carrega apenas instrucoes, specs e estado
   relevantes.
4. **Verification** — Comandos e evidencias que verificam o resultado.
5. **Memory** — Goals, handoffs e artefatos duraveis, com retencao.
6. **Sandboxes** — Nao ha sandbox de SO. Policy nao substitui isolamento.
7. **Hooks** — Integracoes permitidas; nao criam execucao autonoma.

## O que cada componente protege

| Componente | Pergunta que responde | Limite atual |
|---|---|---|
| System prompt | Quais regras valem nesta sessao? | Regras nao substituem permissao humana |
| Tools | Qual acao pode ser executada? | Ferramentas mutantes ainda exigem policy e aprovacao |
| Context | O que preciso ler antes de decidir? | Contexto deve ser relevante, nao um dump global |
| Verification | Que fato prova o resultado? | Evidencia declarada pelo modelo nao e recibo confiavel |
| Memory | Como a proxima sessao continua? | Retencao e auditoria nao provam conclusao |
| Sandboxes | O processo esta isolado do SO? | Nao. Nao ha sandbox de SO instalada |
| Hooks | O que integra o lifecycle? | Hooks nao podem iniciar loops autonomos |
