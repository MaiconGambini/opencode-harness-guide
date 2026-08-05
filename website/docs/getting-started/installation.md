---
sidebar_position: 2
---

# Instalacao

O Harness OpenCode e distribuido como um repositorio Git publico. Voce clona
em `~/.config/opencode` e os arquivos ficam disponiveis imediatamente para
o OpenCode.

## Passo 1: Fazer backup da configuracao atual (se existir)

Se voce ja tem um `~/.config/opencode` com seus proprios plugins e comandos,
renomeie a pasta antes de clonar:

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.config\opencode" -NewName "opencode-backup"
```

A versao 1 nao faz merge automatico em uma configuracao existente. Use o
backup como referencia e copie o que quiser depois.

## Passo 2: Clonar o repositorio

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

## Passo 3: Instalar dependencias Node

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

## Passo 4: Verificar a instalacao

```powershell
npm run typecheck
npm test
```

Se ambos os comandos retornarem sem erros, o harness esta pronto para uso.

## Estrutura resultante

Apos a instalacao, `~/.config/opencode` contem:

- `opencode.jsonc` — comandos globais e plugins.
- `skills/` — skills que o OpenCode carrega automaticamente.
- `plugins/` — plugins do runtime.
- `scripts/` — utilitarios PowerShell e Node.
- `templates/` — templates reutilizaveis (feature_list, specs, standards).
- `package.json` — dependencias e scripts de verificacao.

Nada disso e compilado ou empacotado. Sao arquivos de texto e script que o
OpenCode le diretamente.

## Solucao de problemas

| Problema | Acao |
|---|---|
| `npm install` falha | Verifique se o Node.js 20+ esta instalado (`node --version`). |
| `npm run typecheck` falha | O TypeScript pode estar desatualizado. Rode `npm ci` e tente novamente. |
| OpenCode nao carrega os comandos | Feche e reabra o OpenCode. A configuracao e carregada apenas na inicializacao. |

## Proximo passo

Va para [Primeira Sessao](./first-session) e use o harness pela primeira vez.
