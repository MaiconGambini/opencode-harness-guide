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

## Comandos bloqueados pelo security guard

O `harness-security-guard.ts` bloqueia padrões reconhecidos de:

- Remoção recursiva.
- `git reset --hard` e variantes destrutivas.
- `git clean` forçado.
- Shells remotos.
- Download seguido de execução.
- Acesso a caminhos sensíveis.

## Permission policy (pede aprovação)

O `harness-permission-policy.ts` pede aprovação explícita para:

- Push Git.
- Mutação de pacotes.
- Deploy.
- Pedidos de diretórios externos.

A regra de fallback para comandos Bash mutantes é **ask** — o padrão é
perguntar antes de executar.

No v1.3, `refiner` e `rule-verifier` são read-only: não editam, não executam
shell, não delegam e não acessam diretórios externos. Reviewers também não
gravam findings; o scheduler valida e escreve. Mudanças em `opencode.jsonc`
exigem restart antes de valer no processo do OpenCode.

## Logs e retenção

O `harness-tool-activity.ts` preserva registros JSONL **redigidos** conforme as
chaves de retenção configuradas. Logs ajudam no diagnóstico; eles não provam
que um objetivo foi concluído corretamente.

## Segredos

Nunca inclua credenciais, tokens, dados pessoais ou payloads sensíveis em:
goals, evidence, session handoff, logs de ferramentas ou documentos de
governança. Quando precisar registrar um fato sensível, use uma descrição
redigida — por exemplo: "token de integração presente e carregado pelo secret
store, nunca o valor".

## O que o harness NÃO protege

### Não há sandbox de sistema operacional

As políticas de permissão reduzem risco, mas **não** são uma fronteira de
segurança do sistema operacional. Um comando aprovado e executado no shell tem
acesso total ao sistema.

### Não substitui revisão humana

O Judge avalia o trabalho contra critérios objetivos, mas a confirmação final
ainda depende do operador. O harness reduz o risco de conclusão prematura —
não elimina a necessidade de revisão.

### O guard não cobre tudo

O security guard bloqueia padrões *reconhecidos*, mas não é infalível. A
segurança real ainda mora na fase de planejamento e aprovação: revise cada
comando do plano antes de aprovar.

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
