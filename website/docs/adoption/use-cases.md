---
sidebar_position: 1
---

# Casos de Uso

Cenarios onde o Harness OpenCode traz mais beneficio.

## Projetos multi-sessao

Se voce trabalha no mesmo projeto por varios dias, o harness evita que cada
sessao comece do zero. O handoff registra exatamente onde parou.

**Quando usar:** qualquer projeto com mais de uma sessao de desenvolvimento.

## Trabalho em equipe

Quando mais de uma pessoa trabalha no mesmo repositorio, o harness torna o
estado visivel. `feature_list.json` mostra o que esta em andamento, e o
handoff explica decisoes e blockers.

**Quando usar:** projetos com 2+ colaboradores usando OpenCode.

## Projetos com verificacao complexa

Se o projeto tem testes, lint, typecheck, build e scripts de verificacao, o
harness automatiza a execucao desses comandos como gates antes de declarar
conclusao.

**Quando usar:** projetos com CI/CD ou multiplos comandos de verificacao.

## Features ambiguas ou longas

Para features que levam mais de 30 minutos ou tem decisões de design nao
triviais, o harness separa planejamento, execucao e avaliacao em papeis
distintos. Isso evita que o agente julgue o proprio trabalho sem criterios
objetivos.

**Quando usar:** features multi-componente, refatoracoes, integracoes.

## Quando NAO usar

- Tarefas unicas de 2 minutos em um projeto novo.
- Sessoes exploratorias onde voce esta apenas lendo codigo.
- Projetos onde voce e o unico contribuidor e nao precisa de handoff.
- Quando a disciplina adicional de WIP=1 e verificacao atrapalha mais do
  que ajuda.
