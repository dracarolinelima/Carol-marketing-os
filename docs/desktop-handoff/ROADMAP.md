# ROADMAP — Implementação recomendada da Central de Comando

**Status:** RECOMENDAÇÃO. Nenhuma fase foi aprovada ou iniciada.
Estimativas em sessões de trabalho são ordem de grandeza, baseadas no tamanho do
código atual, não compromisso.

**Princípio de sequência:** primeiro proteger o que existe, depois construir a nova
base visual, depois os módulos na ordem de valor. O Dashboard v2 continua
funcionando até a nova interface atingir paridade.

---

## Fase 0: Proteção e fundação (1 a 2 sessões)

**Escopo**
1. Revisar e commitar o trabalho pendente em `carol-v1` (1.040 linhas + 13 itens
   não rastreados), com aprovação.
2. Decidir o remote do Git: criar repositório privado próprio e não usar o `origin`
   do template.
3. Proteger `dashboard/data/`: versionamento privado ou snapshot diário automático.
4. Restringir o servidor ao próprio computador e fechar a rota genérica de arquivos.
5. Conciliar dados: data de publicação do 1.3, regenerar `strategy.json`, cadência
   única (arquivar `editorial-calendar-v1.md` como histórico).
6. Rodar os 4 testes existentes e registrar o resultado.

**Aceite:** Git limpo e com remote próprio; histórico de dados recuperável; outro
aparelho não acessa o pipeline; zero inconsistências; testes passando.
**Riscos:** baixo. Nenhuma dependência nova.

## Fase 1: Nova base visual (3 a 5 sessões)

**Escopo**
- Escolher a base técnica (ver PRODUCT-VISION.md, seção 4).
- Design system da interface: tokens de cor e tipografia da marca (paleta e fontes
  do [Art Director](../../.claude/agents/marketing-os/team/mos-art-director.md)).
- Estrutura: menu lateral, navegação, layout responsivo, PWA, seletor de perfil
  (mesmo com um perfil só).
- Telas iniciais lendo a API atual: Dashboard e Calendário (somente leitura).
- Rota nova (ex.: `/app`), sem remover `/v2`.

**Aceite:** a nova interface abre no computador e no iPhone (rede local), mostra os
19 conteúdos com os mesmos dados do v2 e passa em testes de renderização.
**Dependências:** Fase 0; aprovação para instalar dependências, se houver framework.
**Riscos:** escopo visual crescer sem fim. Mitigação: protótipo aprovado antes de
codificar cada tela.

## Fase 2: Central operacional (4 a 6 sessões)

**Escopo:** R1 (dashboard completo), R2 (tarefas leves), R3 (calendário com
persistência, horário, visão diária, filtros, datas relevantes), R4 (banco de
pautas com campos novos e captura rápida), campo de campanha.
API: endpoints de escrita para datas, tarefas e campos de pauta, com revision e C1
a C8.

**Aceite:** data movida no calendário continua após recarregar e aparece igual em
todas as telas; ideia vira conteúdo sem perder campos; tarefa vencida aparece como
atrasada; nenhuma regra C1 a C8 quebrada.

## Fase 3: Produção e aprovação (3 a 5 sessões)

**Escopo:** R5 e R7. Modelo de copy para Reels (cortes) e Stories (telas); tela de
produção com brief, roteiro, legenda, CTA e materiais; tela de aprovação com
comentários, versões e solicitação de ajustes; rótulos Programado e Analisado
derivados.

**Aceite:** um Reel e um carrossel percorrem do brief à aprovação dentro da nova
interface, com versões e comentários preservados.

## Fase 4: Publicação, programação e feed (3 a 4 sessões)

**Escopo:** R8 e R9-feed. Arquivos finais, data e hora, fila de programados,
prévia do feed em grade 3:4, registro do link. Piloto de agendamento via
Metricool em modo revisão, com aprovação.

**Aceite:** a prévia mostra os próximos 9 posts; 1 post piloto agendado com
evidência e aprovação registrada.
**Dependências:** verificação do plano Metricool.

## Fase 5: Instagram Analytics (3 a 5 sessões + custo de uso)

**Escopo:** R9. Teste de leitura do que Metricool/Windsor realmente fornecem;
importação para os snapshots com fonte e data; telas com filtros, comparação de
períodos e por conteúdo; análises por tema, formato e horário marcadas como de
baixa confiabilidade enquanto o volume for pequeno.

**Aceite:** cada publicação tem métricas com fonte e data; métrica indisponível
aparece como "não disponível", nunca como zero; observação, hipótese e
recomendação separadas.

## Fase 6: Estúdio de carrosséis (5 a 8 sessões)

**Escopo:** R6. Primeiro, comparar Canva (modelos de marca) com editor próprio,
em uma sessão de avaliação. Se editor próprio: modelos 1080×1440 da marca, texto
→ slides a partir da copy aprovada, edição por slide, prévia, exportação PNG pelo
renderizador.

**Aceite:** um carrossel aprovado vira 6 slides exportados na identidade visual,
sem edição fora da Central.

## Fase 7: Múltiplos perfis e acesso remoto (2 a 4 sessões + estratégia)

**Escopo:** R10 e acesso seguro pelo iPhone fora da rede local. Perfil
Independência Médica com dados separados. **Pré-requisito estratégico:** Marketing
Core e identidade desse perfil aprovados pela Dra. Caroline; contas conectadas.

**Aceite:** dois perfis sem mistura de dados; acesso fora de casa com autenticação.

## Fase 8: Automações avançadas

Somente com benefício operacional medido (ex.: importação automática diária de
métricas, lembretes de pendências).
