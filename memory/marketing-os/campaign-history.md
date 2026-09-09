# Histórico de Conteúdo e Campanhas

**Objetivo**: manter um histórico rastreável dos conteúdos publicados, campanhas 
executadas e resultados comerciais verificados no Carol Marketing OS.

Este arquivo registra evidências e aprendizados. Ele não transforma 
automaticamente resultados passados em regras permanentes.

**Responsável principal**: MOS-Performance Analyst

**Coordenação**: MOS-Orchestrator

**Regra de aprovação**: aprendizados que possam alterar decisões futuras 
precisam de revisão humana antes de se tornarem regras do sistema.

---

## Regras fundamentais

- Registrar o que realmente aconteceu, não o que era esperado.
- Separar métricas da plataforma de resultados comerciais.
- Separar agendamento de comparecimento.
- Separar preço informado de receita verificada.
- Nunca usar classificações da IA do Cliente IO como verdade.
- Não inferir causalidade apenas por associação ou sequência temporal.
- Um conteúdo com desempenho alto ou baixo não cria sozinho uma regra.
- Preservar denominadores, períodos analisados e limitações dos dados.
- Agendamentos futuros ainda não podem ser avaliados quanto ao comparecimento.
- Quando a atribuição for incerta, registrar a incerteza.
- Não armazenar dados identificáveis de pacientes neste arquivo.
- Nunca inventar metas, resultados, receita, atribuição ou explicações.

---

## Identificadores

Sempre que disponíveis, usar identificadores para permitir conexão posterior 
entre conteúdo, campanha e resultados.

Exemplos:

- Conteúdo: `CNT-2026-001`
- Criativo: `CR-2026-001A`
- Briefing: `BRIEF-2026-001`
- Campanha Meta: `CMP-META-2026-09-01`

Quando for necessário relacionar leads, agendamentos ou receita, utilizar 
identificadores anonimizados.

Não assumir que dois registros pertencem à mesma jornada sem evidência 
confiável.

---

## Registro de conteúdo publicado

Usar para Reels, carrosséis, posts estáticos, Stories ou outros conteúdos cujo 
resultado seja relevante manter no histórico.

### [ID do conteúdo] — [Título ou descrição]

**Data de publicação:**

**Canal:**

**Formato:**

**Briefing relacionado:**

**ID do criativo:**

**Segmento:**

**Necessidade da paciente:** COMPREENDER / RESOLVER / RECUPERAR

**Etapa da jornada:** RECONHECER / ENTENDER / CONFIAR / PROCURAR

**Função do conteúdo:** DESCOBERTA / COMPREENSÃO / AUTORIDADE-RESOLUTIVIDADE / 
CONVERSÃO

**Objetivo estratégico:**
[O que este conteúdo deveria fazer.]

**Mensagem ou abordagem:**
[O que efetivamente foi comunicado.]

**Situação da evidência científica:**
[Não se aplica / Verificada / Limitada / Requer revisão]

### Métricas do conteúdo

- Alcance:
- Retenção:
- Salvamentos:
- Compartilhamentos:
- Visitas ao perfil:
- Perguntas ou comentários relevantes:
- Outras métricas pertinentes:

### Resultados posteriores

- Leads associados de forma confiável:
- Leads qualificados:
- Agendamentos confirmados:
- Comparecimentos verificados:
- Receita de consulta verificada:
- Tratamento ou procedimento, quando houver dado confiável:
- Recorrência ou indicação, quando houver dado confiável:

**Maturidade dos dados:**
[Registrar quais resultados já podem ser avaliados e quais ainda não tiveram 
tempo suficiente para acontecer.]

**Situação da atribuição:**
ATRIBUIÇÃO DIRETA / ASSOCIAÇÃO SUSTENTADA / HIPÓTESE / DADOS INSUFICIENTES

**Fontes utilizadas:**
[Instagram ou Meta / conversa bruta do Cliente IO / planilha de atendimentos / 
registro financeiro / outra fonte confiável]

