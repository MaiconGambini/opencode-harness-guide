---
sidebar_position: 1
---

# Perguntas Frequentes

## Instalação

### "npm install falhou"

Verifique se o Node.js 20+ está instalado:

```powershell
node --version
```

Se estiver abaixo de 20, atualize em [nodejs.org](https://nodejs.org) e rode
o `npm install` novamente.

### "O OpenCode não reconhece os comandos"

Feche e reabra o OpenCode. A configuração em `opencode.jsonc` é carregada
apenas na inicialização, então mudanças só entram em vigor após reiniciar.

### "Posso instalar em cima da minha configuração atual?"

Não na versão 1. Faça backup da sua pasta `~/.config/opencode` antes de
clonar. Depois, copie manualmente o que quiser manter.

## Uso

### "O que significa WIP=1?"

Apenas uma feature pode estar `in_progress` por vez. Isso evita trabalho
paralelo abandonado e mantém o foco em terminar antes de começar algo novo.

### "Preciso do sprint contract para toda tarefa?"

Não. Tarefas simples (um a três arquivos, escopo óbvio) usam o modo rápido.
O sprint contract é reservado para features complexas ou ambíguas.

### "O que acontece se eu pular o handoff?"

A próxima sessão não sabe o que foi feito. Você perde continuidade e precisa
reexplicar o contexto. O handoff é obrigatório no fim de toda sessão, mesmo
que o trabalho não tenha terminado.

### "Posso trabalhar em mais de uma feature ao mesmo tempo?"

Não. WIP=1 é uma regra central. Se você descobrir trabalho adjacente,
adicione-o como `not_started` e continue na feature ativa.

## Erros

### "init.ps1 falha mas o projeto funciona"

Registre o erro no `STATE.md` como um blocker. Corrija antes de criar novas
features. O harness não deve operar sobre uma baseline quebrada.

### "O build do site de documentação falha"

Links quebrados ou páginas faltando causam falha de build. Verifique a
mensagem de erro — o Docusaurus indica o arquivo e o link com problema.

### "Perdi o estado da sessão"

Se o handoff não foi feito, veja se os arquivos `STATE.md` e
`session-handoff.md` têm informação suficiente. Se não, você precisará
reconstruir o contexto manualmente — o harness não tem recuperação automática
de sessões sem handoff.
