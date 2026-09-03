---
sidebar_position: 1
---

# Início rápido

Este caminho leva de um projeto limpo ao primeiro objetivo no Harness OpenCode.
O OpenCode é a referência de metodologia: o PREVC separa planejamento,
aprovação, execução e validação, enquanto o estado e o handoff preservam a
continuidade entre sessões. Para a instalação completa, consulte
[Instalação](./installation).

1. **Instale o harness de referência.** Em uma configuração limpa, execute o
   comando suportado para clonar o repositório:

   ```powershell
   git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
   ```

   Se a execução usar o motor OMP, depois de obter a árvore OMP execute o
   mesmo bloco copy-pasteável documentado na instalação do OMP:

   ```powershell
   $target = Join-Path $env:USERPROFILE ".omp\agent"
   New-Item -ItemType Directory -Force $target | Out-Null
   Copy-Item -Path ".\omp\agent\*" -Destination $target -Recurse -Force
   ```

   Depois, siga os passos de dependências e verificação de [Instalação](./installation)
   antes de iniciar o OpenCode.

2. **Prepare um objetivo no projeto.** Dentro do OpenCode, execute exatamente:

   ```text
   /prevc prepare "Criar rota POST /auth/login com JWT"
   ```

3. **Observe o ciclo antes de executar.** O PREVC apresenta o plano, o escopo e
   os critérios de aceite para aprovação explícita. Após a aprovação, ele
   executa somente o escopo aprovado, roda os testes e gates de validação e
   entrega prova verificável do resultado. O Judge compara a entrega com o
   contrato inicial, e o handoff registra estado, evidências, blockers e a
   próxima ação para que outra sessão possa continuar. Consulte
   [Primeira Sessão](./first-session) para o fluxo operacional completo.
