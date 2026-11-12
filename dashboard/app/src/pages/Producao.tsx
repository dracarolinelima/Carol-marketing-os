import { usePipeline } from '../api/usePipeline'
import { ContentCard, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/shared'
import type { ContentItem } from '../api/types'
import './producao.css'

const COLUMNS: { status: string; label: string }[] = [
  { status: 'selecionado', label: 'Selecionado' },
  { status: 'em-desenvolvimento', label: 'Em desenvolvimento' },
  { status: 'em-producao', label: 'Em produção' },
  { status: 'revisao', label: 'Em revisão' },
]

export default function Producao() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const byStatus = pipeline.data.contents.reduce<Record<string, ContentItem[]>>((acc, c) => {
    acc[c.status] = acc[c.status] ?? []
    acc[c.status].push(c)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title="Produção" subtitle="Conteúdos em andamento, por etapa do fluxo" />
      <div className="kanban">
        {COLUMNS.map(({ status, label }) => (
          <div className="kanban-col" key={status}>
            <h2>
              {label} <span className="kanban-count">{byStatus[status]?.length ?? 0}</span>
            </h2>
            <div className="kanban-items">
              {(byStatus[status] ?? []).map((c) => (
                <ContentCard key={c.id} id={c.id} className="kanban-card">
                  <strong>{c.title}</strong>
                  <span className="content-meta">{c.territoryLabel ?? c.territory}</span>
                  <div className="kanban-card-bottom">
                    <StatusBadge status={c.status} />
                    {c.currentOwner && <span className="owner-tag">{c.currentOwner}</span>}
                  </div>
                </ContentCard>
              ))}
              {(byStatus[status] ?? []).length === 0 && <span className="kanban-empty">Vazio</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