**Possíveis fatores operacionais:**
[Disponibilidade de agenda, tempo de resposta, atendimento da secretária, preço, 
local, processo de agendamento, sinal, feriados, capacidade ou outros fatores 
relevantes.]

**Resultado observado:**
[Descrever apenas fatos.]

**Interpretação:**
[Separar claramente associação e hipótese.]

**Situação do aprendizado:**
OBSERVAÇÃO / SINAL REPETIDO / APRENDIZADO CANDIDATO / REVISÃO HUMANA / REGRA 
APROVADA

**Decisão humana:**
[Quando aplicável.]

---

## Registro de campanha paga

### [ID da campanha] — [Nome]

**Plataforma:**

**Data de início:**

**Data de término ou situação atual:**

**Briefing relacionado:**

**Público ou segmentação:**

**Conteúdos ou criativos relacionados:**

**Objetivo comercial:**

**Investimento verificado:**

### Entrega da plataforma

- Impressões:
- Alcance:
- Cliques ou visualizações da página, quando aplicável:
- Leads registrados pela plataforma:
- Outras métricas relevantes:

### Funil verificado

- Leads rastreáveis:
- Leads qualificados:
- Agendamentos confirmados:
- Comparecimentos verificados:
- Receita de consulta verificada:
- Receita posterior verificada, quando disponível:

### Indicadores financeiros

Calcular apenas quando os dados e denominadores forem confiáveis:

- Custo por lead:
- Custo por lead qualificado:
- Custo por agendamento confirmado:
- Custo por paciente que compareceu:
- CAC de mídia:
- ROAS diretamente atribuído:

**Receita associada, mas não diretamente atribuída:**
[Manter separada da receita com atribuição direta.]

**Situação da atribuição:**
ATRIBUIÇÃO DIRETA / ASSOCIAÇÃO SUSTENTADA / HIPÓTESE / DADOS INSUFICIENTES

**Fontes utilizadas:**

- Investimento e entrega: Meta Ads Manager
- Lead e conversa: registro e conversa bruta do Cliente IO
- Agendamento: evidência observável na conversa bruta que cumpra a definição 
operacional
- Comparecimento: planilha interna de atendimentos ou outra fonte operacional 
definida como confiável
- Receita: registro operacional ou financeiro confiável

**Maturidade dos dados:**
[Indicar quais leads e agendamentos já tiveram tempo suficiente para entrar em 
cada cálculo.]

**Possíveis fatores operacionais:**
[Registrar fatores externos à mídia que possam ter afetado o resultado.]

**O que aconteceu:**
[Descrição factual.]

**O que pode explicar o resultado:**
[Separar associações de hipóteses.]

**Ação recomendada:**
[Decisão sustentada pelos dados disponíveis.]

**Situação do aprendizado:**
OBSERVAÇÃO / SINAL REPETIDO / APRENDIZADO CANDIDATO / REVISÃO HUMANA / REGRA 
APROVADA

**Decisão humana:**
[Quando aplicável.]

---

## Definições operacionais

### Agendamento confirmado

`AGENDAMENTO = CONFIRMADO` somente quando a conversa bruta do CRM apresentar 
evidência confiável de que uma data e horário específicos foram combinados ou 
confirmados e, quando o processo exigir sinal ou pagamento de entrada, essa 
exigência também estiver confirmada.

Isso mede conversão em agendamento.

Não comprova comparecimento.

### Comparecimento verificado

`COMPARECIMENTO = VERIFICADO` somente quando a planilha interna de atendimentos 
ou outra fonte operacional definida como confiável confirmar que a paciente 
compareceu.

Confirmação pelo WhatsApp não comprova comparecimento.

A ausência na planilha também não deve ser classificada automaticamente como 
falta sem verificar o período e as demais evidências disponíveis.

### Receita verificada

Receita somente é considerada verificada quando existe registro operacional ou 
financeiro confiável.

