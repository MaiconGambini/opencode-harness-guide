---
sidebar_position: 3
---

# Projeto Existente

Como adicionar o harness a um projeto que já existe, sem quebrar o que já
funciona. O princípio é sempre o mesmo: auditar antes de escrever, instalar o
mínimo viável e crescer só quando um problema real justificar.

## Passo 1: Auditar

```text
/harness-init
```

O inicializador inspeciona o projeto **sem escrever nenhum arquivo**. Ele
descobre:

- Instruções existentes (`AGENTS.md`, `CLAUDE.md`, `README`).
- O estado de progresso atual, se houver.
- Comandos de verificação e de startup (scripts, Makefile, `package.json`).
- A stack do projeto (linguagem, frameworks, gerenciador de pacotes).

O resultado é um **gap report**: o que já existe e o que falta para o harness
operar. Nada é modificado nesta fase — é só leitura.

## Passo 2: Instalar o mínimo viável

Para projetos pequenos, comece com o conjunto mínimo útil. Cada artefato
resolve um failure mode concreto:

| Artefato | Por que existe |
|---|---|
| `AGENTS.md` curto | Regras, entry points e limites de segurança |
| `feature_list.json` ou `tasks.md` | Controle de WIP e próximas unidades de trabalho |
| Arquivo de progresso (`STATE.md`) | Blockers e próxima ação a executar |
| Comando de verificação | Baseline objetiva para dizer "está passando" |
| `session-handoff.md` | Retomar o contexto em outro dia |

Não instale mais do que isso de saída. Um projeto que ainda não sofreu com
perda de contexto não precisa da estrutura completa.

## Passo 3: Ou instalar o pacote completo

Quando o projeto já é grande ou vários colaboradores usam OpenCode, vale
instalar o pacote completo de uma vez:

```text
/harness-bootstrap
```

O bootstrap propõe o pacote full com confirmação explícita. Ele:

- Detecta a stack automaticamente.
- Descobre como verificar o projeto (quais comandos rodar).
- Mostra cada arquivo classificado como **create**, **merge** ou **skip**,
  para você aprovar antes de qualquer escrita.

## Passo 4: Primeira sessão com harness

Depois da instalação, a primeira sessão real segue esta ordem:

1. Rode o comando de verificação descoberto no passo de auditoria.
2. Se ele falhar, **registre o erro antes de criar qualquer feature**. Um
   harness não deve operar sobre uma baseline quebrada.
3. Preencha ou revise a lista de features com o trabalho conhecido.
4. Garanta WIP=1 — no máximo uma feature `in_progress`.
5. Comece toda sessão dali em diante com `/harness-session-start`.

## Crescer sob demanda

Adicione o restante dos artefatos (sprint contract, rubrica de avaliação,
separação de papéis) apenas quando um failure mode real for observado — por
exemplo, quando uma feature complexa der errado por falta de contrato. Não
crie burocracia sem necessidade: o harness deve pesar menos do que o problema
que ele resolve.
