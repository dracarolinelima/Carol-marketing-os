---
name: design-dra-caroline
description: Diagramar peças de Instagram da Dra. Caroline Lima (cards de carrossel, capas de Reels, anúncios Meta, status, ícones) sobre fotos ou fundo aubergine, renderizando HTML/CSS em PNG com Playwright. Use sempre que for criar ou ajustar uma arte da marca.
---

# Design Dra. Caroline Lima

Este documento descreve como as artes da marca são produzidas: o sistema visual, as regras de composição e o processo técnico. Siga exatamente. Quando um briefing contradisser algo daqui, siga o briefing e avise.

## 1. Princípio

A arte não é desenhada em ferramenta visual. Ela é escrita em HTML/CSS, com a foto original como fundo, e renderizada em PNG pelo Chromium (Playwright). Isso dá controle total de tipografia, tamanho e posição, e permite medir cada texto para garantir que nada encoste em rosto, mão ou objeto.

A foto é intocável. O trabalho é tipográfico.

## 2. Formatos

| Peça | Tamanho | Observação |
| --- | --- | --- |
| Card de carrossel e post de feed | 1080 x 1350 (4:5) | Formato padrão |
| Anúncio Meta (feed) | 1080 x 1350 (4:5) | |
| Capa de Reels e status | 1080 x 1920 (9:16) | Texto e rodapé dentro da área central que aparece no grid (aprox. y 240 a 1680) |
| Ícone de grupo/perfil | 1080 x 1080 | O app corta em círculo: conferir rosto e texto dentro do círculo |

Margens de segurança: 80 a 90 px nas laterais, 100 px no topo e na base.

## 3. Paleta

| Uso | Cor |
| --- | --- |
| Fundo aubergine (cards sem foto) | #301826 ou #341627 |
| Aubergine escuro (botão, caixa) | #2A0F1F |
| Tinta aubergine (texto sobre fundo claro) | #450C19 |
| Off-white (texto sobre fundo escuro) | #F5ECEA |
| Dourado (traço, seta) | #B98E5C |
| Dourado claro (detalhe sobre escuro) | #CEAF81 |

Dourado só em detalhe mínimo: o traço decorativo e, em anúncio, a seta do botão. Nunca em frase inteira. Sem cores fora da paleta (o rosa do Outubro Rosa foi exceção pontual, não regra).

## 4. Tipografia

Fontes em TTF do Google Fonts via npm (`npm pack @expo-google-fonts/playfair-display @expo-google-fonts/montserrat @expo-google-fonts/cormorant-garamond`), carregadas por `@font-face` com caminho local.

| Papel | Fonte | Tamanho em 1080 px |
| --- | --- | --- |
| Destaque principal (padrão do feed) | Playfair Display ExtraBold 800, letter-spacing -1 a -1,5 px, entrelinha 1,0 a 1,05 | 74 a 100 px |
| Destaque editorial (quando o briefing pedir Cormorant) | Cormorant Garamond SemiBold 600, entrelinha 1,08 a 1,12 | 68 a 90 px |
| Frase de abertura e apoio | Montserrat Regular 400 | 32 a 42 px, entrelinha 1,28 a 1,4 |
| Palavras-chave dentro do apoio | Montserrat SemiBold 600 (só as palavras, nunca a frase inteira) | mesmo tamanho do apoio |
| Convite final discreto | Montserrat Regular, opacidade 0,85 a 0,9 | 25 a 30 px |
| Botão de anúncio | Montserrat SemiBold 600, letter-spacing 1,3 a 1,8 px, caixa alta | 25 a 29 px |

Observação: no Cormorant os acentos (ê, ú) ficam altos e levemente à direita. É o desenho da fonte, não erro.

## 5. Hierarquia (regra mais importante)

