---
sidebar_position: 4
---

# Limitações

O que o Harness OpenCode não faz na versão atual. Conhecer os limites evita
frustração e ajuda a decidir se o harness é a ferramenta certa para o seu
caso.

## Não é um produto SaaS

O harness é um conjunto de arquivos de configuração e scripts. Não há
servidor, API, autenticação ou dashboard.

## Não faz merge em configuração existente

A versão 1 suporta apenas instalação limpa — clonar em uma pasta vazia ou
instalar após backup. Não há script de merge que preserve a sua configuração
atual enquanto adiciona o harness.

## Não é um gerenciador de pacotes

Não há CLI de instalação, atualização automática ou versionamento semântico.
As atualizações são feitas via `git pull`.

## Não documenta todas as skills

O site documenta o workflow do harness. Skills especializadas (frontend,
backend, segurança ofensiva) que coexistem no repositório não têm capítulos
próprios na documentação.

## Não é multiplataforma completo

O harness foi projetado e testado no Windows com PowerShell 5.1+. Os scripts
de export e instalação são específicos para PowerShell. O runtime Node é
portável, mas não são fornecidos scripts shell equivalentes para Linux ou
macOS.

## Dependências

- OpenCode instalado e funcionando.
- Node.js 20+ para os plugins.
- PowerShell 5.1+ para os scripts de instalação.
- Git para clonagem e controle de versão.
