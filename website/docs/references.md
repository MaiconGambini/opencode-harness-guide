---
sidebar_position: 99
---

# Referências

Estas são as fontes que orientaram o PREVC, o pipeline de planejamento e a
separação de papéis. As referências indicam inspiração e adaptação, não cópia.

## Fontes externas

- [Docusaurus](https://docusaurus.io/docs) — framework do site.
- [Node.js](https://nodejs.org) — runtime dos scripts.
- [Git](https://git-scm.com) — controle de versão e distribuição.
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Prompt Library](https://code.claude.com/docs/en/prompt-library)
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [mattpocock/skills](https://github.com/mattpocock/skills) — skills de
  planejamento (`wayfinder`, `grill-with-docs`, `to-tickets`, `implement`) que
  formam o [pipeline de planos](./guides/planning-pipeline).

## Padrões preservados

- Manter as instruções globais concisas e carregar contexto especializado só
  quando necessário.
- Separar planejamento, implementação, validação e confirmação.
- Usar evidência executável e regras de parada explícitas para comportamento
  autônomo.
- Tratar conteúdo externo e operações privilegiadas como não confiáveis.
