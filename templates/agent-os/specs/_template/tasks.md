# Tasks

> Cada ticket é um prompt autocontido (executável por um agente sem contexto implícito).
> Regras: nunca ticket só de teste · migration+schema no mesmo ticket · sem ticket de "foundation" ·
> ≤5 pontos (quebrar acima) · PR não-trivial < ~400 linhas · feature arriscada nasce com rollback+observabilidade ·
> grafo de dependências explícito (blockedBy), não inferido do título.

## <feat-id> — <título imperativo e específico>

### Context
<o problema e por que precisa ser resolvido>

### Scope
- In: <o que está incluso>
- Out: <o que está explicitamente fora>

### Dependencies
- blockedBy: [<feat-id>, ...]   # espelha feature_list.dependencies

### Technical Details
- Módulos/arquivos/funções afetados: <paths>
- Stack: <detectar do projeto>
- Risk: <low|medium|high>
- Feature flag: <nome | none>   # default OFF
- Rollout: <estratégia / kill switch quando há risco>

### Acceptance Criteria
- [ ] <critério observável>

### Test Scenarios
- [ ] <cenário>

### Events & Metrics
- <eventos/métricas/logs para saber se funciona>

<!-- i18n / factories quando aplicável ao projeto -->
