# REQUIREMENTS — Requisitos funcionais da Central de Comando

**Fonte:** especificação "MARKETING OS — CENTRAL DE COMANDO" e missão de handoff,
ambas fornecidas pela Dra. Caroline em 11/11/2026. Os requisitos abaixo reproduzem
o conteúdo dessas mensagens, organizado e numerado. A especificação original não
está salva como arquivo no repositório.

Prioridade sugerida: **P1** (Central operacional), **P2** (aprovação e publicação),
**P3** (analytics), **P4** (estúdio), **P5** (automações).

## R1. Dashboard inicial (P1)

- R1.1 Publicações do dia e dos próximos sete dias.
- R1.2 Conteúdos em produção, aguardando aprovação e programados.
- R1.3 Tarefas prioritárias, pendentes e atrasadas.
- R1.4 Calendário resumido.
- R1.5 Indicadores de desempenho recentes.
- R1.6 Alertas e pendências operacionais.
- R1.7 Navegação direta para a tarefa, publicação ou análise correspondente.

## R2. Tarefas e anotações (P1)

- R2.1 Criação rápida de tarefas.
- R2.2 Responsável, prioridade, prazo e status.
- R2.3 Comentários e histórico.
- R2.4 Associação a campanhas, conteúdos e projetos.
- R2.5 Pendências por responsável e período.
- R2.6 Não criar gerenciador independente se o sistema já tiver solução adequada.

## R3. Calendário editorial (P1)

- R3.1 Visualizações mensal, semanal e diária.
- R3.2 Conteúdos identificados por perfil, formato, tema e status.
- R3.3 Data e horário planejados.
- R3.4 Acesso ao roteiro, legenda, arquivos e responsável.
- R3.5 Filtros por perfil, campanha, formato e etapa.
- R3.6 Reorganização de publicações.
- R3.7 Datas relevantes como sugestões de pauta.
- R3.8 Representar o planejamento real, sem manutenção duplicada.

## R4. Banco de pautas (P1)

- R4.1 Campos: título, tema, subtema, público-alvo, objetivo estratégico, formato
  sugerido, gancho, referências, prioridade, status.
- R4.2 Transformar uma ideia em conteúdo planejado preservando as informações.

## R5. Produção de conteúdo com IA (P1/P2)

- R5.1 Centralizar briefing, roteiro de Reels, estrutura de carrosséis, sequências
  de Stories, legendas e CTAs, referências e materiais, versões e revisões.
- R5.2 A IA usa posicionamento, diretrizes editoriais e aprendizados do Marketing OS.
- R5.3 Evitar geração genérica e duplicação dos fluxos atuais.

## R6. Estúdio de arte (P4)

- R6.1 Geração de carrosséis a partir de texto.
- R6.2 Aplicação de identidade visual e modelos de layout.
- R6.3 Edição individual de slides: tipografia, cores, imagens, elementos.
- R6.4 Pré-visualização e exportação.
- R6.5 Avaliar integração com ferramentas existentes versus interface própria;
  justificar custo e complexidade.

## R7. Aprovação editorial (P2)

- R7.1 Fluxo: Ideia → Planejado → Em produção → Revisão → Aprovado → Programado →
  Publicado → Analisado.
- R7.2 Prévia do material, roteiro e legenda, comentários, solicitação de ajustes,
  histórico de versões, aprovação final.
- R7.3 Sem etapas burocráticas desnecessárias.

## R8. Publicação e prévia do feed (P2)

- R8.1 Identificação dos aprovados; data e horário de publicação.
- R8.2 Prévia visual do feed.
- R8.3 Arquivos finais e legenda disponíveis.
- R8.4 Registro do link publicado e do status real.
- R8.5 Avaliar agendamento/publicação automáticos por integrações oficiais. Não
  presumir que o Claude publica no Instagram sem infraestrutura e autorização.

## R9. Instagram Analytics (P3)

- R9.1 Métricas, conforme disponibilidade real: visualizações, alcance, interações,
  curtidas, comentários, compartilhamentos, salvamentos, crescimento de
  seguidores, visitas ao perfil, cliques no link, métricas de Reels (retenção
  quando disponível).
- R9.2 Análises: comparação entre períodos; por conteúdo, tema, formato, dia e
  horário; padrões; recomendações fundamentadas; filtros.
- R9.3 Separar observação comprovada, hipótese e recomendação.
- R9.4 Mapear o que vem por API, o que exige coleta manual e o que não existe.

## R10. Múltiplos perfis (P1 estrutura / P4 operação)

- R10.1 Perfis: Dra. Caroline Lima e Independência Médica (IA aplicada à medicina,
  organização, produtividade, gestão e soluções para médicos).
- R10.2 Cada perfil com estratégia editorial, identidade visual, banco de pautas,
  calendário, conteúdos e indicadores próprios.
- R10.3 Compartilhar infraestrutura sem misturar dados ou posicionamento.

## R11. Experiência visual (transversal)

- R11.1 Menu lateral, dashboard com indicadores, calendário visual, cards de
  conteúdos e tarefas, prévia de carrosséis e do feed, navegação rápida.
- R11.2 Interface profissional e responsiva, adequada ao computador e ao iPhone.
- R11.3 Inspirada na plataforma da Talita, sem cópia literal.

## R12. Fora do escopo

CRM comercial paralelo, gestão financeira, prontuários, gestão de pacientes,
captação de leads como módulo independente, gestão operacional de Meta Ads,
funcionalidades de equipe sem necessidade comprovada.

Confirmado por decisão explícita em 11/11/2026: a área de **Captação** (módulo
de leads existente na plataforma de referência da Talita) e a área de
**Aniversariantes** (aniversários e tempo de casa da equipe) não entram na
Central de Comando. Ambas existem na plataforma de referência, mas não se
aplicam ao contexto de consultório médico individual da Dra. Caroline.

## R13. Requisitos não funcionais (RECOMENDAÇÃO derivada da auditoria)

- RNF1 Dados operacionais versionados ou com backup recuperável.
- RNF2 Acesso protegido por autenticação antes de qualquer exposição fora do computador.
- RNF3 Preservar regras C1 a C8, revision e gates humanos.
- RNF4 Nenhum dado identificável de paciente na Central.
