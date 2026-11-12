import { usePipeline } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import type { ContentItem } from '../api/types'
import './bancoDePautas.css'

const TERRITORY_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'TRANS']

export default function BancoDePautas() {
  const pipeline = usePipeline()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const backlog = pipeline.data.contents.filter((c) => c.status === 'backlog')

  const byTerritory = backlog.reduce<Record<string, ContentItem[]>>((acc, c) => {
    const t = c.territory ?? '—'
    acc[t] = acc[t] ?? []
    acc[t].push(c)
    return acc
  }, {})

  const territories = Object.keys(byTerritory).sort(
    (a, b) => TERRITORY_ORDER.indexOf(a) - TERRITORY_ORDER.indexOf(b),
  )

  return (
    <div>
      <PageHeader title="Banco de pautas" subtitle={`${backlog.length} ideias no backlog, por território`} />

      {territories.map((t) => (
        <section className="section" key={t}>
          <h2>{byTerritory[t][0]?.territoryLabel ?? t}</h2>
          <div className="pauta-grid">
            {byTerritory[t].map((c) => (
              <Card key={c.id} className="pauta-card">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.editorialFunction ?? 'função não definida'}</span>
                {c.scientificPackage && (
                  <span className={`package-tag package-${c.scientificPackageStatus}`}>
                    {c.scientificPackage} · {statusLabel(c.scientificPackageStatus)}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function statusLabel(s?: string | null) {
  if (s === 'frozen') return 'congelado'
  if (s === 'produced') return 'rascunho'
  if (s === 'pending') return 'pendente'
  return s ?? ''
}
