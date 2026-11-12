# Premortem — Aprendizado Editorial do Marketing OS

Data: 2026-10-13

## Objetivo

Identificar riscos de que o sistema regrida aos padrões que Caroline
consistentemente corrigiu nos dois primeiros posts publicados (1.1 e 1.3),
e medidas de prevenção.

---

## Risco 1: Regressão à voz educacional

**O que pode acontecer:** O Creator produz conteúdo em registro de artigo
educacional ("Alterações de sono aparecem com frequência nessa fase")
em vez de conversa consultório ("Você acorda no meio da noite. Pela manhã,
continua cansada.").

**Por que é provável:** O modelo base do sistema tem viés natural para
linguagem expositiva e impessoal. As correções estão em learnings nos
agentes, mas o viés do modelo é estrutural.

**Prevenção:**
- Editor deve verificar cada card: "Isso soa como artigo ou como consulta?"
- Memory file `feedback_voice_calibration_published.md` reforça o padrão
- Revisão futura pode incluir exemplos publicados como few-shot reference

**Detecção:** Cards com frases na terceira pessoa descrevendo fenômenos
clínicos em vez de apresentar experiências na segunda pessoa.

---

## Risco 2: Retorno aos 7 cards

**O que pode acontecer:** O sistema produz novamente 7 cards com card de
síntese ou orientação separado, revertendo à arquitetura que Caroline
condensou.

**Por que é provável:** Os baselines T1 r1, T1 r2 e T2 r1 todos usaram
7 cards. A lógica de "7 slides para carrossel" pode ser reforçada por
padrões de mercado e templates externos.

**Prevenção:**
- Strategist tem regra explícita: "Target 6 cards"
- Creator tem regra explícita: "6 CARDS NOT 7"
- Editor tem pergunta de calibração: "Tem card de síntese ou orientação que pode ser eliminado?"

**Detecção:** Contagem de cards > 6 na entrega do Creator.

---

## Risco 3: Densidade excessiva por card

**O que pode acontecer:** Cards com 4-6 frases, empilhando experiência +
mecanismo + ressalva no mesmo card.

**Por que é provável:** O modelo tende a ser completo e cauteloso,
adicionando qualificações. A pressão por "conteúdo de valor" pode levar
a empilhar informações.

**Prevenção:**
- Creator tem regra: "2-3 sentences per card"
- Editor tem pergunta: "Algum card tem mais de 3 frases?"
- Exemplos concretos de published vs baseline nos learnings

**Detecção:** Contagem de frases por card na entrega do Creator.

---

## Risco 4: Abertura informacional em vez de experiencial

**O que pode acontecer:** O Creator abre com definição ou informação
("Perimenopausa não é necessariamente calor") em vez de reconhecimento
experiencial ("Você não sente calores, mas sabe que algo mudou").

**Por que é provável:** Aberturas informacionais são mais fáceis de
produzir e parecem mais "educativas."

**Prevenção:**
- Strategist tem regra de OPENING ANGLE SELECTION
- Creator tem regra: "Opening should present a recognizable experience"
- Editor tem pergunta: "A abertura apresenta uma experiência ou explica um conceito?"

**Detecção:** Card 1 que começa com definição, estatística ou afirmação
genérica sobre um tema médico.

---

## Risco 5: Uso de terceira pessoa para procedimentos clínicos

**O que pode acontecer:** "A histeroscopia permite visualizar..." em vez de
"Com ela, eu consigo olhar diretamente dentro do útero."

**Por que é provável:** O modelo evita primeira pessoa por padrão. A
linguagem médica impessoal é o default de textos sobre saúde.

**Prevenção:**
- Creator tem regra FIRST PERSON FOR CLINICAL AUTHORITY com exemplos
- Editor deve verificar: "Quando descreve o que a Dra. Caroline faz, usa primeira pessoa?"

**Detecção:** Frases sobre procedimentos da Dra. Caroline escritas em
terceira pessoa ou voz passiva.

---

## Risco 6: Sequenciamento territorial inadequado

**O que pode acontecer:** Dois posts consecutivos no mesmo território
clínico (ex: dois posts seguidos sobre histeroscopia/pólipos).

**Por que é provável:** A lógica de "próximo na progressão" pode dominar
sobre a lógica de "espaçar para absorção." O Strategist pode priorizar
profundidade em um território sobre alternância.

**Prevenção:**
- Strategist tem regra TOPIC SEQUENCING WITHIN A TERRITORY
- Memory file `project_clinical_learning_polyp_rejection.md` documenta a rejeição de N-261008-154937 com raciocínio de Caroline (timing + enquadramento)
- Calendar review deve verificar alternância entre territórios

**Detecção:** Calendário editorial com posts consecutivos no mesmo território.

---

## Risco 6b: Interpretação clínica distorcida a partir de decisão editorial

**O que pode acontecer:** O sistema interpreta a rejeição de uma pauta como
regra clínica universal. Ex: "Caroline rejeitou a pauta acompanhar vs tratar
pólipos" → "Caroline acha que todos os pólipos precisam de cirurgia."

**Por que é provável:** Decisões editoriais (o que publicar) são facilmente
confundidas com posições clínicas (o que é correto medicamente). O sistema
pode generalizar uma decisão de comunicação para uma afirmação médica.

**Prevenção:**
- Memória corrigida em 2026-10-14 com distinção explícita: o problema era o
  enquadramento "acompanhar vs tratar" como opções genéricas equivalentes,
  não uma posição de que todos os pólipos exigem cirurgia
- A conduta é individualizada: avaliação diagnóstica, vigilância em casos
  selecionados, indicação de tratamento, histeroscopia diagnóstica ou
  cirúrgica conforme contexto
- O sistema não deve fazer recomendações clínicas universais a partir de
  decisões editoriais

**Detecção:** Agente que afirma "Caroline prefere abordagem cirúrgica para
pólipos" sem qualificação de que a conduta é individualizada.

---

## Risco 7: Lacuna na versão publicada do 1.3

**O que pode acontecer:** O sistema continua sem a versão publicada do
post 1.3 (publishedCopy ausente em pipeline.json, sem publishDate, sem
postUrl). Isso impede comparação completa para o 1.3 e reduz a base de
calibração.

**Por que é relevante:** Sem a versão publicada, o sistema só compara
baseline → aprovado para o 1.3, perdendo possíveis alterações finais
(como a remoção de composição corporal que aconteceu entre aprovado e
publicado no 1.1).

**Mitigação:**
- Sinalizar a Caroline para completar os dados de publicação do 1.3
- Quando obtida, refazer a comparação aprovado → publicado para 1.3
- Atualizar os learnings se houver padrões adicionais

---

## Risco 8: Learnings tratados como regras absolutas

**O que pode acontecer:** Os learnings de 2 posts são tratados como regras
universais imutáveis. Um post futuro pode legitimamente precisar de uma
estrutura diferente (mais cards, abertura informacional, etc.).

**Por que é relevante:** Amostras pequenas (n=2) podem capturar preferências
contextuais, não leis universais. Caroline pode aprovar variações futuras.

**Mitigação:**
- Learnings são calibração, não lei. Desvios devem ser justificados, não proibidos.
- Quando Caroline aprovar uma variação, registrar como novo aprendizado
- Não rigidificar o sistema a ponto de impedir evolução editorial

---

## Resumo de medidas de prevenção

| Camada | Função |
|--------|--------|
| Strategist learnings | Previne riscos 2, 4, 6 na fase de brief |
| Creator learnings | Previne riscos 1, 2, 3, 4, 5 na fase de produção |
| Editor learnings | Detecta riscos 1, 2, 3, 4, 5 na fase de revisão |
| Memory files | Reforça riscos 1, 5, 6 em qualquer conversa futura |
| Pipeline.json gap | Risco 7 requer ação humana |
| Sample-size awareness | Risco 8 requer disciplina epistêmica |