1. Toda peça tem uma frase de abertura menor (Montserrat) e um destaque grande (Playfair ou Cormorant). No máximo dois níveis fortes por card.
2. O destaque vai nas palavras com que a paciente se identifica ao bater o olho: o sintoma, a dor, a pergunta. Exemplo: "mais gordura abdominal" e "preservar músculos", não "Mesmo assim".
3. Conectores ("ou", "Mesmo assim, percebe", "Na") ficam em Montserrat menor, só para ligar.
4. O destaque precisa ser grande de verdade. Na dúvida, maior. A Dra. Caroline costuma pedir para aumentar.
5. Traço dourado de 96 a 110 px por 3 px separa a abertura do destaque, ou um parágrafo do outro.
6. Nunca mudar o texto recebido. Só é permitido escolher onde quebrar a linha. Se uma quebra for necessária para desviar de um rosto, avisar.
7. Nunca usar travessão.

Modelo de referência (post "o que faria diferente?"): fundo #301826, abertura em Montserrat Regular em duas linhas, destaque em Playfair ExtraBold em duas linhas, traço dourado curto embaixo, rodapé no canto inferior esquerdo.

## 6. Rodapé (assinatura)

Padrão em todos os cards de feed:

```
DRA. CAROLINE LIMA                 Cormorant Garamond 500, 28 px, letter-spacing 6 px
───────────────────────────────    linha de 1 px, off-white, opacidade 0,5
GINECOLOGIA  ·  SAÚDE DA MULHER    Montserrat 600, 12 px, letter-spacing 4,6 px
```

Aplicar com `transform: scale(.82)` a partir do canto superior esquerdo. Mesma altura em todos os cards do carrossel (topo em y = 1200 no 1080 x 1350), alinhado à margem esquerda da coluna de texto daquele card. Nunca sobre área com muito detalhe. Se não houver área limpa, usar degradê aubergine suave só no canto do rodapé.

Exceções:
- Stories: sem nome nem especialidade na arte (fica com cara de IA). Visual nativo do Instagram.
- Anúncio Meta: sem rodapé na arte. Nome, CRM e RQE vão no texto do anúncio (regra do CFM).

## 7. Composição sobre foto

1. A foto é usada sem filtro, sem retoque, sem recriar rosto ou corpo.
2. Ajustar ao formato escalando pela largura (1080 px) e cortando o excesso, de preferência na base.
3. Texto só no espaço negativo (parede, fundo liso). Nunca sobre rosto, cabelo, mãos ou objeto narrativo.
4. Degradê só quando indispensável, em aubergine, suave, e nunca sobre rosto.
5. Se não houver espaço livre suficiente: descer a foto 130 a 200 px e estender o aubergine no topo com degradê que se funde à foto. Avisar que a base da foto foi cortada.
6. Se mesmo assim não couber, informar e propor ajuste antes de reduzir a fonte.
7. Texto alinhado à esquerda. Sem caixas, sombras, molduras ou ícones, salvo pedido explícito.

## 8. Anúncios Meta

- Título em caixa alta, curto, que diga em menos de 2 segundos o que é, se é particular e onde (ex.: "HISTEROSCOPIA PARTICULAR EM IPANEMA").
- Subtítulo em Montserrat Medium, uma ou duas linhas.
- Botão em pílula #2A0F1F, texto off-white Montserrat SemiBold, seta dourada: "VER VALORES E DATAS →". Botão no terço inferior, sem encostar na margem.
- Proibido na arte: preço, telefone, ícone de WhatsApp, selo, urgência, escassez, "agende agora".

## 9. Legendas

Legenda não repete o texto do post. Curta, leve, convida à interação, sem cara de texto de IA (sem listas de três, sem frases de efeito, sem travessão).

## 10. Processo técnico

1. Inspecionar a foto: gerar uma cópia com grade de 100 px e olhar onde estão rosto, mãos, objetos e o espaço livre.
2. Escrever o HTML do card (modelo abaixo).
3. Renderizar com Playwright e medir cada bloco de texto com `Range.getBoundingClientRect()`. Conferir que nenhum bloco invade as áreas proibidas e que todos respeitam as margens.
4. Olhar a imagem renderizada (reduzida a 50%, como no celular). Corrigir colisão, texto pequeno ou desalinhamento.
5. Exportar cada card em PNG separado e uma prévia com os cards lado a lado.
6. Ao entregar, dizer em poucas linhas o que foi feito e qualquer desvio do briefing (corte, quebra de linha, degradê).

