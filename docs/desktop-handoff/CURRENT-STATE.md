# CURRENT STATE — O que existe, lacunas e problemas conhecidos

**Base:** auditoria somente leitura de 11/11/2026. Versão completa e comentável da
matriz: documento "Auditoria — Central de Comando do Marketing OS" em
https://claude.ai/artifact/Q2gpEokwNyo5j6e8mChZNr (fora do repositório).

Legenda: ✅ existente · 🟡 parcial · ❌ ausente · 🔌 depende de integração externa.

**Ressalva:** "cerca de 60% existe total ou parcialmente" mede funcionalidade, não
experiência. A Dra. Caroline registrou em 11/11/2026 que a experiência atual não
atende às necessidades dela.

## 1. Funcionalidades existentes (VERIFICADO)

### Servidor `dashboard/server.js` (porta 3000)

| Endpoint | Função |
|---|---|
| `GET /api/pipeline` | Pipeline completo |
| `GET/PATCH /api/content/:id`, `POST /api/content` | Ler, editar, criar conteúdo |
| `POST /api/content/:id/handoff` | Transferência entre agentes com C1 a C8 e revision |
| `POST /api/content/:id/service-run` | Registro de serviços (sem mudar dono) |
| `POST /api/content/:id/publish` | Registro de publicação (data, link) |
| `GET/POST /api/content/:id/metrics` | Snapshots de métricas (reach, views, likes, comments, shares, saves, profileVisits, follows) + evidências |
| `POST /api/content/:id/evidence-upload` | Upload de arquivo de evidência |
| `/api/content/:id/copy/*` (via `copy-store.js`) | Copy versionada: rascunho, versões, diff, comentários, revisão, envio, solicitações |
| `GET /api/strategy`, `/api/artifact`, `/api/snapshot` | Estratégia, leitura de arquivos do projeto, snapshot |
| `/v2` e `/` | Interfaces v2 e v1 |

### Interface v2 (`dashboard/v2/`)

- 6 telas: Visão geral, Calendário (mês/semana), Jornada, Produção, Backlog, Análise
  (`app.js:594-599`).
- Painel de detalhe, filtros de território e pacote científico, editor de copy.
- Atualização automática a cada 30 s (memória `project_dashboard_v2_migration.md`).
- Testes jsdom: 44/44 aprovados em 10/10/2026, segundo a mesma memória (não
  reexecutados nesta etapa).

### Dados (`dashboard/data/pipeline.json`, 26/10/2026)

- 19 conteúdos: 3 publicados (1.1, 1.3, OR-2026), 1 em revisão
  (N-261008-161731), 1 arquivado (N-261008-154937), 14 no backlog.
- Formatos: 10 carrosséis de 6 cards, 8 Reels, 1 sem formato.
- Métricas: vazias em todos. Campo `leads`: vazio em todos.

## 2. Lacunas por módulo

| Módulo | Status | Principal lacuna |
|---|---|---|
| Dashboard | 🟡 | Hoje/7 dias, atrasos, indicadores |
| Tarefas | 🟡 | Tarefa avulsa, prazo, prioridade, comentário geral |
| Calendário | 🟡 | **Arrastar é simulação local, não salva** (`app.js:269`, `:1191`); sem horário; sem visão diária; filtros limitados |
| Banco de pautas | 🟡 | Subtema, público, gancho, referências, prioridade |
| Produção com IA | 🟡 | Modelo de copy só entende cards/legenda/CTA; Reels e Stories ficam de fora |
| Estúdio | 🟡/❌ | Só renderizador com 1 modelo; sem editor visual |
| Aprovação | 🟡 | Sem prévia visual; "Programado" e "Analisado" inexistentes |
| Publicação/feed | 🟡/❌ | Sem horário, sem arquivos finais, sem prévia do feed, sem agendamento |
| Analytics | ❌🔌 | Nenhum dado; sem importação; sem comparações |
| Múltiplos perfis | ❌ | Sem campo de perfil; agentes e Core específicos da Dra. Caroline |
| Experiência visual | 🟡 | Sem regras para celular; sem acesso seguro pelo iPhone |

## 3. Problemas conhecidos (VERIFICADO)

1. **1.040 linhas de trabalho não commitadas** em 6 arquivos (agentes Copywriter,
   Editor, Strategist; `server.js`; `v2/app.js`; `v2/index.html`) e **13 itens não
   rastreados**, incluindo `copy-store.js`, `v2/copy-editor.js`, 3 testes, as
   fontes do renderizador e os aprendizados editoriais. Ver `git status`.
2. **`dashboard/data/` está no `.gitignore`.** Histórico de aprovações e
   publicações protegido apenas por arquivos `.bak` manuais (último em 26/10/2026).
3. **Servidor sem autenticação e sem restrição de host** (`server.js:1098`). A rota
   genérica (`server.js:1094`) serve qualquer arquivo de `dashboard/`, inclusive
   `data/pipeline.json`, para qualquer aparelho na mesma rede.
4. **O remote `origin` aponta para o template público**
   `https://github.com/ericosiu/marketing-os-starter.git`. Um `git push` tentaria
   enviar conteúdo da marca para o repositório de outra pessoa.
5. **Inconsistências de dados:** 1.3 aparece como publicado sem `publishDate`;
   `strategy.json` (12/10) desatualizado em relação ao pipeline.
6. **Três calendários:** `tests/marketing-os/editorial-calendar-v1.md` (4
   posts/semana), seção de calendário em `strategy.json` e tela v2. A cadência
   vigente é 3 posts/semana (`editorial-architecture-v2.md`, seção 5; memória de
   16/09/2026).
7. **`v2/app.js` monolítico** (155 KB, 2.150 linhas).
8. **Agentes não são subagentes registrados:** os arquivos `mos-*.md` não têm
   frontmatter; funcionam como instruções lidas pelo Claude, não como agentes
   selecionáveis do Claude Code.
9. **Memória automática:** `MEMORY.md` não indexa `project_dashboard_v2_migration.md`.
10. **Campanhas fora do pipeline:** `tests/marketing-os/campaigns/` não aparece na interface.

## 4. Pendências editoriais abertas

- N-261008-161731 "Perimenopausa: o que muda antes da menopausa": em revisão,
  aguardando aprovação.
- Campanha `agenda-novembro-2026.md`: proposta, aguardando aprovação; pendências
  listadas no próprio arquivo (horários, pagamento antecipado, resultado de
  setembro, frase sobre 600 histeroscopias).
- Pacote científico P2: rascunho aguardando congelamento (`strategy.json`).
