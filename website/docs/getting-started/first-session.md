---
sidebar_position: 3
---

# Primeira Sessao

Este guia mostra como usar o harness em um projeto pela primeira vez.

## 1. Auditar o projeto

Dentro do OpenCode, execute:

```text
/harness-init
```

Esse comando inspeciona o projeto sem modificar nada. Ele procura por:

- Instrucoes do projeto (AGENTS.md, CLAUDE.md).
- Estado de progresso.
- Lista de features.
- Comandos de verificacao.
- Skills, plugins e seguranca.

O resultado e um relatorio de gaps — o que existe, o que falta e o que
seria criado.

## 2. Instalar o pacote completo (opcional)

Se o projeto e novo ou voce quer padroniza-lo:

```text
/harness-bootstrap
```

O bootstrap propoe um pacote completo com confirmacao explicita. Ele detecta
a stack do projeto e mostra cada arquivo como **create**, **merge** ou
**skip** antes de escrever.

## 3. Comecar a sessao

Toda sessao produtiva comeca com:

```text
/harness-session-start
```

Ele le o estado, a lista de features, o handoff anterior e o comando de
verificacao. Ao final, declara a task ativa:

```text
Active task: feat-001 — Health endpoint. AC: curl /health returns 200.
```

## 4. Executar trabalho com PREVC

Para trabalho significativo:

```text
/prevc Adicionar endpoint de health check
```

O PREVC gerencia o ciclo de vida: planeja, revisa, executa, valida, julga e
confirma. Cada fase mantem o escopo aprovado.

## 5. Encerrar a sessao

Ao final, sempre execute:

```text
/harness-clean-handoff
```

Ele registra o que foi feito, o que quebrou e a proxima acao. A proxima
sessao le esses arquivos e sabe exatamente onde continuar.

## Proximo passo

Leia [Por que um harness?](../concepts/why-a-harness) para entender o
problema que o harness resolve.