### Modelo de HTML

```html
<meta charset="utf-8">
<style>
@font-face{font-family:PF;src:url(ft/PlayfairDisplay_800ExtraBold.ttf);font-weight:800}
@font-face{font-family:CGT;src:url(ft/CormorantGaramond_600SemiBold.ttf);font-weight:600}
@font-face{font-family:CG;src:url(ft/CormorantGaramond_500Medium.ttf);font-weight:500}
@font-face{font-family:MO;src:url(ft/Montserrat_400Regular.ttf);font-weight:400}
@font-face{font-family:MO;src:url(ft/Montserrat_600SemiBold.ttf);font-weight:600}
html,body{margin:0}
.c{position:relative;width:1080px;height:1350px;overflow:hidden;background:#301826;color:#F5ECEA;-webkit-font-smoothing:antialiased}
.bg{position:absolute;left:0;top:0;width:1080px}
.a{position:absolute}
.lead{font:400 38px/1.3 MO}
.hl{font:800 96px/1.02 PF;letter-spacing:-1.5px}
.r{width:96px;height:3px;background:#B98E5C;margin:32px 0 28px}
.ft{transform:scale(.82);transform-origin:left top}
.ft .n{font:500 28px/1 CG;letter-spacing:6px;white-space:nowrap}
.ft .l{height:1px;background:#F5ECEA;opacity:.5;margin:10px 0 9px}
.ft .s{font:600 12px/1 MO;letter-spacing:4.6px;white-space:nowrap}
</style>
<div class="c">
  <img class="bg" src="foto.png">
  <div class="a" style="left:90px;top:104px">
    <div class="lead">Você continua fazendo<br>tudo como antes.</div>
    <div class="r"></div>
    <div class="hl">Mas seu<br>corpo já não<br>responde<br>igual?</div>
  </div>
  <div class="a" style="left:90px;top:1200px">
    <div class="ft"><div class="n">DRA. CAROLINE LIMA</div><div class="l"></div>
    <div class="s">GINECOLOGIA &nbsp;·&nbsp; SAÚDE DA MULHER</div></div>
  </div>
</div>
```

### Script de renderização

```python
# uso: python render.py card1 card2 ...  (lê cardN.html, gera cardN.png)
import os, sys
from playwright.sync_api import sync_playwright
W, H = 1080, 1350
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": W, "height": H})
    for k in sys.argv[1:]:
        pg.goto("file://" + os.path.abspath(k + ".html"))
        pg.wait_for_timeout(700)  # espera as fontes
        caixas = pg.evaluate("""() => [...document.querySelectorAll('.lead,.hl,.ft,[data-medir]')]
          .map(e => { const r = document.createRange(); r.selectNodeContents(e);
                      const b = r.getBoundingClientRect();
                      return [e.className, Math.round(b.x), Math.round(b.y), Math.round(b.right), Math.round(b.bottom)] })""")
        print(k, caixas)  # conferir contra as áreas proibidas da foto
        pg.screenshot(path=k + ".png")
    b.close()
```

Para foto mais alta que 4:5, preparar antes com Pillow: `im.resize((1080, round(h*1080/w))).crop((0, 0, 1080, 1350))`.

## 11. Checklist antes de entregar

- [ ] Texto idêntico ao recebido, sem travessão
- [ ] Destaque nas palavras de identificação, grande o suficiente
- [ ] Nada sobre rosto, cabelo, mãos ou objeto narrativo
- [ ] Margens de 80 a 90 px nas laterais e 100 px no topo e na base
- [ ] Rodapé padrão na mesma altura em todos os cards (exceto Stories e anúncios)
- [ ] Dourado só no traço ou na seta
- [ ] Foto sem filtro; cortes e deslocamentos avisados
- [ ] Prévia conferida em tamanho de celular
- [ ] PNGs individuais no tamanho certo e prévia da sequência
