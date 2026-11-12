import { useEffect, useState } from 'react'
import { getPipeline } from '../api/client'
import { createContent } from '../api/content'
import { Card, ContentCard, ErrorState, LoadingState, PageHeader } from '../components/shared'
import type { ContentItem, Pipeline } from '../api/types'
import './bancoDePautas.css'

const TERRITORY_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'TRANS']
const TERRITORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'A', label: 'A — Dor/endometriose/adenomiose' },
  { value: 'B', label: 'B — Perimenopausa/menopausa' },
  { value: 'C', label: 'C — Histeroscopia/pólipos' },
  { value: 'D', label: 'D — Fertilidade' },
  { value: 'E', label: 'E — Contracepção' },
  { value: 'F', label: 'F — SOP/metabolismo' },
  { value: 'TRANS', label: 'Transversal' },
]
const FORMAT_OPTIONS = ['Carrossel 6 cards', 'Reel', 'Stories', 'Post único']

export default function BancoDePautas() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [territory, setTerritory] = useState('B')
  const [format, setFormat] = useState('')
  const [saving, setSaving] = useState(false)
  const [justCreated, setJustCreated] = useState<string | null>(null)

  function load() {
    getPipeline()
      .then(setPipeline)
      .catch((e) => setError(String(e.message || e)))
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const created = await createContent({ title: title.trim(), territory, format: format || undefined })
      setTitle('')
      setFormat('')
      setJustCreated(created.title)
      load()
      setTimeout(() => setJustCreated(null), 4000)
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} />
  if (!pipeline) return <LoadingState />

  const backlog = pipeline.contents.filter((c) => c.status === 'backlog')

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

      <Card className="pauta-form-card">
        <form onSubmit={handleCreate} className="pauta-form">
          <input
            type="text"
            placeholder="Nova ideia de pauta…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="pauta-input"
          />
          <select value={territory} onChange={(e) => setTerritory(e.target.value)}>
            {TERRITORY_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Formato (opcional)</option>
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving || !title.trim()}>
            Adicionar ao backlog
          </button>
        </form>
        {justCreated && (
          <p className="pauta-created-notice">
            "{justCreated}" criada — já aparece aqui, na Produção e no Cronograma assim que ganhar data.
          </p>
        )}
      </Card>

      {territories.map((t) => (
        <section className="section" key={t}>
          <h2>{byTerritory[t][0]?.territoryLabel ?? t}</h2>
          <div className="pauta-grid">
            {byTerritory[t].map((c) => (
              <ContentCard key={c.id} id={c.id} className="pauta-card">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.editorialFunction ?? 'função não definida'}</span>
                {c.scientificPackage && (
                  <span className={`package-tag package-${c.scientificPackageStatus}`}>
                    {c.scientificPackage} · {statusLabel(c.scientificPackageStatus)}
                  </span>
                )}
              </ContentCard>
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
