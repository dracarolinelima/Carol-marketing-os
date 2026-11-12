// Renderizador de cards do carrossel — canvas 2D, fiel ao Design System
// (mos-art-director.md): paleta de 7 cores, Cormorant Garamond + Montserrat,
// espaçamento generoso, radius 0 em blocos editoriais.
//
// Desenho e exportação usam exatamente a mesma função: o que aparece na
// prévia é, pixel a pixel, o que vira PNG.

export const CANVAS_W = 1080
export const CANVAS_H = 1440
const MARGIN_X = 96
const SAFE_TOP = 140
const SAFE_BOTTOM = 140

const COLORS = {
  aubergine: '#4A1C3C',
  bordo: '#3D1228',
  terracota: '#A0604A',
  bege: '#F5EFE6',
  brancoQuebrado: '#FAF7F2',
  dourado: '#B08D57',
}

export type CardVariant = 'capa' | 'corpo' | 'fechamento'

export interface CardData {
  num: number
  total: number
  text: string
  variant: CardVariant
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const out: string[] = []
  paragraphs.forEach((p, i) => {
    if (i > 0) out.push('') // marcador de parágrafo (linha em branco)
    out.push(...wrapParagraph(ctx, p.replace(/\n/g, ' '), maxWidth))
  })
  return out
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontWeight: number,
  fontFamily: string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
  lineHeightRatio: number,
): { size: number; lines: string[]; lineHeight: number } {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `${fontWeight} ${size}px "${fontFamily}"`
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = size * lineHeightRatio
    const blankCount = lines.filter((l) => l === '').length
    const totalHeight = (lines.length - blankCount) * lineHeight + blankCount * (lineHeight * 0.6)
    if (totalHeight <= maxHeight || size === minSize) {
      return { size, lines, lineHeight }
    }
  }
  ctx.font = `${fontWeight} ${minSize}px "${fontFamily}"`
  return { size: minSize, lines: wrapText(ctx, text, maxWidth), lineHeight: minSize * lineHeightRatio }
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData) {
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isDark = data.variant === 'capa' || data.variant === 'fechamento'
  const bg = isDark ? COLORS.aubergine : COLORS.bege
  const fg = isDark ? COLORS.brancoQuebrado : COLORS.aubergine

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Index tag
  ctx.font = '500 22px "Montserrat"'
  ctx.fillStyle = isDark ? 'rgba(250,247,242,0.55)' : COLORS.dourado
  ctx.textBaseline = 'alphabetic'
  const tag = `${String(data.num).padStart(2, '0')} / ${String(data.total).padStart(2, '0')}`
  ctx.fillText(tag.toUpperCase(), MARGIN_X, 80)

  // Thin rule under tag
  ctx.strokeStyle = isDark ? 'rgba(176,141,87,0.4)' : COLORS.dourado
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(MARGIN_X, 100)
  ctx.lineTo(MARGIN_X + 48, 100)
  ctx.stroke()

  const maxWidth = CANVAS_W - MARGIN_X * 2
  const maxHeight = CANVAS_H - SAFE_TOP - SAFE_BOTTOM

  const fontFamily = isDark ? 'Cormorant Garamond' : 'Montserrat'
  const fontWeight = isDark ? 500 : 400
  const startSize = isDark ? 76 : 46
  const minSize = isDark ? 44 : 30
  const lineHeightRatio = isDark ? 1.12 : 1.42

  const { lines, size, lineHeight } = fitFontSize(
    ctx,
    data.text,
    fontWeight,
    fontFamily,
    maxWidth,
    maxHeight,
    startSize,
    minSize,
    lineHeightRatio,
  )

  ctx.font = `${fontWeight} ${size}px "${fontFamily}"`
  ctx.fillStyle = fg

  const blankCount = lines.filter((l) => l === '').length
  const totalHeight = (lines.length - blankCount) * lineHeight + blankCount * (lineHeight * 0.6)
  let y = SAFE_TOP + (maxHeight - totalHeight) / 2 + lineHeight * 0.8

  for (const line of lines) {
    if (line === '') {
      y += lineHeight * 0.6
      continue
    }
    ctx.fillText(line, MARGIN_X, y)
    y += lineHeight
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
