# Handoff do Marketing OS para o Claude Code Desktop

**Criado em:** 11/11/2026
**Pasta do projeto:** `/Users/carollima/Documents/Carol-Marketing-OS/carol-marketing-os`
**Branch de trabalho:** `carol-v1`
**Responsável final:** Dra. Caroline Lima

Esta pasta transfere o contexto do Marketing OS para novas sessões do Claude Code,
em especial no Claude Code Desktop. Ela **não substitui** nenhum documento
estratégico: aponta para os originais, que continuam sendo a fonte de verdade.

---

## Decisão que orienta esta etapa

Em 11/11/2026, a Dra. Caroline decidiu construir uma **Central de Comando visual**,
com experiência inspirada na plataforma apresentada no vídeo da Talita. O objetivo
é uma interface significativamente melhor, aproveitando agentes, dados e
funcionalidades existentes. Não é apenas corrigir o dashboard atual.

---

## Ordem de leitura para uma nova sessão

| # | Documento | Para quê |
|---|---|---|
| 1 | [NEXT-STEPS.md](NEXT-STEPS.md) | O que fazer na próxima sessão e o que não fazer |
| 2 | [PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md) | Arquitetura, estrutura e classificação de cada componente |
| 3 | [DECISIONS.md](DECISIONS.md) | Decisões tomadas e pendentes, com data e fonte |
| 4 | [PRODUCT-VISION.md](PRODUCT-VISION.md) | Visão da nova Central de Comando e alternativa técnica por módulo |
| 5 | [REQUIREMENTS.md](REQUIREMENTS.md) | Requisitos funcionais numerados |
| 6 | [CURRENT-STATE.md](CURRENT-STATE.md) | O que já existe, lacunas e problemas conhecidos |
| 7 | [INTEGRATIONS.md](INTEGRATIONS.md) | Conectores verificados, não verificados e permissões |
| 8 | [ROADMAP.md](ROADMAP.md) | Fases de implementação com critérios de aceite |
| 9 | [CLAUDE-MD-PROPOSAL.md](CLAUDE-MD-PROPOSAL.md) | Proposta de acréscimo ao CLAUDE.md (não aplicada) |

---

## Fontes de verdade (documentos originais, não resumidos aqui)

| Assunto | Arquivo original |
|---|---|
| Estratégia, posicionamento, ICP, voz, evidência | [memory/carol-marketing-os/marketing-core.md](../../memory/carol-marketing-os/marketing-core.md) |
| Manual operacional do sistema | [CLAUDE.md](../../CLAUDE.md) |
| Arquitetura editorial (blocos, cadência, always-on) | [memory/carol-marketing-os/editorial-architecture-v2.md](../../memory/carol-marketing-os/editorial-architecture-v2.md) |
| Arquitetura dos agentes | [.claude/agents/marketing-os/definition.md](../../.claude/agents/marketing-os/definition.md) |
| Autonomia por tipo de decisão | [.claude/agents/marketing-os/autonomy.yaml](../../.claude/agents/marketing-os/autonomy.yaml) |
| Roteamento | [.claude/rules/proactive-routing.md](../../.claude/rules/proactive-routing.md) |
| Protocolo de handoff (API do Dashboard) | [.claude/rules/handoff-protocol.md](../../.claude/rules/handoff-protocol.md) |
| Identidade da marca | [brands/your-agency/BRAND.md](../../brands/your-agency/BRAND.md) |
| Voz | [brands/your-agency/voice.md](../../brands/your-agency/voice.md), [memory/marketing-os/brand-voice.md](../../memory/marketing-os/brand-voice.md), [memory/marketing-os/voice-corpus.md](../../memory/marketing-os/voice-corpus.md) |
| Design System (diretrizes visuais) | [.claude/agents/marketing-os/team/mos-art-director.md](../../.claude/agents/marketing-os/team/mos-art-director.md) |
| Estado editorial vivo | `dashboard/data/pipeline.json` (fora do Git, ver riscos) |

---

## Convenções destes documentos

- **VERIFICADO:** fato observado no repositório ou em consulta real, com data.
- **RECOMENDAÇÃO:** proposta do Claude, ainda não aprovada.
- **PENDENTE:** depende de decisão da Dra. Caroline ou de verificação.
- Caminhos são relativos à raiz do projeto, salvo quando absolutos.
