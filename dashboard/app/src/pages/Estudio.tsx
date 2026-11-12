import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { usePipeline } from '../api/usePipeline'
import { getCopy, type CopyCard } from '../api/copyClient'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import { canvasToPngBlob, drawCard, type CardData, type CardVariant } from '../estudio/drawCard'
import './estudio.css'

function variantFor(index: number, total: number): CardVariant {
  if (index === 0) return 'capa'
  if (index === total - 1) return 'fechamento'
  return 'corpo'
}

export default function Estudio() {
  const pipeline = usePipeline()
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
          sourceCards.map((c, i) => ({
            num: c.num,
            total,
            text: c.text,
            variant: variantFor(i, total),
          })),
        )
      })
      .catch((e) => setCopyError(String(e.message || e)))
  }

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

  function updateText(i: number, text: string) {
    if (!cards) return
    const next = cards.slice()
    next[i] = { ...next[i], text }
    setCards(next)
  }

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const candidates = pipeline.data.contents.filter((c) => c.status !== 'backlog' && c.status !== 'arquivado')

  return (
    <div>
      <PageHeader
        title="Estúdio de arte"
        subtitle="Editor próprio: gera os 6 cards a partir da copy aprovada, texto editável, exporta PNG 1080×1440 direto do navegador."
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
              <textarea
                value={cards[editIndex].text}
                onChange={(e) => updateText(editIndex, e.target.value)}
                rows={10}
              />
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
