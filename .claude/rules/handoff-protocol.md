# Protocolo de Handoff - Marketing OS

## Princípio

Todo agente que conclui trabalho em um conteúdo deve registrar a transferência via API do Dashboard antes de encerrar.

Não edite pipeline.json. Se o Dashboard não responder, não encerre a etapa, não edite o arquivo e informe a falha na sua entrega.

## Endpoints

### POST /api/content/:id/handoff

#### Campos obrigatórios

- agent: nome do agente (exatamente como registrado: Orchestrator, Scientific Research, Strategist, Creator, Editor, Art Director, Caroline)
- expectedRevision: número da revision atual do conteúdo (controle de concorrência)
- toOwner: próximo responsável (agente ou Caroline; null para liberar)
- note: obrigatória quando há mudança de status, pendingType diferente de nenhuma, devolução, ou devolução após aprovação

#### Campos opcionais

- pendingType: decisao, aprovacao, execucao, bloqueio, nenhuma (default: nenhuma)
- blockerReason: string (obrigatório quando pendingType = bloqueio)
- status: novo status (transições restritas para agentes)
- nextAction: descrição da próxima ação (obrigatório quando pendingType = execucao)
- artifact: caminho relativo ao projeto de artefato produzido

#### Exceção: Caroline conclui execução sem toOwner

Quando Caroline conclui uma execução (pendingType atual = execucao) e envia o handoff sem informar toOwner, o servidor aplica automaticamente:
- toOwner: Art Director
- pendingType: nenhuma
- nextAction: "Visual QA"

Essa é a única situação em que toOwner pode ser omitido. Nos demais casos, omitir toOwner resulta em 400.

### GET /api/content/:id

Retorna o registro completo de um conteúdo, incluindo revision, currentOwner, pendingType e histórico.

### POST /api/content/:id/service-run

Para serviços (Audience Intelligence, Market Research, Performance Analyst):

- agent: nome do serviço
- expectedRevision: revision atual
- requestedBy: quem solicitou (deve ser currentOwner, Orchestrator ou Caroline)
- note: opcional
- artifact: opcional (o servidor recusa artefato inexistente com 422)

service-run NÃO altera currentOwner, pendingType ou status.

### PATCH /api/content/:id

Para alterações de campo (Caroline e Orchestrator). Exige expectedRevision e agent.

Se o conteúdo tem pendência aberta (currentOwner ou pendingType) e o novo status é backlog, pronto ou publicado, o servidor devolve 422 com code PENDENCIA_ABERTA, informando currentOwner e pendingType no corpo. O cliente deve confirmar reenviando com confirmClosePending: true.

## Serviços

Audience Intelligence, Market Research e Performance Analyst usam service-run. Serviços nunca podem ser currentOwner (C7).

## Tabela de destinos por agente

| Agente | Destino padrão | pendingType | Exceção |
|---|---|---|---|
| Scientific Research | Strategist | nenhuma | - |
| Strategist | Creator (status: em-producao) | nenhuma | Caroline com decisao apenas diante de decisão estratégica genuína |
| Creator | Editor | nenhuma | - |
| Editor (aprovado) | Art Director | nenhuma | - |
| Editor (rejeitado) | Creator | nenhuma | note obrigatória com motivo |
| Art Director (manual) | Caroline | execucao | nextAction obrigatório |
| Art Director (Visual QA ok) | Caroline | aprovacao + status revisao | - |
| Art Director (devolução) | agente anterior | nenhuma | note obrigatória |
| Caroline (conclui execução) | Art Director (default) | nenhuma | nextAction: Visual QA |
| Caroline (aprova) | null | nenhuma + status pronto | - |
| Caroline (devolve de revisão) | agente específico | nenhuma | note obrigatória, status em-producao |

## Regras de coerência (C1-C8)

