---
sidebar_position: 4
---

# Continual Harness v1.3

v1.3 transforma feedback de revisão em um sinal estruturado que pode orientar
execuções futuras. Ele não promete que o agente "aprende sozinho": o loop é
local ao projeto, medido pelos sinais configurados e limitado por permissões e
confirmação humana.

## Loop de comportamento

```text
ticket e risco
  -> manifest e regras ativas por ownership
  -> lanes executam e rodam gate local
  -> scheduler roda gate completo e risk router
  -> reviewers retornam findings tipados
  -> scheduler valida e grava a janela
  -> commit de código e Judge
  -> Refine propõe, sem escrever e sem votar
  -> awaiting_confirmation mostra o texto literal
  -> regra aprovada entra separadamente
  -> próxima execução injeta a regra nas lanes compatíveis
```

O gate mede o artefato, não a reputação do agente. Métricas e políticas são
declaradas em `agent-os/quality-thresholds.json`; controles do ciclo aprendido
ficam em `quality-thresholds.json#learned_rules`. Valor ausente, relatório stale
ou roster ausente são lacunas fail-closed.

## Findings tipados

Reviewers retornam records; eles não gravam arquivos. O scheduler valida e é o
único escritor de `docs/harness/findings/<run>.json`.

| Classe | Significado |
|---|---|
| `rule_violation` | Regra escrita foi violada; exige ponteiro exato |
| `operator_note` | Operador registrou uma correção manual |
| `blind_spot` | Problema real ainda sem regra aplicável |
| `defect` | Defeito que um gate deveria ter capturado |
| `nit` | Preferência sem regra por trás |

O envelope também liga o finding ao gate, roster, tier e manifest de lanes.
Sem esse contexto, um zero pode significar ausência de revisão, não ausência de
problemas. Adherence é um piso baseado no que foi detectado, não uma taxa real.

## Ledger e injeção

`agent-os/learned-rules.json` mantém regras ativas, conflitos e aposentadorias
do projeto. Os alvos permitidos e os níveis de enforcement são validados; uma
regra em prosa não se torna bloqueante por acidente.

Durante Planning, o scheduler cruza regras ativas com o ownership de cada lane
e cola somente as relevantes no prompt, dentro de uma cerca de dados não
confiáveis. A injeção fecha o loop: uma regra só influencia comportamento se
chega à capacidade que fará a mudança.

## Refine

Refine ocorre depois do Judge e antes de `awaiting_confirmation`. Ele lê a
janela de findings, o relatório do gate, o ledger e o histórico de adherence;
devolve uma proposta limitada por componente.

Refine:

- não edita, não executa shell, não delega e não acessa diretórios externos;
- não participa do payload nem do veredito do Judge;
- não aprova sua própria proposta;
- não altera os números governantes;
- registra nada por conta própria.

O texto literal, alvo, fontes e mecanismo de refutação são apresentados ao
operador. Regras capazes de bloquear e efeitos de alto risco mantêm aprovação
humana. A regra entra depois do código, em mudança separada, porque o rulebook
faz parte do hash de fonte do gate.

## Permissões

`opencode.jsonc` declara permissões específicas por agent, e
`harness-permission-policy.ts` reforça o roster read-only. Reviewers retornam
resultados ao scheduler; `refiner` e `rule-verifier` não possuem caminhos de
escrita. Essas políticas reduzem blast radius, mas não são sandbox de sistema
operacional. Alterações de configuração exigem restart para valer no processo
do OpenCode.

## O que está live

- Schemas e validação determinística de findings e ledger.
- Gates medidos, risk router e comportamento fail-closed.
- Contratos de manifest, injeção, revisão tipada e Refine.
- Templates com o toggle de auto-ativação desligado.
- Testes automatizados dos caminhos determinísticos.

## O que não está live ou comprovado

- A ativação automática de regras em prosa não está ativa;
  `learned_rules.auto_activate_prose_observe` vem `false`.
- A aceitação ao vivo com modelos não foi concluída; não há alegação de ganho
  medido nem de aceitação completa do fluxo.
- Configuração alterada não afeta um processo OpenCode já iniciado sem restart.
- Findings medem o que reviewers detectam; não provam recall total.
- Refine propõe melhoria, mas não garante que a proposta seja correta ou aceita.

Para escolher o fluxo adequado, veja [Casos de Uso](../adoption/use-cases).
