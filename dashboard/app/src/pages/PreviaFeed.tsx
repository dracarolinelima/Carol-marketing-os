import { usePipeline } from '../api/usePipeline'
import { ErrorState, LoadingState, PageHeader } from '../components/shared'
import './previaFeed.css'

export default function PreviaFeed() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const feed = pipeline.data.contents
    .filter((c) => c.status === 'publicado' || (c.status === 'pronto' && c.publishDate))
    .sort((a, b) => (b.publishDate ?? '').localeCompare(a.publishDate ?? ''))

  return (
    <div>
      <PageHeader
        title="Prévia do feed"
        subtitle="Grade por data. Sem imagens reais ainda — o Estúdio de arte (R6) é quem vai gerar as capas; por enquanto, cada quadro mostra o título e o status."
      />
      <div className="feed-grid">
        {feed.map((c) => (
          <div key={c.id} className={'feed-tile' + (c.status === 'publicado' ? ' feed-tile-published' : ' feed-tile-scheduled')}>
            <span className="feed-tile-status">{c.status === 'publicado' ? 'Publicado' : 'Programado'}</span>
            <strong>{c.title}</strong>
            <span className="feed-tile-date">{c.publishDate ?? ''}</span>
          </div>
        ))}
        {feed.length === 0 && <p>Nenhum conteúdo publicado ou programado com data.</p>}
      </div>
    </div>
  )
}
