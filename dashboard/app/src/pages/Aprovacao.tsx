import { usePipeline } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import './aprovacao.css'

export default function Aprovacao() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const pending = pipeline.data.contents.filter((c) => c.pendingType && c.pendingType !== 'nenhuma')

  return (
    <div>
      <PageHeader title="Aprovação" subtitle={`${pending.length} conteúdo(s) aguardando sua decisão`} />

      {pending.length === 0 && <Card>Nada aguardando aprovação agora.</Card>}

      <div className="approval-list">
        {pending.map((c) => {
          const lastNote = c.history?.[c.history.length - 1]?.note
          return (
            <Card key={c.id} className="approval-card">
              <div className="approval-top">
                <strong>{c.title}</strong>
                <span className={`pending-tag pending-${c.pendingType}`}>{c.pendingType}</span>
              </div>
              <span className="content-meta">
                {c.territoryLabel ?? c.territory} · {c.editorialFunction ?? '—'} · pacote {c.scientificPackage ?? '—'}
              </span>
              {lastNote && <p className="approval-note">{lastNote}</p>}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
