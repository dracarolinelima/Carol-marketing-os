import { usePipeline } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/shared'
import type { ContentItem } from '../api/types'
import './calendario.css'

export default function Calendario() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const withDate = pipeline.data.contents
    .filter((c) => c.publishDate)
    .sort((a, b) => (a.publishDate! < b.publishDate! ? -1 : 1))

  const withWeekOnly = pipeline.data.contents.filter((c) => !c.publishDate && c.plannedWeek)

  const byMonth = withDate.reduce<Record<string, ContentItem[]>>((acc, c) => {
    const month = c.publishDate!.slice(0, 7)
    acc[month] = acc[month] ?? []
    acc[month].push(c)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Cronograma"
        subtitle="Somente leitura por enquanto — arrastar para reagendar e persistir data/hora entra na próxima etapa (Fase 2)."
      />

      {Object.keys(byMonth).length === 0 && <Card>Nenhum conteúdo com data de publicação registrada.</Card>}

      {Object.entries(byMonth).map(([month, items]) => (
        <section className="section" key={month}>
          <h2>{formatMonth(month)}</h2>
          <div className="timeline">
            {items.map((c) => (
              <Card key={c.id} className="timeline-item">
                <span className="timeline-date">{formatDay(c.publishDate!)}</span>
                <div className="timeline-body">
                  <strong>{c.title}</strong>
                  <span className="content-meta">{c.territoryLabel ?? c.territory}</span>
                </div>
                <StatusBadge status={c.status} />
              </Card>
            ))}
          </div>
        </section>
      ))}

      {withWeekOnly.length > 0 && (
        <section className="section">
          <h2>Com semana planejada, sem data exata</h2>
          <div className="timeline">
            {withWeekOnly.map((c) => (
              <Card key={c.id} className="timeline-item">
                <span className="timeline-date timeline-date-week">{c.plannedWeek}</span>
                <div className="timeline-body">
                  <strong>{c.title}</strong>
                  <span className="content-meta">{c.territoryLabel ?? c.territory}</span>
                </div>
                <StatusBadge status={c.status} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function formatDay(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