- C1: currentOwner null exige pendingType nenhuma
- C2: pendingType decisao ou aprovacao exige currentOwner Caroline
- C3: currentOwner Caroline exige pendingType diferente de nenhuma
- C4: execucao e bloqueio valem para qualquer dono; para agentes, trabalho em andamento é pendingType nenhuma
- C5: pendingType bloqueio exige blockerReason; fora de bloqueio, blockerReason deve ser null
- C6: pendingType execucao exige nextAction
- C7: serviços (Audience Intelligence, Market Research, Performance Analyst) nunca podem ser currentOwner
- C8: status backlog, pronto e publicado exigem currentOwner null e pendingType nenhuma

## Transições de status

### Permitidas para agentes

- Orchestrator: selecionado para em-desenvolvimento
- Strategist: em-desenvolvimento para em-producao (handoff para Creator)
- Art Director: em-producao para revisao (Visual QA concluído para Caroline)

### Restrições

- Somente Caroline pode definir pronto ou publicado
- backlog e selecionado só mudam por Caroline ou Orchestrator
- Caroline devolvendo de revisão envia status em-producao
- Retroceder uma macroetapa só é permitido a Caroline ou ao Orchestrator

## Controle de concorrência

Toda chamada exige expectedRevision. Se o valor não corresponder à revision atual, retorna 409 (conflito).

Após um 409, reler o registro via GET /api/content/:id e reavaliar se você ainda é o dono e se o handoff continua fazendo sentido antes de reenviar.

## Códigos de erro

- 400: campo obrigatório ausente ou inválido
- 403: agente não autorizado (não é currentOwner, Orchestrator ou Caroline)
- 404: conteúdo não encontrado
- 409: conflito de revision
- 422: violação de coerência (COERENCIA_C1 a C8), transição de status inválida, artifact inválido, PENDENCIA_ABERTA

## Exemplos curl

Handoff do Creator para o Editor:
```
curl -X POST http://localhost:3000/api/content/1.1/handoff \
  -H "Content-Type: application/json" \
  -d '{"agent":"Creator","expectedRevision":3,"toOwner":"Editor","note":"Copy finalizada"}'
```

Service-run do Market Research:
```
curl -X POST http://localhost:3000/api/content/1.1/service-run \
  -H "Content-Type: application/json" \
  -d '{"agent":"Market Research","expectedRevision":3,"requestedBy":"Strategist","note":"Pesquisa de tendências concluída","artifact":"<caminho/de/um/arquivo/existente>"}'
```

O servidor recusa artefato inexistente com 422 (ARTIFACT_INVALID).

## Distinção: block vs blocker vs blockerReason

- block: bloco editorial (ex: Bloco 1, Bloco 2). Campo informativo.
- blocker: campo legado que registra dependência de pacote científico. Preservado, não deve ser alterado pelo protocolo de handoff.
- blockerReason: motivo de bloqueio ativo no protocolo de handoff. Só preenchido quando pendingType = bloqueio.

## Orchestrator

### Abertura de fluxo

Se o conteúdo está em backlog, movê-lo antes para selecionado via PATCH. Em seguida, registrar o handoff para o primeiro agente da cadeia declarando status em-desenvolvimento.

Exemplo:
```
curl -X POST http://localhost:3000/api/content/1.1/handoff \
  -H "Content-Type: application/json" \
  -d '{"agent":"Orchestrator","expectedRevision":2,"toOwner":"Scientific Research","status":"em-desenvolvimento","note":"Iniciando fluxo de conteúdo"}'
```

### Gate de cinco pontos (HANDOFF REGISTRATION CHECK)

Antes de encerrar qualquer etapa de uma cadeia, verificar:
(a) a revision do conteúdo aumentou em relação ao valor antes da etapa;
(b) a última entrada do histórico com type handoff foi registrada pelo agente que trabalhou;
(c) toOwner da entrada corresponde ao handoff editorial entregue (próximo agente ou Caroline);
(d) se o destino é Caroline, pendingType e nota são coerentes, com nextAction preenchido quando pendingType for execucao;
(e) artifact está presente na entrada quando o agente produziu um artefato.

Se qualquer ponto falhar, a etapa permanece aberta. O Orchestrator corrige registrando o handoff correto antes de prosseguir.
