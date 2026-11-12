import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePipeline } from '../api/usePipeline'
import { getCopy } from '../api/copyClient'
import { ErrorState, LoadingState, PageHeader } from '../components/shared'
import { drawCard, splitLeadHeadline } from '../estudio/drawCard'
import type { ContentItem } from '../api/types'
import './previaFeed.css'

export default function PreviaFeed() {
  const pipeline = usePipeline()
  const [fontsReady, setFontsReady] = useState(false)
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [coverTexts, setCoverTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  const feed = (pipeline.data?.contents ?? [])
    .filter((c) => c.status === 'publicado' || (c.status === 'pronto' && c.publishDate))
    .sort((a, b) => (b.publishDate ?? '').localeCompare(a.publishDate ?? ''))

  useEffect(() => {
    feed.forEach((c) => {
      if (coverTexts[c.id] !== undefined) return
      getCopy(c.id)
        .then((view) => {
          const text = view.content.cards[0]?.text ?? c.title
          setCoverTexts((prev) => ({ ...prev, [c.id]: text }))
        })
        .catch(() => setCoverTexts((prev) => ({ ...prev, [c.id]: c.title })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline.data])

  useEffect(() => {
    if (!fontsReady) return
    feed.forEach((c) => {
      const canvas = canvasRefs.current[c.id]
      const text = coverTexts[c.id]
      if (canvas && text) {
        const { lead, headline } = splitLeadHeadline(text)
        drawCard(canvas, { num: 1, total: 1, lead, headline, variant: 'capa', headlineFont: 'playfair' })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsReady, coverTexts])

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  return (
    <div>
      <PageHeader
        title="Prévia do feed"
        subtitle="Grade por data, com a capa real de cada conteúdo (card 1 da copy aprovada). Ainda sem imagens/fotos — só a composição de texto do Estúdio de arte."
      />
      <div className="feed-grid">
        {feed.map((c: ContentItem) => (
          <Link key={c.id} to={`/app/conteudo/${encodeURIComponent(c.id)}`} className="feed-tile-link">
            <div className="feed-tile">
              <canvas
                ref={(el) => {
                  canvasRefs.current[c.id] = el
                }}
                className="feed-tile-canvas"
              />
              <div className="feed-tile-overlay">
                <span className={'feed-tile-status' + (c.status === 'publicado' ? ' is-published' : ' is-scheduled')}>
                  {c.status === 'publicado' ? 'Publicado' : 'Programado'}
                </span>
                <span className="feed-tile-date">{c.publishDate ?? ''}</span>
              </div>
            </div>
          </Link>
        ))}
        {feed.length === 0 && <p>Nenhum conteúdo publicado ou programado com data.</p>}
      </div>
    </div>
  )
}
