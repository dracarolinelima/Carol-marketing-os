# BRIEFS DE TESTE CONGELADOS: LINHA DE BASE DO MARKETING OS

Versão 1. Congelada em 14/09/2026. Não alterar após a primeira rodada.

## Finalidade

Estes quatro briefs servem para comparar a arquitetura atual (Creator e Editor como estão hoje) com a arquitetura nova (corpus de voz, arquivos enxutos, Editor sem reescrita). Os briefs são idênticos nas duas rodadas. A única coisa que muda entre as rodadas é a camada Creator e Editor.

T1 repete as condições dos oito E2Es anteriores e mede regressão. T2, T3 e T4 são temas e funções nunca testados e medem generalização.

## Protocolo de execução da linha de base

1. Não alterar nenhum arquivo do sistema antes ou durante a rodada.
2. Antes de rodar, passar cada pacote científico pelo Scientific Research uma única vez. O pacote resultante é congelado e reutilizado idêntico na rodada da arquitetura nova. Se o Scientific Research rebaixar ou remover uma afirmação, o brief é atualizado uma vez, antes de qualquer geração, e a versão atualizada passa a ser a congelada.
3. Rodar cada brief duas vezes pelo fluxo completo Creator → Editor, para observar variância.
4. Salvar as saídas na íntegra, sem edição humana, com o nome: `baseline_T1_r1.md`, `baseline_T1_r2.md`, e assim por diante. Salvar a saída do Creator e a saída do Editor separadamente.
5. Não avaliar ainda. A avaliação cega acontece depois da rodada da arquitetura nova, com as saídas das duas embaralhadas.

Regra geral para todos os briefs: nenhum CTA de agendamento. Nenhum travessão. Formato carrossel Instagram.

---

## T1. PERIMENOPAUSA SEM FOGACHO

Função: RECONHECER
Condição: idêntica aos E2Es 6, 7 e 8. Mede regressão.

### Brief

Segmento: mulheres entre 38 e 48 anos que percebem mudanças em sono, humor, ciclo e cognição, sem calor ou suor noturno, e que ainda não associaram essas mudanças a uma fase hormonal.

Objetivo estratégico: fazer a mulher reconhecer que sinais aparentemente separados podem pertencer a um mesmo processo, sem diagnosticar e sem prometer tratamento.

Job principal: reconhecimento. Ela sai do conteúdo pensando "isso é sobre mim" e não "aprendi o que é perimenopausa".

Etapa da jornada: descoberta.

Mensagem central: perimenopausa não é só calor. Mudanças de sono, humor, ciclo e memória podem aparecer antes e sem fogacho.

Mudança de percepção desejada: de "estou cansada / estressada / ficando velha" para "isso pode ter uma causa hormonal e vale investigar".

Territórios de reconhecimento: sono; humor e irritabilidade; ciclo; cognição.

Estrutura: capa; quatro cards de reconhecimento (um território por card); síntese; orientação. Sete cards.

Formato: carrossel Instagram, texto por card compatível com leitura em celular.

CTA: nenhum. O último card orienta, não convoca.

### Hipóteses científicas para validação

> **Status pré-validação:** o conteúdo abaixo não constitui fonte científica nem pacote científico validado. São afirmações candidatas e limites propostos que devem ser verificados pelo Scientific Research antes da primeira geração. As classificações de suporte/nível aqui descritas são hipóteses de trabalho, não conclusões a serem confirmadas.


Afirmação 1: sintomas vasomotores (calor, suor noturno) não são obrigatórios na perimenopausa; parte das mulheres apresenta primeiro alterações de sono, humor, ciclo ou cognição.
Suporte: provável. Nível: moderado (estudos de coorte e revisões). População: mulheres na transição menopausal. Desfecho: presença e ordem de aparecimento de sintomas. Limite de causalidade: os sintomas são associados à transição; sono, humor e cognição têm múltiplas causas concorrentes. Limitações: heterogeneidade de definição de perimenopausa entre estudos. Controvérsia: baixa.
Limite de formulação aprovada: pode dizer "muitas mulheres" ou "é comum". Não pode dizer "a maioria" nem citar percentual. Não pode dizer que a ausência de calor exclui ou confirma perimenopausa.