Preço informado, orçamento ou solicitação de pagamento não constituem receita 
verificada.

Quando a planilha de atendimentos registrar de forma confiável o valor 
efetivamente pago pela consulta, ela poderá ser usada como fonte da receita da 
consulta.

---

## Terminologia de conversão

Sempre especificar qual etapa está sendo medida.

- Lead → agendamento confirmado = conversão em agendamento
- Agendamento confirmado ou lead elegível → comparecimento verificado = 
conversão em comparecimento
- Lead ou paciente adquirida → receita verificada = conversão em receita
- Conversão em tratamento ou procedimento = somente quando houver dado posterior 
confiável

Evitar usar apenas a palavra "conversão" quando houver possibilidade de 
confundir etapas diferentes.

---

## Atribuição

### ATRIBUIÇÃO DIRETA

Existe evidência rastreável suficientemente confiável conectando a origem ou 
conteúdo ao resultado posterior.

### ASSOCIAÇÃO SUSTENTADA

Há múltiplas evidências apoiando uma relação, mas o rastreamento direto ou a 
certeza causal são incompletos.

### HIPÓTESE

Existe uma explicação plausível que ainda precisa de evidências adicionais.

### DADOS INSUFICIENTES

Os dados disponíveis não permitem uma conclusão responsável.

Atribuição direta significa que conseguimos rastrear a origem. Não significa que 
aquela exposição foi a única causa da decisão da paciente.

Quando fontes entrarem em conflito, registrar o conflito em vez de escolher 
silenciosamente uma delas.

---

## Registro de aprendizados

Resultados podem gerar aprendizados candidatos, mas repetição isolada não 
transforma uma conclusão em regra.

Fluxo:

`OBSERVAÇÃO → SINAL REPETIDO → APRENDIZADO CANDIDATO → REVISÃO HUMANA → 
REGRA APROVADA`

### Observação

Um resultado apareceu em um conteúdo, campanha, grupo ou período.

Não generalizar.

### Sinal repetido

Um padrão semelhante apareceu em observações comparáveis.

Antes de avançar, verificar denominador, período, público, função do conteúdo, 
canal e possíveis fatores operacionais.

### Aprendizado candidato

O padrão parece relevante o suficiente para potencialmente influenciar decisões 
futuras, mas ainda precisa de revisão.

Registrar:

- evidências favoráveis;
- evidências contraditórias;
- denominador relevante;
- possíveis fatores de confusão;
- força da atribuição;
- limites do aprendizado proposto.

### Revisão humana

Carol avalia se o aprendizado deve influenciar decisões futuras.

### Regra aprovada

Somente depois da aprovação humana um aprendizado pode ser tratado como regra 
reutilizável do sistema.

Toda regra aprovada deve registrar seu escopo e a evidência que a sustenta. Ela 
deve ser reavaliada quando surgirem novos dados que a contradigam de forma 
relevante.

---

## Aprendizados aprovados

Nenhum aprendizado de performance aprovado até o momento.

Não preencher esta seção automaticamente.

---

## Aprendizados candidatos

Nenhum aprendizado candidato até o momento.

---

## Histórico

Nenhum conteúdo ou campanha registrado até o momento.

Adicionar registros somente após publicação, execução ou análise retrospectiva 
baseada em dados reais.

---

## Instruções para os agentes

Antes de usar um resultado passado para orientar uma nova decisão, verificar:

1. Existe um registro anterior realmente comparável?
2. O resultado foi medido na etapa correta do funil?
3. Já houve tempo suficiente para avaliar o resultado posterior?
4. Qual é a força da atribuição?
5. Existem fatores operacionais que podem explicar parte do resultado?
6. A conclusão é apenas uma observação ou já é uma regra aprovada?

Um fracasso anterior não proíbe automaticamente uma abordagem.

Um sucesso anterior não justifica automaticamente repeti-la.

O objetivo deste histórico é melhorar decisões sem transformar dados ruidosos em 
falsas certezas.
