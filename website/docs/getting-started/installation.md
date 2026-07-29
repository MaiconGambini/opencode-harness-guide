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

- A versão 1 não faz merge automático em uma configuração existente.
- Use o backup como referência e copie o que quiser depois.

## Passo 2: Clonar o repositório

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
```

- O repositório é clonado direto no diretório de configuração do OpenCode.

## Passo 3: Instalar dependências Node

```powershell
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

- Entra no diretório recém-clonado.
- Baixa as dependências dos plugins e scripts do harness.

## Passo 4: Verificar a instalação

```powershell
npm run typecheck
npm test
```

- `npm run typecheck` confere os tipos TypeScript dos plugins.
- `npm test` roda a suíte de testes do harness.
- Se ambos os comandos retornarem sem erros, o harness está pronto para uso.

## Estrutura resultante

Após a instalação, `~/.config/opencode` contém:

| Item | Conteúdo |
|---|---|
| `opencode.jsonc` | Comandos globais e plugins. |
| `skills/` | Skills que o OpenCode carrega automaticamente. |
| `plugins/` | Plugins do runtime. |
| `scripts/` | Utilitários PowerShell e Node. |
| `templates/` | Templates reutilizáveis (feature_list, specs, standards). |
| `package.json` | Dependências e scripts de verificação. |

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