Afirmação 2: irregularidade de ciclo (variação de intervalo, fluxo ou duração) é o marcador clínico mais consistente do início da transição.
Suporte: provável. Nível: moderado a alto (critérios STRAW). População: mulheres 40 a 50 anos. Limite de causalidade: irregularidade também ocorre por outras causas (tireoide, SOP, pólipo, estresse). Limite de formulação aprovada: pode dizer "costuma ser um dos primeiros sinais". Não pode dizer "é sempre o primeiro".

Afirmação 3: queixas cognitivas leves (esquecimento, dificuldade de foco) são relatadas na transição e tendem a ser transitórias.
Suporte: provável. Nível: moderado. Limite de causalidade: associação; não implica declínio cognitivo. Limite de formulação aprovada: pode dizer "muitas mulheres relatam". Não pode usar "perda de memória" nem "déficit".

Limite de orientação (vale para o card final): não existe número de sinais que defina indicação de investigação. Não estabelecer limiar do tipo "se você tem dois ou mais", "se se reconheceu em mais de um". A orientação deve ser sobre a natureza do incômodo (persistente, interferindo na vida), não sobre contagem.

Limites médicos: não diagnosticar. Não mencionar TRH como solução. Não afirmar que os sintomas vão piorar.

---

## T2. PÓLIPO ENDOMETRIAL E HISTEROSCOPIA

Função: COMPREENSÃO
Condição: tema e função nunca testados.

### Brief

Segmento: mulheres que receberam um laudo de ultrassom com "pólipo endometrial" ou "espessamento endometrial" e não entenderam o que isso significa nem o que acontece a seguir.

Objetivo estratégico: reduzir a incerteza de quem chega com um achado de exame, explicando o que o achado é, por que o ultrassom sozinho não fecha o diagnóstico e o que a histeroscopia acrescenta.

Job principal: compreensão. Ela sai sabendo o que o laudo dela significa e por que existe um próximo passo.

Etapa da jornada: interesse.

Mensagem central: o ultrassom sugere; a histeroscopia vê e, quando indicado, resolve no mesmo ato.

Mudança de percepção desejada: de "tenho algo grave no útero" ou "é só um pólipo, não precisa fazer nada" para "sei o que é, sei por que investigar e sei o que o próximo exame faz".

Estrutura: capa; o que o laudo diz e o que ele não diz; por que pólipos sangram ou não sangram; o que a histeroscopia mostra que o ultrassom não mostra; diagnóstica e cirúrgica: a diferença; quando o achado merece atenção e quando pode ser acompanhado; fechamento com orientação. Sete cards. O Creator pode reorganizar a ordem se o raciocínio ficar mais claro.

Formato: carrossel Instagram.

CTA: nenhum.

### Hipóteses científicas para validação

> **Status pré-validação:** o conteúdo abaixo não constitui fonte científica nem pacote científico validado. São afirmações candidatas e limites propostos que devem ser verificados pelo Scientific Research antes da primeira geração. As classificações de suporte/nível aqui descritas são hipóteses de trabalho, não conclusões a serem confirmadas.


Afirmação 1: pólipos endometriais são causa frequente de sangramento uterino anormal, mas também são achados assintomáticos comuns.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "uma das causas mais comuns". Não citar prevalência numérica.

Afirmação 2: o ultrassom transvaginal identifica a suspeita, mas a histeroscopia é o padrão de referência para confirmar e caracterizar lesões intracavitárias.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "o ultrassom levanta a suspeita; a histeroscopia confirma". Não pode dizer que o ultrassom "erra" ou que "não serve".

Afirmação 3: a maioria dos pólipos endometriais é benigna; o risco de malignidade é baixo e aumenta com idade, pós-menopausa e presença de sangramento.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "a grande maioria é benigna". Não citar percentual de malignidade. Não usar a palavra "câncer" na capa.

Afirmação 4: a histeroscopia cirúrgica permite retirar o pólipo no mesmo procedimento em que se confirma o diagnóstico.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "ver e resolver". Não prometer que sempre é feito em consultório nem que é sem dor.

