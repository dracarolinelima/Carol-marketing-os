import { usePipeline } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import './programar.css'

export default function Programar() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const ready = pipeline.data.contents.filter((c) => c.status === 'pronto')
  const scheduled = ready.filter((c) => c.publishDate).sort((a, b) => (a.publishDate! < b.publishDate! ? -1 : 1))
  const unscheduled = ready.filter((c) => !c.publishDate)

  return (
    <div>
      <PageHeader
        title="Programar posts"
        subtitle="Fila de aprovados. Agendamento automático (Metricool) depende de decisão sobre plano e piloto — ver ROADMAP Fase 4."
      />

      <section className="section">
        <h2>Programados ({scheduled.length})</h2>
        {scheduled.length === 0 && <Card>Nenhum conteúdo aprovado com data definida.</Card>}
        <div className="schedule-list">
          {scheduled.map((c) => (
            <Card key={c.id} className="schedule-item">
              <span className="schedule-date">{formatDay(c.publishDate!)}</span>
              <div className="schedule-body">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.territoryLabel ?? c.territory} · {c.format ?? 'formato não definido'}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Aprovados, sem data definida ({unscheduled.length})</h2>
        {unscheduled.length === 0 && <Card>Nenhum.</Card>}
        <div className="schedule-list">
          {unscheduled.map((c) => (
            <Card key={c.id} className="schedule-item">
              <span className="schedule-date schedule-date-empty">—</span>
              <div className="schedule-body">
                <strong>{c.title}</strong>
                <span className="content-meta">
                  {c.territoryLabel ?? c.territory} · defina a data no Cronograma
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function formatDay(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
