---
sidebar_position: 4
---

# Portabilidade

O harness pode ser movido entre maquinas ou compartilhado com outros
desenvolvedores.

## Exportar do PC atual

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"
```

Isso gera `opencode-harness-export.zip` na área de trabalho. O arquivo
inclui `opencode.jsonc`, skills, plugins, templates, scripts e `package.json`
— sem `node_modules`.

## Instalar no outro PC

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

O script instala as dependências Node na maquina de destino. Binários de
plataforma (tsx) exigem `npm install` local; copiar `node_modules` entre
sistemas diferentes não funciona.

## Via Git (recomendado)

A forma mais simples e confiável e clonar o repositório público:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

Isso garante que você sempre tenha a versão mais recente e que as
dependências sejam instaladas corretamente para sua plataforma.

## Cuidados

- Não copie `node_modules` entre maquinas.
- Revise `opencode.jsonc` após a instalação. Caminhos usam
  `$env:USERPROFILE` e `os.homedir()`, então nenhuma edição manual de
  caminho é necessária em um perfil Windows padrão.
- Se você tem uma configuração existente, faca backup antes de sobrescrever.
