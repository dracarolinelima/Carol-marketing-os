# PRODUCT VISION — Central de Comando do Marketing OS

**Status:** visão aprovada em direção pela Dra. Caroline em 11/11/2026. Escolhas
técnicas abaixo são RECOMENDAÇÕES, ainda não aprovadas.

## 1. Visão

Uma plataforma visual, integrada e fluida, usada no computador e no iPhone, que
centraliza planejamento, produção, aprovação, publicação e inteligência editorial
da marca Dra. Caroline Lima, com estrutura pronta para um segundo perfil
(Independência Médica).

A experiência de referência é a plataforma apresentada no vídeo da Talita: menu
lateral, dashboard com indicadores, calendário visual, cards de conteúdos e
tarefas, prévia de carrosséis e do feed, navegação rápida. **Não copiar a
interface literalmente.**

**Atualizado em 11/11/2026:** o material de referência real (vídeo original,
prints da plataforma e transcrição via CapCut) está disponível em
`../Inspiração dasboard Talita/` (fora do repositório Git, na pasta pai do
projeto). Conferido por amostragem: a plataforma é "Central de Conteúdo FG" do
escritório "furtado guerini advogados", com menu Visão geral, Tarefas e
anotações, Checklist, Cronograma, Banco de pautas, Produção, Estúdio de arte,
Captação, E-mails da equipe, Aniversariantes, Aprovação, Programar posts,
Prévia do feed, Análise (Instagram). Confirma a estrutura de 11 módulos já
descrita na seção 3. **Captação** e **Aniversariantes** foram descartadas do
escopo por decisão da Dra. Caroline em 11/11/2026 (ver REQUIREMENTS.md R12).

## 2. Princípios do produto

1. **A inteligência existente é o motor.** Agentes, Marketing Core, pacotes
   científicos, protocolo de handoff e aprendizados continuam governando o
   conteúdo. A interface não cria um fluxo paralelo.
2. **Uma fonte de verdade por informação.** Calendário, status e datas vêm do
   pipeline, nunca de cópias.
3. **Aprovação humana preservada.** Publicação, envio externo e mudanças
   estratégicas continuam exigindo a Dra. Caroline (CLAUDE.md, seção 15).
4. **Nada de complexidade descartada por ser complexa**, mas cada módulo entra na
   ordem em que gera valor.
5. **Mobile de verdade.** Layout pensado para iPhone, não só "encolhido".
6. **Dados de pacientes ficam fora.** CRM, financeiro, prontuário e gestão de
   pacientes estão fora do escopo (especificação, seção 12).

## 3. Módulos e alternativa técnica

Legenda: **Reaproveitar** · **Adaptar** · **Desenvolver** · **Integração externa**.

| # | Módulo | Reaproveitar | Adaptar | Desenvolver | Integração externa | Melhor alternativa técnica (RECOMENDAÇÃO) |
|---|---|---|---|---|---|---|
| 1 | Dashboard inicial | Dados do pipeline, `strategy.json`, pendências | Cálculo de hoje/7 dias, atrasos | Nova tela com widgets, indicadores, minicalendário | Indicadores dependem do módulo 10 | Nova interface consumindo a API atual |
| 2 | Tarefas e anotações | Pendências do handoff (dono, tipo, próxima ação), histórico | Prazo e prioridade nos conteúdos | Entidade "tarefa" leve com comentários, vinculável a conteúdo/campanha/perfil | — | Tarefas no mesmo armazenamento JSON, via API nova; sem ferramenta externa |
| 3 | Calendário interativo | Visões mês/semana do v2, arrastar e soltar | Persistir via API (hoje é simulação local); horário | Visão diária, filtros por perfil/campanha/formato/etapa, datas relevantes | — | Componente de calendário na nova interface, gravando `publishDate`/hora no pipeline |
| 4 | Banco de pautas | Backlog (14 itens) e transição ideia → conteúdo no mesmo registro | Campos novos: subtema, público, gancho, referências, prioridade | Captura rápida | — | Mesma entidade de conteúdo com status backlog |
| 5 | Produção com IA | 10 agentes, skills, copy-store (versões, diff, comentários) | Modelo de copy para Reels (cortes) e Stories (telas) | Tela de produção com brief, roteiro, legenda, CTA, materiais | — | Claude Code continua gerando; a interface exibe, compara e encaminha pedidos via handoff. Chamada direta à API do Claude pela interface: avaliar depois (custo e governança) |
| 6 | Estúdio de carrosséis | Renderizador SVG→PNG, Design System do Art Director, fontes | Modelos de layout 1080×1440 (3:4) | Editor visual: texto → slides, edição por slide, tipografia, cores, imagens, prévia, exportação | Canva (conector disponível, não verificado) como alternativa | Editor próprio baseado em modelos HTML/SVG da marca, exportando PNG pelo renderizador. Avaliar Canva antes de construir (ver ROADMAP, fase 6) |
| 7 | Aprovação com prévia | Fluxo de status, revisão, comentários, versões, handoff de aprovação | Rótulos alinhados (Programado e Analisado derivados) | Prévia visual dos slides e do Reel na tela de aprovação | — | Tela de aprovação usando copy-store + imagens do estúdio |
| 8 | Programação de publicações | Registro de publicação e link (`/publish`) | Data + hora + arquivos finais | Fila "programados" | Metricool (agendamento disponível nas ferramentas; não testado) | Agendar via Metricool no modo "para revisão", sempre com aprovação |
| 9 | Prévia do feed | — | — | Grade 3:4 com publicados + programados | Capas publicadas podem vir do Metricool/Instagram | Grade gerada das imagens do estúdio e das publicações |
| 10 | Instagram Analytics | Campos de métricas e evidências na API | Novos campos (cliques no link, tempo assistido, seguidores) | Telas com filtros, comparação de períodos, por conteúdo/tema/formato/dia | Metricool e Windsor conectados à conta @dracarolinelima (extração não testada) | Importação periódica para JSON local; análises por tema/dia apenas com volume suficiente |
| 11 | Múltiplos perfis | Servidor já aceita `PIPELINE_PATH` e `COPY_DIR` por variável de ambiente | Campo de perfil e seletor na interface | Separação de identidade visual e estratégia por perfil | Contas do segundo perfil ainda não conectadas | Dados separados por perfil (diretório próprio), mesma interface com seletor |

## 4. Base técnica recomendada para a nova interface (RECOMENDAÇÃO, PENDENTE)

- **Manter** o servidor Node e os dados JSON como camada de API e regras, porque
  carregam o protocolo de handoff, C1 a C8, revision e copy versionada.
- **Construir uma nova interface separada** (por exemplo, rota `/app`), mantendo
  o v2 funcionando em paralelo até a paridade.
- **Framework de componentes** (ex.: React + Vite + TypeScript) para calendário
  com arrastar e soltar, editor de slides, gráficos e layout responsivo. Isso
  exige instalar dependências: decisão pendente.
- **PWA** (adicionar à tela inicial do iPhone) para experiência de aplicativo.
- **Acesso remoto seguro** (rede privada tipo Tailscale ou hospedagem com
  autenticação) antes de usar fora da rede local.

Alternativa sem dependências: continuar em JS puro, modularizando o `app.js`.
Custo menor no início, mas desenvolvimento mais lento para o estúdio e o calendário.
