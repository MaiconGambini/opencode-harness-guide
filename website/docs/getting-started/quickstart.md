---
sidebar_position: 2
---

# Início Rápido (Zero-to-Hero em 5 minutos)

Este guia leva de um projeto limpo ao primeiro objetivo no Harness OpenCode em
três passos. O OpenCode é a referência metodológica: PREVC separa planejamento,
aprovação, execução e validação, enquanto estado e handoff preservam a
continuidade entre sessões.

## Passo 1: Clonar e instalar o harness

Clone o repositório público na pasta de configuração do runtime OpenCode
(`~/.config/opencode`) e instale as dependências fixadas pelo lockfile:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm ci
```

Feche e reabra o OpenCode para carregar os comandos globais e plugins. Se a
execução usar o motor OMP, obtenha a árvore OMP separadamente e siga a
instalação documentada para esse runtime; não trate os dois diretórios de
configuração como uma única instalação.

## Passo 2: Iniciar a primeira tarefa com o ciclo PREVC

No terminal do OpenCode, dentro da pasta do projeto, execute:

```text
/prevc prepare "Criar rota POST /auth/login com JWT"
```

O harness classifica o risco, descobre o contexto técnico e inicia a transição
controlada de fases. O plano aguarda aprovação explícita antes da execução.

## Passo 3: Observar o ciclo completo

O PREVC é o contrato comum entre OpenCode e Oh My Pi. Ele agrupa sete etapas em
quatro fases:

1. **Prepare** = `prepare` + `plan`: descobre contexto, risco e escopo.
2. **Execute** = `execute`: implementa o plano aprovado sob WIP=1.
3. **Validate** = `validate` + `judge`: coleta evidência e avalia o resultado.
4. **Confirm** = `refine` + `confirm`: apresenta melhorias e aguarda o operador.

No OpenCode, estado durável, plugins e continuidade entre sessões implementam o
contrato. O Oh My Pi oferece despacho paralelo nativo.

Para a instalação completa, consulte [Instalação](./installation) e, para o
fluxo operacional, [Primeira Sessão](./first-session).
