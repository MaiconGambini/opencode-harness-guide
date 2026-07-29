---
sidebar_position: 3
---

# Primeira Sessão

Este guia mostra como usar o harness em um projeto pela primeira vez.

## 1. Auditar o projeto

Dentro do OpenCode, execute:

```text
/harness-init
```

- Inspeciona o projeto **sem modificar nada**.
- Procura por instruções do projeto (AGENTS.md, CLAUDE.md).
- Procura por estado de progresso, lista de features e comandos de verificação.
- Verifica skills, plugins e segurança.
- Produz um relatório de gaps — o que existe, o que falta e o que seria criado.

## 2. Instalar o pacote completo (opcional)

Se o projeto é novo ou você quer padronizá-lo:

```text
/harness-bootstrap
```

- Propõe um pacote completo com confirmação explícita.
- Detecta a stack do projeto.
- Mostra cada arquivo como **create**, **merge** ou **skip** antes de escrever.

## 3. Começar a sessão

Toda sessão produtiva começa com:

```text
/harness-session-start
```

- Lê o estado, a lista de features, o handoff anterior e o comando de verificação.
- Ao final, declara a task ativa:

```text
Active task: feat-001 — Health endpoint. AC: curl /health returns 200.
```

## 4. Executar trabalho com PREVC

Para trabalho significativo:

```text
/prevc Adicionar endpoint de health check
```

- Gerencia o ciclo de vida: planeja, revisa, executa, valida, julga e confirma.
- Cada fase mantém o escopo aprovado.

## 5. Encerrar a sessão

Ao final, sempre execute:

```text
/harness-clean-handoff
```

- Registra o que foi feito, o que quebrou e a próxima ação.
- A próxima sessão lê esses arquivos e sabe exatamente onde continuar.

## Por que a inicialização merece sua própria fase (com resultado)

Inicializar e implementar têm objetivos diferentes. Misturar os dois força o
agente a escolher entre construir a infraestrutura e escrever código — e ele
tende a favorecer código visível, deixando a base frágil. Dedicar a sessão 1
só à inicialização (estrutura, testes, checklist, decomposição, commit
inicial) paga depois.

**Resultado** (estudo *Learn Harness Engineering*): com abordagem mista, a
sessão 2 gastou **~20 min** inferindo estrutura e build; com inicialização
dedicada, **&lt;3 min**. No projeto inteiro, a mista teve tempo total de
reconstrução **~60% maior**, e a pesquisa da Anthropic aponta **+31%** de
conclusão de features em cenários multi-sessão.

## Próximo passo

Leia [Por que um harness?](../concepts/why-a-harness) para entender o
problema que o harness resolve.
