# PROJECT OVERVIEW — Arquitetura e estrutura atual

**Levantamento:** 11/11/2026, somente leitura, branch `carol-v1`.

## 1. O que é o Marketing OS

Sistema operacional de marketing, conteúdo, aquisição e inteligência comercial da
marca Dra. Caroline Lima (ginecologista). O objetivo central, definido no
[Marketing Core](../../memory/carol-marketing-os/marketing-core.md), é aumentar a
proporção de mulheres que chegam percebendo valor no atendimento e com disposição
compatível com o ticket. Não é maximizar seguidores, alcance ou leads brutos.

O repositório nasceu como fork do template público `ericosiu/marketing-os-starter`
(agência/SaaS) e foi adaptado para o contexto médico. Restos do template continuam
no repositório (ver classificação).

## 2. Arquitetura em camadas (VERIFICADO)

| Camada | Componentes | Tecnologia |
|---|---|---|
| Estratégia | Marketing Core, arquitetura editorial, identidade e voz | Markdown |
| Instruções | CLAUDE.md, regras, 10 agentes MOS (arquivos de instrução, sem frontmatter de subagente), 5 skills, autonomia | Markdown/YAML lidos pelo Claude Code |
| Produção editorial | Briefs, rascunhos, aprovados, publicados, pacotes científicos, briefs visuais, campanhas | Markdown em `tests/marketing-os/` |
| Dados operacionais | Pipeline (19 conteúdos), estratégia situacional, copy versionada | JSON em `dashboard/data/` |
| Servidor | API REST local | Node.js puro (`http`), sem dependências de produção, porta 3000 |
| Interface | Dashboard v1 (Kanban) em `/`, Dashboard v2 (6 telas) em `/v2` | HTML/JS sem framework |
| Renderização | SVG → PNG determinístico | `@resvg/resvg-js` |
| IA | Claude Code (sessões), sem chamada de API a partir do dashboard | — |

Node instalado: v24.14.1. Iniciar o servidor: `cd dashboard && npm start`.

## 3. Mapa de diretórios com classificação

Classes: **ESSENCIAL** (ativo e essencial) · **EVOLUIR** (ativo, precisa evoluir) ·
**HISTÓRICO** (legado, manter como referência) · **DUPLICADO** · **ARQUIVAR**
(candidato a arquivamento). Nada foi movido ou excluído.

### Estratégia e instruções

| Caminho | Classe | Observação |
|---|---|---|
| `CLAUDE.md` | ESSENCIAL | Manual operacional. Não aponta ainda para este handoff (ver proposta) |
| `CLAUDE.original.md` | HISTÓRICO | Versão do template |
| `memory/carol-marketing-os/marketing-core.md` | ESSENCIAL | Fonte estratégica de maior autoridade |
| `memory/carol-marketing-os/editorial-architecture-v2.md` | ESSENCIAL | Aprovada em 30/09/2026 |
| `.claude/rules/proactive-routing.md` | ESSENCIAL | Roteamento de agentes |
| `.claude/rules/handoff-protocol.md` | ESSENCIAL | Contrato da API de handoff, regras C1 a C8 |
| `.claude/agents/marketing-os/definition.md` | ESSENCIAL | Arquitetura dos 10 agentes |
| `.claude/agents/marketing-os/autonomy.yaml` | ESSENCIAL | Nível B desde 07/10/2026 |
| `.claude/agents/marketing-os/team/mos-*.md` (9 agentes ativos) | ESSENCIAL | Orchestrator, Audience Intelligence, Market Research, Scientific Research, Strategist, Copywriter (Creator), Editor, Art Director, Performance Analyst |
| `.claude/agents/marketing-os/team/mos-researcher.md` | HISTÓRICO | "Compatibility Router" (definition.md, seção 10) |
| `.claude/agents/marketing-os/team/*.original.md` | HISTÓRICO | Versões do template |
| `.claude/agents/shared/decision-interface.md` | EVOLUIR | Formato padrão de recomendação; verificar uso |
| `.claude/skills/{campaign-brief,copywriting,research,social-content}/SKILL.md` | ESSENCIAL | Adaptadas ao Carol Marketing OS |
| `.claude/skills/email-sequence/SKILL.md` | HISTÓRICO | Inativa por decisão (email fora do fluxo) |
| `.claude/skills/*/SKILL.original.md` | HISTÓRICO | Template |
| `.claude/docs/lessons.md`, `.claude/docs/how-to-grow.md` | HISTÓRICO | Texto do template de agência |
| `.claude/settings.json`, `.claude/settings.local.json` | ESSENCIAL | Permissões (ver INTEGRATIONS.md) |

### Marca e memória

