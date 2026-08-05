---
sidebar_position: 3
---

# Projeto Existente

Como adicionar o harness a um projeto que ja existe.

## Passo 1: Auditar

```text
/harness-init
```

O inicializador inspeciona o projeto sem escrever arquivos. Ele descobre:

- Instrucoes existentes.
- Estado de progresso atual.
- Comandos de verificacao e startup.
- Stack do projeto.

O resultado e um gap report — o que existe, o que falta.

## Passo 2: Instalar o minimo viavel

Para projetos pequenos, o minimo util e:

| Artefato | Por que existe |
|---|---|
| `AGENTS.md` curto | Regras, entry points e seguranca |
| `feature_list.json` ou `tasks.md` | WIP e proximas unidades |
| Arquivo de progresso | Blockers e proxima acao |
| Comando de verificacao | Baseline objetivo |
| `session-handoff.md` | Retomar em outro dia |

## Passo 3: Ou instalar o pacote completo

```text
/harness-bootstrap
```

O bootstrap propoe o pacote full com confirmacao. Ele detecta a stack,
descobre como verificar o projeto e mostra cada arquivo como create, merge
ou skip.

## Passo 4: Primeira sessao com harness

1. Rode o comando de verificacao descoberto.
2. Se falhar, registre o erro antes de criar features.
3. Preencha ou revise a lista de features.
4. Garanta WIP=1.
5. Comece toda sessao com `/harness-session-start`.

Adicione o restante dos artefatos apenas quando um failure mode real for
observado — nao crie burocracia sem necessidade.
