import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { usePipeline } from '../api/usePipeline'
import { getCopy, type CopyCard } from '../api/copyClient'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import {
  canvasToPngBlob,
  drawCard,
  splitLeadHeadline,
  type CardData,
  type CardVariant,
  type HeadlineFont,
} from '../estudio/drawCard'
import './estudio.css'

function variantFor(index: number, total: number): CardVariant {
  if (index === 0) return 'capa'
  if (index === total - 1) return 'fechamento'
  return 'corpo'
}

export default function Estudio() {
  const pipeline = usePipeline()
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cards, setCards] = useState<CardData[] | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  function loadContent(id: string) {
    setSelectedId(id)
    setCopyError(null)
    setCards(null)
    getCopy(id)
      .then((view) => {
        const sourceCards: CopyCard[] = view.content.cards.length
          ? view.content.cards
          : [{ num: 1, label: null, text: '(sem cards na copy — edite aqui)' }]
        const total = sourceCards.length
        setCards(
          sourceCards.map((c, i) => {
            const { lead, headline } = splitLeadHeadline(c.text)
            const variant = variantFor(i, total)
            return {
              num: c.num,
              total,
              lead,
              headline,
              variant,
              headlineFont: variant === 'corpo' ? 'cormorant' : 'playfair',
            }
          }),
        )
      })
      .catch((e) => setCopyError(String(e.message || e)))
  }

  useEffect(() => {
    const preselect = searchParams.get('id')
    if (preselect) loadContent(preselect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!cards || !fontsReady) return
    cards.forEach((card, i) => {
      const canvas = canvasRefs.current[i]
      if (canvas) drawCard(canvas, card)
    })
  }, [cards, fontsReady])

  async function exportCard(i: number) {
    const canvas = canvasRefs.current[i]
    if (!canvas) return
    const blob = await canvasToPngBlob(canvas)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedId}-card${i + 1}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  function patchCard(i: number, patch: Partial<CardData>) {
    if (!cards) return
    const next = cards.slice()
    next[i] = { ...next[i], ...patch }
    setCards(next)
  }

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const candidates = pipeline.data.contents.filter((c) => c.status !== 'backlog' && c.status !== 'arquivado')

  return (
    <div>
      <PageHeader
        title="Estúdio de arte"
        subtitle="Segue design-dra-caroline: paleta, Playfair Display + Montserrat, abertura + destaque, traço dourado, rodapé de assinatura. 1080×1440 (3:4). Fundo aubergine sem foto por enquanto — upload de foto do ChatGPT é a próxima etapa."
      />

      <Card className="studio-picker">
        <label>
          Conteúdo
          <select value={selectedId ?? ''} onChange={(e) => e.target.value && loadContent(e.target.value)}>
            <option value="">Escolher…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {copyError && <ErrorState message={copyError} />}

      {cards && (
        <div className="studio-layout">
          <div className="studio-grid">
            {cards.map((_card, i) => (
              <div className="studio-card-wrap" key={i}>
                <canvas
                  ref={(el) => {
                    canvasRefs.current[i] = el
                  }}
                  className="studio-canvas"
                  onClick={() => setEditIndex(i)}
                />
                <div className="studio-card-actions">
                  <span>Card {i + 1}</span>
                  <button className="icon-btn" onClick={() => exportCard(i)} aria-label="Exportar PNG">
                    <Download size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editIndex !== null && cards[editIndex] && (
            <aside className="studio-editor">
              <h2>Editando card {editIndex + 1}</h2>

              <label className="studio-field-label">
                Abertura (pequena, Montserrat — opcional)
                <textarea
                  value={cards[editIndex].lead}
                  onChange={(e) => patchCard(editIndex, { lead: e.target.value })}
                  rows={3}
                />
              </label>

              <label className="studio-field-label">
                Destaque (grande — só as palavras de identificação)
                <textarea
                  value={cards[editIndex].headline}
                  onChange={(e) => patchCard(editIndex, { headline: e.target.value })}
                  rows={5}
                />
              </label>

              <label className="studio-field-label">
                Fonte do destaque
                <select
                  value={cards[editIndex].headlineFont}
                  onChange={(e) => patchCard(editIndex, { headlineFont: e.target.value as HeadlineFont })}
                >
                  <option value="playfair">Playfair Display (padrão do feed)</option>
                  <option value="cormorant">Cormorant Garamond (editorial)</option>
                </select>
              </label>

              <label className="studio-field-label">
                Fundo
                <select
                  value={cards[editIndex].variant}
                  onChange={(e) => patchCard(editIndex, { variant: e.target.value as CardVariant })}
                >
                  <option value="capa">Escuro (aubergine)</option>
                  <option value="corpo">Claro (off-white)</option>
                  <option value="fechamento">Escuro (fechamento)</option>
                </select>
              </label>

              <button className="studio-close-edit" onClick={() => setEditIndex(null)}>
                Fechar
              </button>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
