---
sidebar_position: 2
---

# Instalação do runtime

O Harness OpenCode é distribuído como um repositório Git público. Este guia
instala o runtime em `~/.config/opencode`; instalar o site de documentação é
um processo separado descrito no [README do repositório](https://github.com/MaiconGambini/opencode-harness-guide#readme).

Você clona a árvore na configuração do OpenCode e reinicia o processo após a
instalação.

## Passo 1: Fazer backup da configuração atual (se existir)

Se você já tem um `~/.config/opencode` com seus próprios plugins e comandos,
renomeie a pasta antes de clonar:

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.config\opencode" -NewName "opencode-backup"
```

A instalação atual não faz merge automático em uma configuração existente. Use
o backup como referência e copie o que quiser depois.

## Passo 2: Clonar o repositório

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

## Passo 3: Instalar dependências do runtime

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm ci
```

## Passo 4: Verificar a instalação

```powershell
npm run typecheck
npm test
```

Se ambos os comandos retornarem sem erros, feche e reabra o OpenCode. O runtime
carrega a configuração apenas na inicialização.

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
| `npm ci` falha | Verifique se o Node.js 20+ está instalado (`node --version`). |
| `npm run typecheck` falha | O TypeScript pode estar desatualizado. Rode `npm ci` e tente novamente. |
| OpenCode não carrega os comandos | Feche e reabra o OpenCode. A configuração é carregada apenas na inicialização. |

## Próximo passo

Vá para [Primeira Sessão](./first-session) e use o harness pela primeira vez.
