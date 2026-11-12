import { useEffect, useState } from 'react'
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

interface FeedPost {
  permalink: string
  timestamp: string
  type: string
  caption: string
  reach: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
}

interface FeedResponse {
  fetchedAt: string
  source: string
  posts: FeedPost[]
}

export default function Analise() {
  const pipeline = usePipeline()
  const [feed, setFeed] = useState<FeedResponse | null>(null)
  const [feedError, setFeedError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/instagram-feed')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setFeed)
      .catch((e) => setFeedError(String(e.message || e)))
  }, [])

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const published = pipeline.data.contents.filter((c) => c.status === 'publicado')
  const withMetrics = published.filter((c) => (c.metrics?.snapshots as Snapshot[] | undefined)?.length)
  const withoutMetrics = published.filter((c) => !(c.metrics?.snapshots as Snapshot[] | undefined)?.length)

  const trackedPermalinks = new Set(published.map((c) => c.postUrl).filter(Boolean))

  return (
    <div>
      <PageHeader
        title="Análise"
        subtitle="Métricas reais importadas do Metricool/Windsor (consulta manual em sessão do Claude — ver INTEGRATIONS.md). Sem automação diária ainda."
      />

      <section className="section">
        <h2>
          Últimos posts reais no Instagram ({feed?.posts.length ?? '…'})
          {feed && <span className="analytics-fetched-at"> · consultado em {formatDateTime(feed.fetchedAt)}</span>}
        </h2>
        {feedError && <Card>Não consegui carregar o feed real ({feedError}).</Card>}
        {!feed && !feedError && <LoadingState />}
        {feed && (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Data</th>
                  <th>Alcance</th>
                  <th>Views</th>
                  <th>Curtidas</th>
                  <th>Coment.</th>
                  <th>Salvos</th>
                  <th>No Marketing OS?</th>
                </tr>
              </thead>
              <tbody>
                {feed.posts.map((p) => (
                  <tr key={p.permalink}>
                    <td className="analytics-title-cell">
                      <a href={p.permalink} target="_blank" rel="noreferrer">
                        {p.caption.slice(0, 50)}
                        {p.caption.length > 50 ? '…' : ''}
                      </a>
                    </td>
                    <td>{p.timestamp.slice(0, 10)}</td>
                    <td>{fmt(p.reach)}</td>
                    <td>{fmt(p.views)}</td>
                    <td>{fmt(p.likes)}</td>
                    <td>{fmt(p.comments)}</td>
                    <td>{fmt(p.saves)}</td>
                    <td>
                      {trackedPermalinks.has(p.permalink) ? (
                        <span className="tracked-yes">rastreado</span>
                      ) : (
                        <span className="tracked-no">fora do pipeline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="analytics-disclaimer">
          Vem direto do Instagram via Windsor, não do pipeline — por isso pode incluir posts que não passaram pelo
          fluxo editorial do Marketing OS (enquetes, bastidores, etc.) e não mostrar publicações do pipeline com mais
          de 30 dias (limite do plano atual do Windsor).
        </p>
      </section>

      <section className="section">
        <h2>Conteúdos do Marketing OS com métrica registrada ({withMetrics.length})</h2>
        {withMetrics.length === 0 && <Card>Nenhuma métrica registrada ainda.</Card>}
        {withMetrics.length > 0 && (
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
        )}
        <p className="analytics-disclaimer">
          Valores acumulados desde a publicação, não métricas diárias. Amostra pequena: não tratar como estimativa
          estatística, só como observação pontual (Marketing Core §16).
        </p>
      </section>

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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
