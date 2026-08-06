---
sidebar_position: 2
---

# Instalação

O Harness OpenCode é distribuído como um repositório Git público. Você clona
em `~/.config/opencode` e os arquivos ficam disponíveis imediatamente para
o OpenCode.

## Passo 1: Fazer backup da configuração atual (se existir)

Se você já tem um `~/.config/opencode` com seus próprios plugins e comandos,
renomeie a pasta antes de clonar:

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.config\opencode" -NewName "opencode-backup"
```

A versão 1 não faz merge automático em uma configuração existente. Use o
backup como referência e copie o que quiser depois.

## Passo 2: Clonar o repositório

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

## Passo 3: Instalar dependências Node

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

## Passo 4: Verificar a instalação

```powershell
npm run typecheck
npm test
```

Se ambos os comandos retornarem sem erros, o harness está pronto para uso.

## Estrutura resultante

Após a instalação, `~/.config/opencode` contém:

- `opencode.jsonc` — comandos globais e plugins.
- `skills/` — skills que o OpenCode carrega automaticamente.
- `plugins/` — plugins do runtime.
- `scripts/` — utilitários PowerShell e Node.
- `templates/` — templates reutilizáveis (feature_list, specs, standards).
- `package.json` — dependências e scripts de verificação.

Nada disso é compilado ou empacotado. São arquivos de texto e script que o
OpenCode lê diretamente.

## Solução de problemas

| Problema | Ação |
|---|---|
| `npm install` falha | Verifique se o Node.js 20+ está instalado (`node --version`). |
| `npm run typecheck` falha | O TypeScript pode estar desatualizado. Rode `npm ci` e tente novamente. |
| OpenCode não carrega os comandos | Feche e reabra o OpenCode. A configuração é carregada apenas na inicialização. |

## Próximo passo

Vá para [Primeira Sessão](./first-session) e use o harness pela primeira vez.
