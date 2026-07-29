---
sidebar_position: 3
---

# Segurança

Limites de segurança do Harness OpenCode. É importante entender tanto o que o
harness protege quanto o que ele deliberadamente não protege — a segurança
mora na fase de planejamento e aprovação, não em bloqueios automáticos.

## O que o harness protege

- **Estado durável** — blockers, decisões e handoffs são registrados em
  arquivos. Nenhuma informação de estado vive apenas na memória do chat.
- **Permissões declarativas** — o `opencode.jsonc` define regras de edição,
  execução de comandos e acesso a diretórios externos.
- **Verificação em três camadas** — todo resultado é validado antes de ser
  marcado como concluído.
- **Rastreabilidade** — cada mudança é associada a uma feature, com evidência
  e aprovação registradas.

## O que o harness NÃO protege

### Não há sandbox de sistema operacional

As políticas de permissão controlam o que o agente pode fazer dentro do
OpenCode, mas não isolam o processo do sistema operacional. Um comando
aprovado e executado no shell tem acesso total ao sistema.

### Não substitui revisão humana

O Judge avalia o trabalho contra critérios objetivos, mas a confirmação final
ainda depende do operador. O harness reduz o risco de conclusão prematura —
não elimina a necessidade de revisão.

### Não impede comandos perigosos

Se você aprovar um plano que inclui `rm -rf`, o harness o executará. A
segurança está na fase de planejamento e aprovação, não em bloqueios
automáticos de comandos.

## Boas práticas

1. **Revise o plano antes de aprovar.** Todo comando listado no plano será
   executado — leia cada linha.
2. **Mantenha `opencode.jsonc` sob controle de versão** e revise as
   permissões antes de compartilhar a configuração.
3. **Não armazene tokens ou credenciais em arquivos de configuração.** Use
   variáveis de ambiente.
4. **Rode `/harness-security-scan` periodicamente** para detectar secrets
   expostos e permissões excessivas.
5. **Lembre que o repositório é público** — não comite nada que não deveria
   ser visível para qualquer pessoa.
