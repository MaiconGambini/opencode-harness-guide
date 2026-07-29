---
sidebar_position: 4
---

# Portabilidade

O harness pode ser movido entre máquinas ou compartilhado com outros
desenvolvedores. Há três caminhos: export por script, instalação a partir de
uma cópia e clonagem via Git (o mais recomendado).

## Via Git (recomendado)

A forma mais simples e confiável é clonar o repositório público:

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

- Garante que você sempre tenha a versão mais recente.
- As dependências são instaladas corretamente para a sua plataforma.
- Atualizar depois é só um `git pull` seguido de `npm install`.

## Exportar do PC atual

Quando não dá para usar Git — máquina isolada, transferência offline — gere
um pacote com o script de export:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\export-opencode-harness.ps1"
```

- Gera `opencode-harness-export.zip` na área de trabalho.
- Inclui `opencode.jsonc`, skills, plugins, templates, scripts e
  `package.json`.
- **Não inclui** `node_modules` de propósito — binários de plataforma não são
  portáveis.

## Instalar a partir da cópia

No PC de destino, com o conteúdo do zip extraído, rode o instalador:

```powershell
& ".\install-opencode-harness.ps1" -SourceRoot "." -TargetRoot "$env:USERPROFILE\.config\opencode"
Set-Location "$env:USERPROFILE\.config\opencode"
npm install
```

- O script copia os arquivos para o destino.
- O `npm install` instala as dependências Node localmente.
- Binários de plataforma (como o `tsx`) exigem esse `npm install` local:
  copiar `node_modules` entre sistemas diferentes não funciona.

## Cuidados

- **Não copie `node_modules` entre máquinas.** Sempre rode `npm install` no
  destino.
- **Revise `opencode.jsonc` após a instalação.** Os caminhos usam
  `$env:USERPROFILE` e `os.homedir()`, então nenhuma edição manual de caminho
  é necessária em um perfil Windows padrão.
- **Faça backup antes de sobrescrever.** Se você já tem uma configuração em
  `~/.config/opencode`, copie-a para um local seguro antes de clonar ou
  instalar por cima.
