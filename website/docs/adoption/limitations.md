---
sidebar_position: 4
---

# Limitacoes

O que o Harness OpenCode nao faz na versao atual.

## Nao e um produto SaaS

O harness e um conjunto de arquivos de configuracao e scripts. Nao ha
servidor, API, autenticacao ou dashboard.

## Nao faz merge em configuracao existente

A versao 1 suporta apenas instalacao limpa (clonar em uma pasta vazia ou
apos backup). Nao ha script de merge que preserve sua configuracao atual
enquanto adiciona o harness.

## Nao e um gerenciador de pacotes

Nao ha CLI de instalacao, atualizacao automatica ou versionamento
semantico. Atualizacoes sao feitas via `git pull`.

## Nao documenta todas as skills

O site documenta o workflow do harness. Skills especializadas (frontend,
backend, seguranca ofensiva) que coexistem no repositorio nao tem capitulos
proprios na documentacao.

## Nao e multiplataforma completo

O harness foi projetado e testado no Windows com PowerShell 5.1+.
Scripts de export e instalacao sao especificos para PowerShell. O runtime
Node e portavel, mas scripts shell nao sao fornecidos.

## Dependencias

- OpenCode instalado e funcionando.
- Node.js 20+ para plugins.
- PowerShell 5.1+ para scripts de instalacao.
- Git para clonagem e controle de versao.
