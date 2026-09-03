# Site de documentação do Harness OpenCode

Este diretório contém o site público bilíngue do Harness OpenCode, gerado com
Docusaurus. O conteúdo padrão em `docs/` é pt-BR; a versão em inglês fica em
`i18n/en/`.

## Desenvolvimento local

Na raiz do repositório, instale somente as dependências do site:

```powershell
npm ci --prefix website
npm --prefix website start
```

Abra `http://localhost:3000/opencode-harness-guide/`. Alterações em
`website/docs/` e `website/src/` aparecem durante o desenvolvimento.

## Verificação

```powershell
npm run build --prefix website
```

O build detecta links internos quebrados e problemas de geração do site. A
verificação do runtime OpenCode fica na raiz do repositório:

```powershell
npm run typecheck
npm test
```

## Instalação do runtime

Instalar as dependências do site não instala o harness. Para instalar o runtime
OpenCode, siga o [README da raiz](../README.md) e o
[guia de instalação](docs/getting-started/installation.md). A instalação do
runtime usa `~/.config/opencode`; a do site usa o prefixo `website`.

## Publicação

```powershell
npm run build --prefix website
```

Para publicar no GitHub Pages, use o workflow configurado no repositório ou:

```powershell
GIT_USER=<seu-usuario-do-github> npm run deploy --prefix website
```