| Caminho | Classe | Observação |
|---|---|---|
| `brands/your-agency/BRAND.md`, `voice.md` | ESSENCIAL | Apesar do nome da pasta, é a identidade da Dra. Caroline (atualizada 09/09/2026) |
| `brands/your-agency/*.original.md`, `brands/example-agency/` | ARQUIVAR | Template |
| `memory/marketing-os/brand-voice.md`, `voice-corpus.md` | ESSENCIAL | Voz real (115 trechos anonimizados + 7 Reels) |
| `memory/marketing-os/campaign-history.md` | EVOLUIR | Modelo de registro; sem resultados registrados |
| `memory/marketing-os/marketing-wisdom.md`, `working.md` | EVOLUIR | Adaptados ao Carol MOS; `working.md` com fila vazia |
| `memory/marketing-os/*.original.md` | HISTÓRICO | Template |
| `~/.claude/projects/-Users-carollima-Documents-Carol-Marketing-OS-carol-marketing-os/memory/` | ESSENCIAL | Memória automática do Claude Code (7 arquivos; fora do repositório) |

### Dashboard, dados e renderização

| Caminho | Classe | Observação |
|---|---|---|
| `dashboard/server.js` | ESSENCIAL / EVOLUIR | API completa; riscos de segurança (ver CURRENT-STATE) |
| `dashboard/copy-store.js` | ESSENCIAL | Copy versionada; **não está no Git** |
| `dashboard/v2/app.js`, `copy-editor.js`, `index.html`, `style.css` | EVOLUIR | Interface atual; `app.js` monolítico (155 KB, 2.150 linhas) |
| `dashboard/index.html`, `app.js`, `style.css` (v1 Kanban) | DUPLICADO | Substituído pelo v2, ainda servido em `/` |
| `dashboard/tests/*.js` (4 arquivos) | ESSENCIAL | 3 deles **não estão no Git**; não executados nesta etapa |
| `dashboard/update-strategy.md` | ESSENCIAL | Roteiro para regenerar `strategy.json`; não está no Git |
| `dashboard/data/pipeline.json` | ESSENCIAL | Estado editorial vivo; **fora do Git por .gitignore** |
| `dashboard/data/strategy.json` | EVOLUIR | Desatualizado desde 12/10/2026 |
| `dashboard/data/copy/` | ESSENCIAL | Copy versionada (1 conteúdo) |
| `dashboard/data/*.bak*`, `pipeline.pre-handoff.json`, `dashboard-snapshot.bak.json` | HISTÓRICO | Backups manuais |
| `renderer/render.js`, `renderer/cards/` | EVOLUIR | 2 definições de capa (pólipo) |
| `renderer/fonts/` | ESSENCIAL | Fontes da marca; não está no Git |
| `generated_imgs/` | HISTÓRICO | Saídas regeneráveis (ignoradas pelo Git) |

### Produção editorial (`tests/marketing-os/`)

| Caminho | Classe | Observação |
|---|---|---|
| `scientific-packages/` (T1, T2, P1, P2, T3, T4) | ESSENCIAL | Base de afirmações permitidas e proibidas |
| `approved/`, `published/` | ESSENCIAL | Calibração editorial; `published/` não está no Git |
| `briefs/`, `drafts/`, `baseline/`, `visual-briefs/` | HISTÓRICO / ESSENCIAL | Rastreabilidade das produções |
| `campaigns/agenda-especial-polipectomia.md` | HISTÓRICO | Campanha de setembro sem resultado registrado |
| `campaigns/agenda-novembro-2026.md` | EVOLUIR | Proposta aguardando aprovação; não está no Git |
| `editorial-calendar-v1.md` | DUPLICADO | Calendário congelado em 16/09 (4 posts/semana), conflita com a cadência vigente de 3/semana |
| `entrega-aprendizado-editorial-2026-10-13.md`, `premortem-editorial-learnings.md` | ESSENCIAL | Origem dos aprendizados editoriais; não estão no Git |
| `external-audit/` | HISTÓRICO | Contextos para auditorias externas |
| `frozen-baseline-briefs.md`, `evidence/` (vazia) | HISTÓRICO | — |

### Template e backups

| Caminho | Classe |
|---|---|
| `README.md` (template SaaS), `examples/`, `schemas/` | ARQUIVAR (schemas: verificar uso antes) |
| `backups/starter-originals/` | HISTÓRICO |
| `backup-pre-autonomia-2026-10-07/` | HISTÓRICO (ignorado pelo Git) |
| `claude-fable-audit/` | HISTÓRICO (ignorado pelo Git) |

## 4. Fluxo de conteúdo

Cadeia padrão definida no [CLAUDE.md](../../CLAUDE.md), seção 8, e no
[protocolo de handoff](../../.claude/rules/handoff-protocol.md):

Scientific Research → Strategist → Creator → Editor → Art Director → Caroline
(aprovação) → publicação → Performance Analyst.

Cada transição é registrada via `POST /api/content/:id/handoff`, com controle de
revision e regras C1 a C8. Status válidos (`dashboard/server.js`): backlog,
selecionado, em-desenvolvimento, em-producao, revisao, pronto, publicado, arquivado.
