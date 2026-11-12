# INTEGRATIONS — Conectores, permissões e limitações

**Regra:** nenhuma integração é dada como funcional sem evidência. Cada linha
indica o que foi verificado, quando e como.

## 1. Integrações no código do repositório

**VERIFICADO (11/11/2026):** nenhuma. O servidor não chama APIs externas. Dados
de Instagram, Meta, CRM e planilhas só entram manualmente, via API local ou edição
pelo Claude.

## 2. Conectores da conta Claude verificados por consulta de leitura

| Conector | Consulta feita | Resultado (11/11/2026) | Não testado |
|---|---|---|---|
| Metricool | `getBrandSettings` | 1 marca: "Dra Caroline Pacheco Lima" (id 8009548), fuso America/Sao_Paulo, primeira conexão 10/11/2026. Redes: Instagram `dracarolinelima`, página do Facebook, conta de anúncios Meta | Extração de métricas, histórico disponível, agendamento, limites do plano, número de marcas permitido |
| Windsor.ai | `get_connectors` | Conectores com conta: `facebook` (Meta Ads, conta "Dra Caroline Lima"), `instagram` (dracarolinelima), `instagram_public` (dracarolinelima) | Extração de dados, ações de escrita, plano |

Esses conectores funcionam **dentro das sessões do Claude**, não no servidor do
dashboard. Nenhum dos dois tem conta do perfil Independência Médica.

## 3. Conectores listados na sessão, sem verificação

Aparecem como disponíveis nas sessões do Claude em 11/11/2026, sem nenhuma chamada
feita: Canva, Google Drive, Docs, Sheets, Slides, Calendar, Gmail, Notion, PubMed,
Runway, ICD-10, nano-banana (geração de imagens), Claude in Chrome. A
disponibilidade no Claude Code Desktop deve ser reconfirmada na primeira sessão.

## 4. Ferramentas citadas na documentação, sem conexão

Citadas em [definition.md](../../.claude/agents/marketing-os/definition.md) e no
[proactive-routing.md](../../.claude/rules/proactive-routing.md):

| Ferramenta | Situação |
|---|---|
| Cliente IO (CRM/WhatsApp) | Sem conector. Regra: nunca usar a classificação de IA do Cliente IO como verdade |
| Planilha de atendimentos | Sem conector identificado; fonte primária de comparecimento |
| Meta Ads Manager | Acesso por Claude in Chrome (definition.md) ou Windsor (conectado, não testado) |
| ManyChat | Citado nas campanhas (palavra-chave PÓLIPO); sem conector; estado atual não verificado |

## 5. Capacidades do Instagram (conhecimento geral, NÃO verificado nesta conta)

| Item | Expectativa | Como confirmar |
|---|---|---|
| Métricas por post (alcance, visualizações, curtidas, comentários, compartilhamentos, salvamentos) | Provavelmente disponíveis via Metricool/Windsor | Consulta de teste por publicação conhecida (1.1) |
| Tempo médio assistido de Reels | Provável | Consulta de teste |
| Curva de retenção de Reels | Provavelmente indisponível via API | Consulta de teste; se ausente, coleta manual (print) |
| Cliques no link, visitas ao perfil, seguidores (série) | Métricas de conta, provavelmente disponíveis | Consulta de teste |
| Publicação/agendamento | Possível via Metricool (ferramentas de agendamento existem no conector) | Piloto com 1 post em modo revisão, com aprovação |

O Claude não publica diretamente no Instagram. Qualquer publicação passa por
ferramenta integrada e pela aprovação da Dra. Caroline.

## 6. Permissões do Claude Code no projeto (VERIFICADO)

- [.claude/settings.json](../../.claude/settings.json): permite `WebSearch`.
- `.claude/settings.local.json`: permite `WebFetch` em cerca de 45 domínios
  científicos, `Bash(git:*)`, `Bash(node:*)`, `Bash(open:*)`, alguns `curl` para
  `localhost:3000` e `python3 -c`.
- **Atenção:** `Bash(git:*)` inclui `git push`. Como o `origin` aponta para o
  template público de terceiros, não executar push sem antes decidir o remote
  (ver DECISIONS.md).
- Nenhuma credencial ou token foi encontrado no código versionado (varredura por
  padrões de chave, 11/11/2026). `.gitignore` já exclui `.env`, `*.key`,
  `credentials.json` e `token.json`.
