---
sidebar_position: 3
---

# Seguranca

Limites de seguranca do Harness OpenCode.

## O que o harness protege

- **Estado duravel** — blockers, decisoes e handoffs sao registrados em
  arquivos. Nenhuma informacao de estado vive apenas na memoria do chat.
- **Permissoes declarativas** — `opencode.jsonc` define regras de edicao,
  execucao de comandos e acesso a diretorios externos.
- **Verificacao em tres camadas** — todo resultado e validado antes de
  ser marcado como concluido.
- **Rastreabilidade** — cada mudanca e associada a uma feature, com
  evidencia e aprovacao registradas.

## O que o harness NAO protege

### Nao ha sandbox de sistema operacional

As politicas de permissao controlam o que o agente pode fazer dentro do
OpenCode, mas nao isolam o processo do sistema operacional. Um comando
aprovado e executado no shell tem acesso total ao sistema.

### Nao substitui revisao humana

O Judge avalia o trabalho contra criterios objetivos, mas a confirmacao
final ainda depende do operador. O harness reduz o risco de conclusao
prematura — nao elimina a necessidade de revisao.

### Nao impede comandos perigosos

Se voce aprovar um plano que inclui `rm -rf`, o harness executara. A
seguranca esta na fase de planejamento e aprovacao, nao em bloqueios
automaticos de comandos.

## Boas praticas

1. Revise o plano antes de aprovar. Todo comando listado no plano sera
   executado.
2. Mantenha `opencode.jsonc` sob controle de versao e revise permissoes
   antes de compartilhar.
3. Nao armazene tokens ou credenciais em arquivos de configuracao. Use
   variaveis de ambiente.
4. Execute `/harness-security-scan` periodicamente para detectar secrets
   e permissoes excessivas.
5. O repositorio e publico — nao comite nada que nao deveria ser visivel.
