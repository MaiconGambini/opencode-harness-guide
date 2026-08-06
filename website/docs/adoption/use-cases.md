---
sidebar_position: 1
---

# Casos de Uso

Cenários onde o Harness OpenCode traz mais benefício.

## Projetos multi-sessão

Se você trabalha no mesmo projeto por vários dias, o harness evita que cada
sessão comece do zero. O handoff registra exatamente onde parou.

**Quando usar:** qualquer projeto com mais de uma sessão de desenvolvimento.

## Trabalho em equipe

Quando mais de uma pessoa trabalha no mesmo repositório, o harness torna o
estado visível. `feature_list.json` mostra o que está em andamento, e o
handoff explica decisões e blockers.

**Quando usar:** projetos com 2+ colaboradores usando OpenCode.

## Projetos com verificação complexa

Se o projeto tem testes, lint, typecheck, build e scripts de verificação, o
harness automatiza a execução desses comandos como gates antes de declarar
conclusão.

**Quando usar:** projetos com CI/CD ou múltiplos comandos de verificação.

## Features ambíguas ou longas

Para features que levam mais de 30 minutos ou tem decisões de design não
triviais, o harness separa planejamento, execução e avaliação em papéis
distintos. Isso evita que o agente julgue o próprio trabalho sem critérios
objetivos.

**Quando usar:** features multi-componente, refatorações, integrações.

## Quando NÃO usar

- Tarefas únicas de 2 minutos em um projeto novo.
- Sessões exploratórias onde você está apenas lendo código.
- Projetos onde você é o único contribuidor e não precisa de handoff.
- Quando a disciplina adicional de WIP=1 e verificação atrapalha mais do
  que ajuda.
