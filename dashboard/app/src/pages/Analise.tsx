import { usePipeline } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import type { ContentItem } from '../api/types'
import './analise.css'

interface Snapshot {
  date: string
  source: string
  reach: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  note?: string | null
}

export default function Analise() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const published = pipeline.data.contents.filter((c) => c.status === 'publicado')
  const withMetrics = published.filter((c) => (c.metrics?.snapshots as Snapshot[] | undefined)?.length)
  const withoutMetrics = published.filter((c) => !(c.metrics?.snapshots as Snapshot[] | undefined)?.length)

  return (
    <div>
      <PageHeader
        title="Análise"
        subtitle="Métricas reais importadas do Metricool (consulta manual em sessão do Claude — ver INTEGRATIONS.md). Sem automação diária ainda; cada linha mostra a data em que foi coletada."
      />

      {withMetrics.length === 0 && <Card>Nenhuma métrica registrada ainda.</Card>}

      {withMetrics.length > 0 && (
        <section className="section">
          <h2>Publicados com métrica ({withMetrics.length})</h2>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Conteúdo</th>
                  <th>Publicado</th>
                  <th>Alcance</th>
                  <th>Views</th>
                  <th>Curtidas</th>
                  <th>Coment.</th>
                  <th>Compart.</th>
                  <th>Salvos</th>
                  <th>Coletado em</th>
                </tr>
              </thead>
              <tbody>
                {withMetrics
                  .slice()
                  .sort((a, b) => (b.publishDate ?? '').localeCompare(a.publishDate ?? ''))
                  .map((c) => {
                    const snaps = c.metrics!.snapshots as unknown as Snapshot[]
                    const latest = snaps[snaps.length - 1]
                    return (
                      <tr key={c.id}>
                        <td className="analytics-title-cell">{c.title}</td>
                        <td>{c.publishDate}</td>
                        <td>{fmt(latest.reach)}</td>
                        <td>{fmt(latest.views)}</td>
                        <td>{fmt(latest.likes)}</td>
                        <td>{fmt(latest.comments)}</td>
                        <td>{fmt(latest.shares)}</td>
                        <td>{fmt(latest.saves)}</td>
                        <td className="analytics-meta-cell">{latest.date} · {latest.source}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          <p className="analytics-disclaimer">
            Valores acumulados desde a publicação, não métricas diárias — ainda não há histórico de snapshots
            suficiente para mostrar evolução ao longo do tempo. Amostra pequena (3 publicações): não tratar como
            estimativa estatística, só como observação pontual (Marketing Core §16).
          </p>
        </section>
      )}

      {withoutMetrics.length > 0 && (
        <section className="section">
          <h2>Publicados sem métrica coletada ({withoutMetrics.length})</h2>
          <div className="content-grid">
            {withoutMetrics.map((c: ContentItem) => (
              <Card key={c.id} className="content-card">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.publishDate ?? 'data não registrada'}</span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function fmt(n: number | null): string {
  return n === null || n === undefined ? '—' : n.toLocaleString('pt-BR')
}