Limite de orientação: quando o achado merece investigação é decisão clínica que depende de sangramento, idade, tamanho e contexto. Não criar regra de tamanho ("acima de X mm") nem de contagem. Não dizer que todo pólipo precisa ser retirado nem que nenhum precisa.

Limites médicos: não diagnosticar a partir de laudo. Não mencionar preço. Não atacar quem fez o ultrassom.

---

## T3. ESCOLHA DE DIU APÓS EXPERIÊNCIA RUIM

Função: AUTORIDADE / RESOLUTIVIDADE
Condição: tema e função nunca testados.

### Brief

Segmento: mulheres que já usaram um método hormonal (pílula, DIU, implante) e tiveram experiência ruim: escape, dor, alteração de humor, ganho de peso percebido, ou retirada precoce. Querem contracepção de longa duração mas têm medo de repetir a experiência.

Objetivo estratégico: demonstrar raciocínio de escolha. Mostrar que "DIU" não é um método único, que a experiência anterior é informação clínica útil, e que a escolha depende do que aconteceu antes.

Job principal: autoridade demonstrada pelo raciocínio. Ela sai percebendo que existe um processo de decisão, não um catálogo.

Etapa da jornada: consideração.

Mensagem central: a experiência ruim que você teve não é motivo para desistir; é o primeiro dado para escolher melhor.

Mudança de percepção desejada: de "DIU não é pra mim" ou "todo hormônio me faz mal" para "o que aconteceu antes ajuda a decidir qual método faz sentido agora".

Estrutura: capa; o que uma experiência ruim informa; DIU hormonal e DIU de cobre: mecanismos diferentes, efeitos diferentes; escape nos primeiros meses: o que é adaptação e o que não é; dor na inserção: o que muda com técnica e preparo; o raciocínio de escolha em três perguntas; fechamento. Sete cards. O Creator pode reorganizar.

Formato: carrossel Instagram.

CTA: nenhum.

### Hipóteses científicas para validação

> **Status pré-validação:** o conteúdo abaixo não constitui fonte científica nem pacote científico validado. São afirmações candidatas e limites propostos que devem ser verificados pelo Scientific Research antes da primeira geração. As classificações de suporte/nível aqui descritas são hipóteses de trabalho, não conclusões a serem confirmadas.


Afirmação 1: DIU hormonal (levonorgestrel) e DIU de cobre têm mecanismos e perfis de efeito diferentes; o de cobre não tem hormônio e tende a aumentar fluxo e cólica; o hormonal tende a reduzir fluxo e pode causar escape irregular nos primeiros meses.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode descrever as tendências. Não dizer que um "não tem efeito colateral".

Afirmação 2: sangramento irregular nos primeiros 3 a 6 meses de DIU hormonal é esperado e tende a diminuir com o tempo.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "nos primeiros meses". Não prometer que cessa em todas.

Afirmação 3: a experiência com pílula combinada (estrogênio e progestagênio) não prediz diretamente a resposta ao DIU hormonal, que tem ação predominantemente local e sem estrogênio.
Suporte: provável. Nível: moderado. Limite de causalidade: efeitos sistêmicos do levonorgestrel existem, ainda que menores. Limite de formulação aprovada: pode dizer "não é a mesma coisa" e "age principalmente no útero". Não pode dizer "não tem efeito no corpo" nem "não afeta o humor".

Afirmação 4: dor na inserção varia; analgesia, técnica e, quando indicado, sedação reduzem o desconforto.
Suporte: provável. Nível: moderado (evidência de intervenções analgésicas é heterogênea). Limite de formulação aprovada: pode dizer "existem formas de reduzir". Não pode prometer "sem dor".

Limite de orientação: a escolha depende de história clínica, sangramento prévio, desejo de amenorreia, contraindicações. Não criar fluxograma decisório fechado ("se X, então DIU Y"). As três perguntas do card de raciocínio devem ser perguntas que a médica faz, não regras que a paciente aplica sozinha.

Limites médicos: não indicar método específico para a leitora. Não mencionar preço. Não usar "sem dor", "indolor", "traumatizou".

