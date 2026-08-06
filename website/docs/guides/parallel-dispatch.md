---
sidebar_position: 5
---

# Dispatch Paralelo

Executa as tasks de um plano em **subagents paralelos**, cada um com seu
próprio modelo, sob o controle de lifecycle do PREVC. O `spec-lead` vira o
scheduler da fase Execute: recebe o plano aprovado, despacha as lanes
independentes ao mesmo tempo e reconcilia os resultados.

## Quando usar

- Plano com **lanes independentes** — arquivos disjuntos, sem dependência
  sequencial entre elas.
- Trabalho multi-componente onde partes distintas podem avançar juntas
  (ex: camada de autorização em paralelo com a de persistência).

**Quando NÃO usar:** plano WIP=1 estritamente serial, lanes que tocam o mesmo
arquivo, ou feature de 1 arquivo. Nesses casos o overhead do scheduler não
compensa — use o [fluxo de feature complexa](./complex-feature) ou de
[tarefa pequena](./small-task).

## Pré-requisitos

O dispatch paralelo de verdade depende de duas flags experimentais do OpenCode.
Sem elas, os subagents rodam **em série**:

```
OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
OPENCODE_EXPERIMENTAL_PARALLEL=true
```

O script `scripts/start-parallel.ps1` seta as duas e abre a sessão já no
`spec-lead`:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# opções: -Port 4097   -Dir "C:\outro\projeto"
```

## Os agentes

Cada agente tem modelo e permissão fixados em `opencode.jsonc`. O modelo
markdown em `agent/*.md` guarda o prompt; o bloco `agent` do JSON sobrescreve
`model`, `variant`, `mode` e `permission`.

| Agente | Papel | Modelo (exemplo) | Edita? |
|---|---|---|---|
| `spec-lead` | Scheduler + planejamento | `openai/gpt-5.6-sol` / high | não |
| `explorer` | Recon read-only | `opencode-go/deepseek-v4-flash` / low | não |
| `fixer` | Implementação de lane escopada | `opencode-go/deepseek-v4-flash` / high | sim |
| `code-reviewer` | Quality gate | `openai/gpt-5.6-sol` / medium | não |
| `test-automation-engineer` | Testes | `opencode-go/deepseek-v4-flash` / high | sim |

:::warning Permissões em background
Subagents em background usam apenas `allow`/`deny` — nunca `ask`. Um `ask`
penduraria a lane esperando uma aprovação que ninguém vê. A permissão por
agente **sobrescreve** o global do plugin.
:::

## Auto mode (padrão para executar um plano)

Uma instrução para executar um plano nomeado de ponta a ponta **é** a autorização
do run. Não precisa de `/prevc run` nem de aprovação no meio.

```
1. start-parallel.ps1                        → abre no spec-lead
2. "Execute all tasks in plan <path> ..."    → a instrução autoriza o run inteiro
   → planeja as lane tables, executa tudo, para UMA vez no final
3. (no fim) awaiting_confirmation             → você revisa e confirma
```

:::tip Roda do prompt até o fim sozinho
O run autônomo executa todas as tasks sem parar para aprovação e para **uma vez
só**, no `awaiting_confirmation` do spec inteiro. Ele interrompe no meio apenas
por um bloqueio real: uma task que exige operador/live (máquina física,
credencial, tráfego real), uma mudança de escopo, `push`/deploy, ou uma falha de
válidação irrecuperável.
:::

## Modo manual (trabalho ad-hoc)

Quando você **não** deu uma instrução de plano nomeado, o gate normal se aplica:

```
1. start-parallel.ps1   → abre no spec-lead
2. pede o trabalho      → propõe o plano, para em awaiting_plan_approval
3. "aprovado"           → sinaliza
4. /prevc run           → autoriza o Execute
```

:::note Por que `/prevc run` no modo manual
PREVC não é um processo rodando — é o comando `/prevc` que um agente executa. Sem
uma instrução de plano nomeado, ninguém autorizou o run, então o `spec-lead`
espera. `/prevc run` é o autorizador. No auto mode, a própria instrução já
autoriza — aí não precisa.
:::

## Receita pronta (copiar e colar)

**1. Abrir a sessão** no diretório do projeto:

```powershell
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1"
# segundo projeto ao mesmo tempo: -Port 4097 -Dir "C:\outro\projeto"
```

**2. Passar o plano** — template reutilizável, troca só o caminho. A instrução já
autoriza o run inteiro; ele roda até o fim e para uma vez no `awaiting_confirmation`:

```text
Execute all tasks in plan agent-os/specs/<PASTA-DO-PLANO> end to end under PREVC —
this authorizes a full autonomous run.
Propose a lane table per phase; parallelize independent lanes,
serialize lanes sharing a file. Use recommended subagents.
When all tasks land, run @code-reviewer and @architecture-reviewer in parallel
over the diff; both must score 9+ with zero critical/blocking issues.
Stop only at the final awaiting_confirmation for the whole spec.
```

**3. Confirmar no fim** — quando todo o plano termina, ele para em
`awaiting_confirmation` com os arquivos mudados e a evidência. Você revisa e confirma.

:::tip Plano com gates de operador ou live
Se o plano tem tasks que exigem máquina física, credencial ou tráfego real, o run
autônomo **para sozinho** ao bater no primeiro gate e reporta `blocked`. Para ser
explícito, troque a primeira linha por:

```text
Execute only the agent-implementable tasks in plan <path> under PREVC,
and STOP at <Task N> (operator/live).
```

Um plano sem gates roda inteiro sem parar. Para o segundo reviewer, use o par que a
task de review final do `plan.md` do spec indicar; se o plano não diz,
`code-reviewer` + `architecture-reviewer`.
:::

## A lane table

Antes de despachar, o `spec-lead` monta uma tabela de lanes (no auto mode não
para para aprovação — a instrução já autorizou). Cada lane declara ownership de
arquivo — **uma lane write-capable por arquivo de cada vez**.

```
┌──────┬─────────────────────────┬──────────────────────────┬──────┬──────────────┐
│ Lane │ Objetivo                │ Ownership (arquivos)     │ Dep  │ Capability   │
├──────┼─────────────────────────┼──────────────────────────┼──────┼──────────────┤
│ L1   │ Camada de autorização   │ authorization/, routes/  │ —    │ fixer        │
│ L2   │ Camada de persistência  │ área_bindings/sql_*.py   │ —    │ fixer        │
│ L3   │ Testes L1+L2            │ tests/...                │ L1,2 │ test-eng     │
└──────┴─────────────────────────┴──────────────────────────┴──────┴──────────────┘
```

Ownership que se cruza = lanes **não** independentes → serializa ou funde numa
lane só. É regra de prompt, não lock: duas lanes no mesmo arquivo sobrescrevem
uma à outra em silêncio.

## Acompanhar um worker ao vivo

`task_status` só retorna `running | completed | cancelled`, sem output parcial.
Para assistir uma lane rodando, abra outro terminal e conecte na child session:

```powershell
opencode session list
opencode attach http://127.0.0.1:4096 --session <childId>
```

## Rodar dois projetos ao mesmo tempo

Cada server OpenCode ocupa uma porta. Para um segundo projeto, use outra porta
e outro diretório:

```powershell
# projeto A
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1" -Port 4096 -Dir "C:\projeto-a"
# projeto B
& "$env:USERPROFILE\.config\opencode\scripts\start-parallel.ps1" -Port 4097 -Dir "C:\projeto-b"
```

| Cenário | OK? |
|---|---|
| 2 sessões, projetos diferentes, portas diferentes | ✅ isolado |
| 2 sessões, mesmo projeto, worktrees diferentes | ✅ |
| 2 sessões, **mesma pasta** | ❌ colisão de arquivo — os schedulers não compartilham ownership |

Dois schedulers = 2× subagents em background = 2× carga nos providers. Um plano
denso satura sozinho; dois podem bater rate limit sem ir mais rápido.

## Limites conhecidos

- Sem os env flags, o dispatch é **serial** — sempre use o script.
- `--yolo` / `--auto` **não acelera** aqui: ele só remove prompt de permissão,
  não os gates conversacionais do PREVC. E auto-aprova o gate da lane table,
  perdendo o controle de ownership. Evite em plano de produção.
- `Ctrl+C` no `spec-lead` **não** mata os filhos em background.
- Ownership de arquivo é regra de prompt, não lock — para isolamento real entre
  lanes que colidem, use [git worktrees](./portability).
