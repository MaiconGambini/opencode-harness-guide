---
sidebar_position: 3
---

# Segurança

Limites de segurança do Harness OpenCode.

## O que o harness protege

- **Estado durável** — blockers, decisões e handoffs são registrados em
  arquivos. Nenhuma informação de estado vive apenas na memória do chat.
- **Permissões declarativas** — `opencode.jsonc` define regras de edição,
  execução de comandos e acesso a diretórios externos.
- **Verificação em três camadas** — todo resultado é validado antes de
  ser marcado como concluído.
- **Rastreabilidade** — cada mudança é associada a uma feature, com
  evidência e aprovação registradas.

## O que o harness NÃO protege

### Não há sandbox de sistema operacional

As políticas de permissão controlam o que o agente pode fazer dentro do
OpenCode, mas não isolam o processo do sistema operacional. Um comando
aprovado e executado no shell tem acesso total ao sistema.

### Não substitui revisão humana

O Judge avalia o trabalho contra critérios objetivos, mas a confirmação
final ainda depende do operador. O harness reduz o risco de conclusão
prematura — não elimina a necessidade de revisão.

### Não impede comandos perigosos

Se você aprovar um plano que inclui `rm -rf`, o harness executará. A
segurança está na fase de planejamento e aprovação, não em bloqueios
automáticos de comandos.

## Boas práticas

1. Revise o plano antes de aprovar. Todo comando listado no plano será
   executado.
2. Mantenha `opencode.jsonc` sob controle de versão e revise permissões
   antes de compartilhar.
3. Não armazene tokens ou credenciais em arquivos de configuração. Use
   variáveis de ambiente.
4. Execute `/harness-security-scan` periodicamente para detectar secrets
   e permissões excessivas.
5. O repositório é público — não comite nada que não deveria ser visível.
