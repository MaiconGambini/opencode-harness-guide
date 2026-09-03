---
sidebar_position: 4
---

# Limitações

O que o Harness OpenCode não faz na configuração atual — e o que é lacuna
explícita, não capacidade.

## Não é um produto SaaS

O harness é um conjunto de arquivos de configuração e scripts. Não há
servidor, API, autenticação ou dashboard.

## Não faz merge em configuração existente

A instalação atual suporta apenas o caminho limpo (clonar em uma pasta vazia ou
após backup). Não há script de merge que preserve sua configuração atual
enquanto adiciona o harness.

## Não é um gerenciador de pacotes

Não há CLI de instalação, atualização automática ou versionamento
semântico. Atualizações são feitas via `git pull`.

## Não documenta todas as skills

O site documenta o fluxo do harness. Skills especializadas (frontend, backend e
segurança) que coexistem no repositório não têm capítulos próprios na
documentação.

## Não é multiplataforma completo

O harness foi projetado e testado no Windows com PowerShell 5.1+.
Scripts de export e instalação são específicos para PowerShell. O runtime
Node é portável, mas scripts shell não são fornecidos.

## Dependências

- OpenCode instalado e funcionando.
- Node.js 20+ para plugins.
- PowerShell 5.1+ para scripts de instalação.
- Git para clonagem e controle de versão.
