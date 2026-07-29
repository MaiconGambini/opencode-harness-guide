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

Isso gera `opencode-harness-export.zip` na area de trabalho. O arquivo
inclui `opencode.jsonc`, skills, plugins, templates, scripts e `package.json`
— sem `node_modules`.

## Instalar no outro PC

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

O script instala as dependencias Node na maquina de destino. Binarios de
plataforma (tsx) exigem `npm install` local; copiar `node_modules` entre
sistemas diferentes nao funciona.

## Via Git (recomendado)

A forma mais simples e confiavel e clonar o repositorio publico:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

Isso garante que voce sempre tenha a versao mais recente e que as
dependencias sejam instaladas corretamente para sua plataforma.

## Cuidados

- Nao copie `node_modules` entre maquinas.
- Revise `opencode.jsonc` apos a instalacao. Caminhos usam
  `$env:USERPROFILE` e `os.homedir()`, entao nenhuma edicao manual de
  caminho e necessaria em um perfil Windows padrao.
- Se voce tem uma configuracao existente, faca backup antes de sobrescrever.
