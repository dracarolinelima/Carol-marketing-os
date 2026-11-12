// Renderizador de cards do carrossel — canvas 2D.
//
// Segue design-dra-caroline (skill da Dra. Caroline, 12/11/2026): paleta,
// tipografia, hierarquia abertura+destaque, traço dourado, rodapé de
// assinatura. Única divergência deliberada: formato 1080×1440 (3:4, "o
// formato novo do Instagram", confirmado por ela) em vez do 1080×1350 (4:5)
// que o documento da skill descreve como padrão — ela confirmou 3:4 nesta
// sessão.
//
// Fundo aubergine (sem foto) é o modo coberto aqui. Fotos (geradas por ela
// no ChatGPT) são a próxima etapa: upload + composição, ainda não
// implementado.
//
// Desenho e exportação usam a mesma função: a prévia na tela é, pixel a
// pixel, o PNG exportado.

export const CANVAS_W = 1080
export const CANVAS_H = 1440

// Margens de segurança da skill (80-90px laterais, 100px topo/base) — usamos
// o valor superior da faixa.
const MARGIN_X = 90
const MARGIN_TOP = 100
const MARGIN_BOTTOM = 100

const COLORS = {
  aubergine: '#301826',
  aubergineEscuro: '#2A0F1F',
  tintaAubergine: '#450C19',
  offWhite: '#F5ECEA',
  dourado: '#B98E5C',
  douradoClaro: '#CEAF81',
}

export type CardVariant = 'capa' | 'corpo' | 'fechamento'
export type HeadlineFont = 'playfair' | 'cormorant'

export interface CardData {
  num: number
  total: number
  lead: string
  headline: string
  variant: CardVariant
  headlineFont: HeadlineFont
}

function wrapParagraph(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function fitBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSpec: (size: number) => string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  lineHeightRatio: number,
): { size: number; lines: string[]; lineHeight: number; height: number } {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = fontSpec(size)
    const lines = wrapParagraph(ctx, text, maxWidth)
    const lineHeight = size * lineHeightRatio
    const height = lines.length * lineHeight
    if (size === minSize) return { size, lines, lineHeight, height }
    // Deixa o chamador decidir se cabe; aqui so paramos de encolher
    // quando o bloco bate no minimo ou quando o chamador aceitar.
    if (height <= startSize * lineHeightRatio * 6) return { size, lines, lineHeight, height }
  }
  ctx.font = fontSpec(minSize)
  const lines = wrapParagraph(ctx, text, maxWidth)
  const lineHeight = minSize * lineHeightRatio
  return { size: minSize, lines, lineHeight, height: lines.length * lineHeight }
}

function drawFooter(ctx: CanvasRenderingContext2D, fg: string) {
  // Rodape padrao da marca, escala .82 a partir do topo-esquerda,
  // y=1200 em 1350 de altura -> proporcional em 1440: ~1280.
  const x = MARGIN_X
  const topY = 1280
  const scale = 0.82

  ctx.save()
  ctx.translate(x, topY)
  ctx.scale(scale, scale)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fg
  ctx.font = '500 28px "Cormorant Garamond"'
  // letter-spacing manual: desenha caractere a caractere
  drawTrackedText(ctx, 'DRA. CAROLINE LIMA', 0, 28, 6)

  ctx.strokeStyle = fg
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 38)
  ctx.lineTo(420, 38)
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.font = '600 12px "Montserrat"'
  drawTrackedText(ctx, 'GINECOLOGIA · SAÚDE DA MULHER', 0, 58, 4.6)

  ctx.restore()
}

function drawTrackedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  let cursor = x
  for (const ch of text) {
    ctx.fillText(ch, cursor, y)
    cursor += ctx.measureText(ch).width + tracking
  }
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData) {
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isDark = data.variant === 'capa' || data.variant === 'fechamento'
  const bg = isDark ? COLORS.aubergine : COLORS.offWhite
  const fg = isDark ? COLORS.offWhite : COLORS.tintaAubergine

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const maxWidth = CANVAS_W - MARGIN_X * 2
  const headlineFamily = data.headlineFont === 'cormorant' ? 'Cormorant Garamond' : 'Playfair Display'
  const headlineWeight = data.headlineFont === 'cormorant' ? 600 : 800

  // --- Abertura (lead), Montserrat 400, 32-42px ---
  let leadBlock: ReturnType<typeof fitBlock> | null = null
  if (data.lead.trim()) {
    leadBlock = fitBlock(
      ctx,
      data.lead,
      (size) => `400 ${size}px "Montserrat"`,
      maxWidth,
      38,
      28,
      1.34,
    )
  }

  // --- Destaque (headline), Playfair ExtraBold 800 (ou Cormorant 600) ---
  const headlineBlock = fitBlock(
    ctx,
    data.headline,
    (size) => `${headlineWeight} ${size}px "${headlineFamily}"`,
    maxWidth,
    data.headlineFont === 'cormorant' ? 90 : 100,
    data.headlineFont === 'cormorant' ? 56 : 56,
    data.headlineFont === 'cormorant' ? 1.1 : 1.03,
  )

  const ruleGap = 30
  const ruleHeight = 3
  const ruleWidth = 100

  const totalHeight =
    (leadBlock ? leadBlock.height + ruleGap + ruleHeight + ruleGap : 0) + headlineBlock.height
  const availableHeight = CANVAS_H - MARGIN_TOP - MARGIN_BOTTOM - 120 // reserva para o rodape
  let y = MARGIN_TOP + Math.max(0, (availableHeight - totalHeight) / 2)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fg

  if (leadBlock) {
    ctx.font = `400 ${leadBlock.size}px "Montserrat"`
    for (const line of leadBlock.lines) {
      y += leadBlock.lineHeight
      ctx.fillText(line, MARGIN_X, y)
    }
    y += ruleGap
    ctx.fillStyle = COLORS.dourado
    ctx.fillRect(MARGIN_X, y, ruleWidth, ruleHeight)
    y += ruleHeight + ruleGap
    ctx.fillStyle = fg
  }

  ctx.font = `${headlineWeight} ${headlineBlock.size}px "${headlineFamily}"`
  for (const line of headlineBlock.lines) {
    y += headlineBlock.lineHeight
    ctx.fillText(line, MARGIN_X, y)
  }

  drawFooter(ctx, fg)

  // Index tag discreto (nao faz parte da skill, mas ajuda a navegar no
  // editor — minusculo, opacidade baixa, canto superior direito).
  ctx.font = '500 18px "Montserrat"'
  ctx.fillStyle = fg
  ctx.globalAlpha = 0.35
  const tag = `${String(data.num).padStart(2, '0')}/${String(data.total).padStart(2, '0')}`
  const tagWidth = ctx.measureText(tag).width
  ctx.fillText(tag, CANVAS_W - MARGIN_X - tagWidth, 60)
  ctx.globalAlpha = 1
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

// Separa um texto de card em abertura (lead) + destaque (headline), de
// forma heuristica: a primeira frase vira abertura se houver mais de uma
// frase; o resto vira destaque. Ponto de partida editavel — a divisao real
// (quais palavras sao destaque) e uma decisao editorial, nao automatica.
export function splitLeadHeadline(text: string): { lead: string; headline: string } {
  const clean = text.trim()
  const sentenceEnd = clean.search(/[.!?]\s+/)
  if (sentenceEnd === -1 || sentenceEnd > clean.length * 0.6) {
    return { lead: '', headline: clean }
  }
  const lead = clean.slice(0, sentenceEnd + 1).trim()
  const headline = clean.slice(sentenceEnd + 1).trim()
  if (!headline) return { lead: '', headline: clean }
  return { lead, headline }
}