---

## T4. SOP E COMPOSIÇÃO CORPORAL

Função: RECONHECER
Condição: tema nunca testado, segmento sub-representado nos dados internos (Core, seção 8). Mede generalização com pouca evidência interna.

### Brief

Segmento: mulheres entre 25 e 38 anos com ciclos irregulares, dificuldade de emagrecer apesar de esforço, acne ou queda de cabelo, que já ouviram "é só emagrecer" ou receberam anticoncepcional sem explicação.

Objetivo estratégico: fazer a mulher reconhecer que o conjunto (ciclo, peso que não responde, pele, cabelo) pode ter uma lógica comum, e que o problema não é falta de esforço.

Job principal: reconhecimento.

Etapa da jornada: descoberta.

Mensagem central: se você se esforça e o corpo não responde, pode não ser falta de disciplina. Pode ser metabolismo e hormônio conversando.

Mudança de percepção desejada: de "não tenho força de vontade" para "existe algo que precisa ser investigado antes de tentar mais do mesmo".

Territórios de reconhecimento: ciclo irregular; esforço sem resultado no peso; pele e cabelo; fome e energia oscilando.

Estrutura: capa; quatro cards de reconhecimento; síntese; orientação. Sete cards.

Formato: carrossel Instagram.

CTA: nenhum.

### Hipóteses científicas para validação

> **Status pré-validação:** o conteúdo abaixo não constitui fonte científica nem pacote científico validado. São afirmações candidatas e limites propostos que devem ser verificados pelo Scientific Research antes da primeira geração. As classificações de suporte/nível aqui descritas são hipóteses de trabalho, não conclusões a serem confirmadas.


Afirmação 1: SOP é uma condição heterogênea que envolve alteração ovulatória, sinais de excesso androgênico e, em grande parte das mulheres, resistência à insulina.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "em muitas mulheres com SOP". Não pode dizer "toda mulher com SOP tem resistência à insulina".

Afirmação 2: resistência à insulina dificulta a perda de gordura e favorece o acúmulo de gordura abdominal, mesmo com dieta e exercício.
Suporte: provável. Nível: moderado. Limite de causalidade: a relação é bidirecional; ganho de peso também piora a resistência. Limite de formulação aprovada: pode dizer "dificulta" e "o corpo responde menos ao esforço". Não pode dizer "impede" nem "não adianta fazer dieta".

Afirmação 3: acne persistente e queda de cabelo com padrão androgênico podem ser manifestações de excesso androgênico associado à SOP.
Suporte: estabelecido. Nível: alto. Limite de causalidade: têm outras causas frequentes (tireoide, ferro, estresse). Limite de formulação aprovada: pode dizer "podem estar ligadas". Não pode dizer "são sinal de SOP".

Afirmação 4: anticoncepcional combinado regulariza o sangramento e melhora sinais androgênicos, mas não trata a resistência à insulina.
Suporte: estabelecido. Nível: alto. Limite de formulação aprovada: pode dizer "regulariza o ciclo, mas não resolve a parte metabólica". Não pode dizer que anticoncepcional "mascara" ou "piora" a SOP. Não atacar quem prescreveu.

Limite de orientação: não existe contagem de sinais que defina SOP nem indicação de investigação. Não criar limiar. Não prometer emagrecimento. Não mencionar GLP1, metformina ou qualquer medicação.

Limites médicos: não diagnosticar SOP. Não usar "destravar o corpo" como promessa. Não mencionar fertilidade como resultado.

---

## Registro de execução

| Brief Rodada Data Arquitetura Arquivo Creator Arquivo Editor  |    |   |       |   |   |
| ------------------------------------------------------------- | -- | - | ----- | - | - |
| T1                                                            | r1 |   | atual |   |   |
| T1                                                            | r2 |   | atual |   |   |
| T2                                                            | r1 |   | atual |   |   |
| T2                                                            | r2 |   | atual |   |   |
| T3                                                            | r1 |   | atual |   |   |
| T3                                                            | r2 |   | atual |   |   |
| T4                                                            | r1 |   | atual |   |   |
| T4                                                            | r2 |   | atual |   |   |