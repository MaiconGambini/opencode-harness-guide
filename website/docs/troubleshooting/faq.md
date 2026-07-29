---
sidebar_position: 1
---

# Perguntas Frequentes

## Instalacao

### "npm install falhou"

Verifique se o Node.js 20+ esta instalado:

```powershell
node --version
```

Se estiver abaixo de 20, atualize em [nodejs.org](https://nodejs.org).

### "OpenCode nao reconhece os comandos"

Feche e reabra o OpenCode. A configuracao em `opencode.jsonc` e carregada
apenas na inicializacao.

### "Posso instalar em cima da minha configuracao atual?"

Nao na versao 1. Faca backup da sua pasta `~/.config/opencode` antes de
clonar. Depois, copie manualmente o que quiser manter.

## Uso

### "O que significa WIP=1?"

Apenas uma feature pode estar `in_progress` por vez. Isso evita trabalho
paralelo abandonado e mantem o foco.

### "Preciso do sprint contract para toda tarefa?"

Nao. Tarefas simples (1-3 arquivos, escopo obvio) usam o modo rapido.
O sprint contract e para features complexas ou ambiguas.

### "O que acontece se eu pular o handoff?"

A proxima sessao nao sabe o que foi feito. Voce perde continuidade e
precisa reexplicar o contexto. O handoff e obrigatorio no fim de toda
sessao, mesmo que o trabalho nao tenha terminado.

### "Posso trabalhar em mais de uma feature ao mesmo tempo?"

Nao. WIP=1 e uma regra central. Se voce descobrir trabalho adjacente,
adicione como `not_started` e continue na feature ativa.

## Erros

### "init.ps1 falha mas o projeto funciona"

Registre o erro no `STATE.md` como um blocker. Corrija antes de criar
novas features. O harness nao deve operar com baseline quebrada.

### "O build do site de documentacao falha"

Links quebrados ou paginas faltando causam falha de build. Verifique a
mensagem de erro — o Docusaurus indica o arquivo e o link com problema.

### "Perdi o estado da sessao"

Se o handoff nao foi feito, veja se os arquivos `STATE.md` e
`session-handoff.md` tem informacao suficiente. Se nao, voce precisara
reconstruir o contexto manualmente — o harness nao tem recuperacao
automatica de sessoes sem handoff.
