# Harness OpenCode

Workflow de agentes com estado duravel, evidencias e handoff entre sessoes
para projetos [OpenCode](https://opencode.ai).

## O que e

O Harness OpenCode organiza o trabalho com agentes em ciclos previsiveis:
planejar, executar, verificar e entregar. Cada sessao comeca sabendo onde
parou e termina com um handoff limpo para a proxima.

## Documentacao

**[opencode-harness-guide.docs](https://maicongambini.github.io/opencode-harness-guide/)**

## Instalacao

```powershell
git clone https://github.com/MaiconGambini/opencode-harness-guide.git "$env:USERPROFILE\.config\opencode"
cd "$env:USERPROFILE\.config\opencode"
npm install
```

## Verificacao

```powershell
npm run typecheck
npm test
```

## Estrutura

- `opencode.jsonc` — comandos globais e plugins.
- `skills/` — skills carregadas pelo OpenCode.
- `plugins/` — plugins do runtime.
- `scripts/` — utilitarios PowerShell e Node.
- `templates/` — templates reutilizaveis.
- `website/` — site de documentacao (Docusaurus).

## Documentacao local

```powershell
npm --prefix website install
npm --prefix website start
```

Abre `http://localhost:3000/opencode-harness-guide/`.

## Limitacoes

- Versao 1 suporta apenas instalacao limpa (clone em pasta vazia ou apos
  backup). Nao faz merge em configuracao existente.
- Projetado e testado no Windows com PowerShell 5.1+.
- Nao ha sandbox de sistema operacional. Policies controlam permissoes,
  nao isolamento.

## Licenca

Este repositorio e publico. Revise os arquivos antes de compartilhar
informacoes que nao deveriam ser publicas.
