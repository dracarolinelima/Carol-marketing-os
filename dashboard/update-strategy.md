# Instrução para atualizar a análise estratégica

Cole este bloco no Claude Code para gerar uma nova análise:

---

```
Leia as fontes abaixo e execute uma análise estratégica situacional do Marketing OS,
seguindo a metodologia do mos-strategist.md. Persista o resultado em
dashboard/data/strategy.json com generatedAt, generatedBy, executionMethod e
sourceRevisions.

Fontes obrigatórias:
1. memory/carol-marketing-os/marketing-core.md
2. memory/carol-marketing-os/editorial-architecture-v2.md
3. dashboard/data/pipeline.json (estado atual)
4. .claude/agents/marketing-os/team/mos-strategist.md (metodologia)

O arquivo deve conter no mínimo:
- pipelineSummary (total, byStatus, pendingApproval)
- activeBlock (bloco atual com contents, nextNeeded, furtherProgression, publishedContext)
- alwaysOn (linha contínua com published, inReview, backlog, nextNeeded)
- transversal
- scientificPriorities
- whatDependsOnCaroline (decisões humanas com priority, decision, effect)
- whatAgentsCanDoAutonomously (ações possíveis dentro da autonomia B)
- nextStrategicWorkByTrack (bloco1 e alwaysOn com contextPublished, inProgress, nextEditorialNeed, progressionTowardsProcurar)
- nextActions (lista ordenada)
- strategicRationale

Não invente datas, URLs nem aprovações. Declare o executionMethod real.
Não modifique pipeline.json, marketing-core.md nem outros arquivos.
O Dashboard carrega strategy.json automaticamente via GET /api/strategy.
```

---

Após executar, recarregue o Dashboard no navegador. As telas Visão Geral,
Jornada e Calendário exibirão a análise atualizada. Se o pipeline mudou
desde a última análise, as telas mostram badge "Análise desatualizada".
