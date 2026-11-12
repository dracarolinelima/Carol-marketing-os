# DECISIONS — Decisões tomadas e pendentes

Cada decisão indica data e fonte. Decisões da Dra. Caroline prevalecem sobre
recomendações dos agentes.

## 1. Decisões tomadas

| Data | Decisão | Fonte |
|---|---|---|
| 2026-09-16 | Cadência inicial de 3 posts de feed por semana; hipótese operacional, não regra permanente | Memória `project_publication_cadence.md`; [editorial-architecture-v2.md](../../memory/carol-marketing-os/editorial-architecture-v2.md), seção 5 |
| 2026-09-16 | Calendário editorial ciclo 1 congelado (4 posts/semana). Superado pela cadência de 3/semana | [editorial-calendar-v1.md](../../tests/marketing-os/legacy/editorial-calendar-v1.md) |
| 2026-11-12 | Fase 0 concluída: commit do trabalho pendente, remote privado configurado e `carol-v1` enviado ao GitHub (autenticação via token pessoal da Dra. Caroline), snapshot de `dashboard/data/`, servidor restrito a localhost, `strategy.json` regenerado, 1.3/OR-2026 reconciliados via Metricool, `editorial-calendar-v1.md` movido para `legacy/`, pacote científico P3 produzido (rascunho), novo brief de AUTORIDADE para histeroscopia always-on (ângulo "ver e resolver", N-261112-120122) roteado para aprovação da Dra. Caroline | Sessão Claude Code Desktop |
| 2026-11-12 | Skill `design-dra-caroline` (criada por ela no app do celular) é a fonte de verdade para o design das artes: paleta exata (#301826 etc.), Playfair Display + Montserrat + Cormorant Garamond, hierarquia abertura+destaque, rodapé de assinatura | `.claude/skills/design-dra-caroline/SKILL.md` |
| 2026-11-12 | Formato de post/carrossel continua **1080×1440 (3:4)** — "o formato novo do Instagram". A skill de design registra 1080×1350 (4:5) como padrão, mas essa é a única divergência: ela confirmou 3:4 nesta sessão | Mensagem da Dra. Caroline; já era o padrão em `proactive-routing.md` |
| 2026-11-12 | Fotos das artes são geradas por ela no ChatGPT (fora do Marketing OS) e trazidas para o Estúdio — não são geradas pelo sistema | Mensagem da Dra. Caroline |
| 2026-09-30 | Arquitetura editorial v2 aprovada (blocos temáticos, histeroscopia always-on) | editorial-architecture-v2.md |
| 2026-09 | "Agenda Especial de Polipectomia" em vez de "Pólipo Day"; "recuperação rápida" autorizada como experiência clínica, não claim científico | [agenda-especial-polipectomia.md](../../tests/marketing-os/campaigns/agenda-especial-polipectomia.md) |
| 2026-10-07 | Agentes em autonomia nível B (executar e reportar); gates humanos permanentes mantidos | [CLAUDE.md](../../CLAUDE.md), seção 15; [autonomy.yaml](../../.claude/agents/marketing-os/autonomy.yaml) |
| 2026-10-10 | Dashboard v2 migrado do Artifact para `/v2` | Memória `project_dashboard_v2_migration.md`; commit `55cfbba` |
| 2026-10-13 | Sexta-feira preferencial para histeroscopia, sem obrigação | Memória `project_editorial_friday_histeroscopia.md` |
| 2026-10-13 | Pauta rejeitada vai para `arquivado`, fora das filas ativas | Memória `feedback_rejection_not_production.md` |
| 2026-10-13/14 | N-261008-154937 rejeitado: não apresentar acompanhamento de pólipos como alternativa genérica; conduta individualizada | Memória `project_clinical_learning_polyp_rejection.md` |
| 2026-10-13 | Aprendizados editoriais: 6 cards, abertura de reconhecimento, 2-3 frases/card, voz de consultório, primeira pessoa | [entrega-aprendizado-editorial-2026-10-13.md](../../tests/marketing-os/entrega-aprendizado-editorial-2026-10-13.md); memórias de voz |
| vigente | Formato 1080×1440 (3:4) para novos posts de feed; 4:5 é legado | [proactive-routing.md](../../.claude/rules/proactive-routing.md) |
| vigente | Email marketing fora do fluxo; skill `email-sequence` inativa | proactive-routing.md |
| vigente | Sem mudança autônoma de orçamento ou campanha de anúncios | proactive-routing.md; CLAUDE.md |
| 2026-11-11 | **Construir uma Central de Comando visual**, inspirada na plataforma da Talita, aproveitando agentes, dados e funcionalidades existentes; não apenas corrigir o dashboard | Mensagem da Dra. Caroline, 11/11/2026 |
| 2026-11-11 | Transferir o desenvolvimento do VS Code para o Claude Code Desktop | Mesma mensagem |
| 2026-11-11 | Não descartar funcionalidades por complexidade; o estúdio e os múltiplos perfis estão no escopo | Mesma mensagem |
| 2026-11-11 | Material de referência real da plataforma da Talita disponibilizado: vídeo original, prints da plataforma e transcrição (CapCut), na pasta `../Inspiração dasboard Talita/` (fora do repositório Git, na pasta pai do projeto) | Pasta criada pela Dra. Caroline |
| 2026-11-11 | Excluir do escopo as áreas de **Captação** (módulo de leads) e **Aniversariantes** (aniversários/tempo de casa da equipe), presentes na plataforma de referência mas não aplicáveis ao consultório da Dra. Caroline | Mensagem da Dra. Caroline; ver REQUIREMENTS.md R12 |

**Mudança em relação à auditoria anterior:** a auditoria de 11/11 recomendava não
desenvolver um estúdio próprio e tratava a evolução do v2 como caminho principal. A
decisão da Dra. Caroline no mesmo dia muda isso: nova interface e estúdio entram no
roadmap, com avaliação Canva × editor próprio na fase 6.

## 2. Decisões pendentes

| # | Decisão | Por que importa | Status |
|---|---|---|---|
| D1 | ~~Commitar o trabalho pendente em `carol-v1`~~ | 1.040 linhas + 13 itens só existiam no disco | ✅ Resolvido 12/11/2026 |
| D2 | ~~Remote do Git~~ | `origin` apontava para o template público de terceiros | ✅ Resolvido 12/11/2026 — repo privado, push ok |
| D3 | ~~Proteção de `dashboard/data/`~~ | Estava fora do Git; só backups manuais | ✅ Resolvido 12/11/2026 — versionado no Git |
| D4 | ~~Base técnica da nova interface~~ | Define custo e velocidade | ✅ Resolvido — React + Vite + TypeScript |
| D5 | ~~Instalar dependências~~ | Exigido por D4 | ✅ Resolvido junto com D4 |
| D6 | Acesso pelo iPhone | Segurança | 🟡 Parcial 12/11/2026 — autenticação (usuário/senha) + acesso **na mesma rede Wi-Fi**. Acesso de fora de casa (sem estar na mesma rede) ainda depende de rede privada tipo Tailscale — não feito |
| D7 | Aposentar o dashboard v1 | Duplicação | Pendente — ainda não há paridade completa |
| D8 | Plano Metricool/Windsor | Agendamento, analytics automático, segundo perfil | Pendente — conectores só funcionam em sessão do Claude, não no servidor |
| D9 | Perfil Independência Médica | Precisa de estratégia própria | Pendente |
| D10 | ~~Canva × editor próprio~~ | Custo do estúdio | ✅ Resolvido 12/11/2026 — editor próprio, já construído |
| D11 | Arquivar legado do template | Organização | Pendente (parcial: `editorial-calendar-v1.md` já movido para `legacy/`) |
| D12 | Aplicar a proposta de CLAUDE.md | Novas sessões encontrarem o handoff | Pendente |
| D13 | Campanha de novembro | Aguardando aprovação | Pendente — ver [agenda-novembro-2026.md](../../tests/marketing-os/campaigns/agenda-novembro-2026.md), seção 4 |
