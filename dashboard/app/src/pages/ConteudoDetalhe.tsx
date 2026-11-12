import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getContent } from '../api/client'
import { getCopy, type CopyView } from '../api/copyClient'
import {
  approveAngleToCreator,
  approveToReady,
  archiveContent,
  requestBriefAdjustment,
  returnToCreator,
  unscheduleContent,
  updateBasicFields,
} from '../api/handoff'
import { Card, ErrorState, LoadingState, StatusBadge } from '../components/shared'
import type { ContentItem } from '../api/types'
import './conteudoDetalhe.css'

const TERRITORY_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'TRANS']
const FORMAT_OPTIONS = ['Carrossel 6 cards', 'Reel', 'Stories', 'Post único']

export default function ConteudoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<ContentItem | null>(null)
  const [copy, setCopy] = useState<CopyView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [showArchiveForm, setShowArchiveForm] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  function load() {
    if (!id) return
    getContent(id)
      .then(setItem)
      .catch((e) => setError(String(e.message || e)))
    getCopy(id)
      .then(setCopy)
      .catch(() => setCopy(null))
  }

  useEffect(load, [id])

  async function runAction(fn: () => Promise<ContentItem>, successMsg: string) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      setFlash(successMsg)
      setNote('')
      setShowReturnForm(false)
      setShowArchiveForm(false)
      load()
      setTimeout(() => setFlash(null), 4000)
    } catch (e) {
      setError(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  if (error && !item) return <ErrorState message={error} />
  if (!item) return <LoadingState />

  const canActOnPending = item.pendingType && item.pendingType !== 'nenhuma' && item.currentOwner === 'Caroline'

  return (
    <div className="detail-page">
      <Link to="/app/" className="back-link" onClick={(e) => { e.preventDefault(); navigate(-1) }}>
        <ArrowLeft size={14} strokeWidth={1.5} /> Voltar
      </Link>

      <div className="detail-header">
        <StatusBadge status={item.status} />
        <span className="detail-id">{item.id}</span>
      </div>
      <h1 className="detail-title">{item.title}</h1>

      {flash && <div className="detail-flash">{flash}</div>}
      {error && <div className="detail-error">{error}</div>}

      <div className="detail-meta-grid">
        <MetaField label="Território" value={item.territoryLabel ?? item.territory ?? '—'} />
        <MetaField label="Função editorial" value={item.editorialFunction ?? '—'} />
        <MetaField label="Jornada" value={item.journeyStage ?? '—'} />
        <MetaField label="Formato" value={item.format ?? '—'} />
        <MetaField
          label="Pacote científico"
          value={item.scientificPackage ? `${item.scientificPackage} (${item.scientificPackageStatus ?? '—'})` : '—'}
        />
        <MetaField label="Dono atual" value={item.currentOwner ?? 'ninguém'} />
        <MetaField label="Pendência" value={item.pendingType && item.pendingType !== 'nenhuma' ? item.pendingType : 'nenhuma'} />
        <MetaField label="Data de publicação" value={item.publishDate ?? '—'} />
      </div>

      {item.postUrl && (
        <a className="detail-post-link" href={item.postUrl} target="_blank" rel="noreferrer">
          Ver no Instagram →
        </a>
      )}

      {item.publishDate && (
        <button
          className="detail-secondary-btn"
          disabled={busy}
          onClick={() =>
            runAction(() => unscheduleContent(item.id, item.revision), 'Data removida — voltou para não agendados.')
          }
        >
          Remover do Cronograma
        </button>
      )}

      <section className="detail-section">
        <h2>Ação</h2>

        {!canActOnPending && (
          <Card>
            {item.pendingType === 'nenhuma' || !item.pendingType
              ? `Sem pendência ativa agora. ${item.currentOwner ? `Com ${item.currentOwner}.` : ''}`
              : `Pendência (${item.pendingType}) está com ${item.currentOwner}, não com você.`}
          </Card>
        )}

        {canActOnPending && item.pendingType === 'aprovacao' && (
          <div className="detail-actions">
            <button
              className="detail-primary-btn"
              disabled={busy}
              onClick={() => runAction(() => approveToReady(item.id, item.revision), 'Aprovado — status "pronto".')}
            >
              Aprovar
            </button>
            <button className="detail-secondary-btn" disabled={busy} onClick={() => setShowReturnForm((v) => !v)}>
              Devolver para o Creator
            </button>
          </div>
        )}

        {canActOnPending && item.pendingType === 'decisao' && (
          <div className="detail-actions">
            <button
              className="detail-primary-btn"
              disabled={busy}
              onClick={() => runAction(() => approveAngleToCreator(item.id, item.revision, note || undefined), 'Ângulo aprovado — enviado para o Creator.')}
            >
              Aprovar ângulo, enviar para o Creator
            </button>
            <button className="detail-secondary-btn" disabled={busy} onClick={() => setShowReturnForm((v) => !v)}>
              Pedir ajuste no brief
            </button>
          </div>
        )}

        {showReturnForm && (
          <div className="detail-note-form">
            <textarea
              placeholder="Motivo (obrigatório)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <button
              className="detail-primary-btn"
              disabled={busy || !note.trim()}
              onClick={() =>
                runAction(
                  () =>
                    item.pendingType === 'decisao'
                      ? requestBriefAdjustment(item.id, item.revision, note.trim())
                      : returnToCreator(item.id, item.revision, note.trim()),
                  'Devolvido com a nota registrada.',
                )
              }
            >
              Confirmar devolução
            </button>
          </div>
        )}
      </section>

      {item.status === 'backlog' && (
        <EditBasicFields item={item} onSaved={load} />
      )}

      {copy && copy.content.cards.length > 0 && (
        <section className="detail-section">
          <h2>Copy {copy.editable ? '' : '(publicada, somente leitura)'}</h2>
          <div className="detail-copy-cards">
            {copy.content.cards.map((c) => (
              <Card key={c.num} className="detail-copy-card">
                <span className="detail-copy-num">Card {c.num}{c.label ? ` — ${c.label}` : ''}</span>
                <p>{c.text}</p>
              </Card>
            ))}
          </div>
          {copy.content.caption && (
            <Card className="detail-copy-card">
              <span className="detail-copy-num">Legenda</span>
              <p>{copy.content.caption}</p>
            </Card>
          )}
          <Link to={`/app/estudio?id=${item.id}`} className="detail-studio-link">
            Abrir no Estúdio de arte →
          </Link>
        </section>
      )}

      <section className="detail-section">
        <h2>Histórico</h2>
        <div className="detail-history">
          {(item.history ?? [])
            .slice()
            .reverse()
            .map((h, i) => (
              <div className="detail-history-item" key={i}>
                <span className="detail-history-date">{h.timestamp?.slice(0, 10)}</span>
                <div>
                  <strong>{h.agent ?? 'sistema'}</strong>
                  {h.to && <span className="content-meta"> → {h.to}</span>}
                  {h.note && <p>{h.note}</p>}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="detail-section">
        <h2>Arquivar</h2>
        {!showArchiveForm && (
          <button className="detail-danger-btn" onClick={() => setShowArchiveForm(true)}>
            Arquivar este conteúdo
          </button>
        )}
        {showArchiveForm && (
          <div className="detail-note-form">
            <textarea
              placeholder="Motivo do arquivamento (obrigatório)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <div className="detail-actions">
              <button
                className="detail-danger-btn"
                disabled={busy || !note.trim()}
                onClick={() => runAction(() => archiveContent(item.id, item.revision, note.trim()), 'Arquivado.')}
              >
                Confirmar arquivamento
              </button>
              <button className="detail-secondary-btn" onClick={() => setShowArchiveForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-field">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}

function EditBasicFields({ item, onSaved }: { item: ContentItem; onSaved: () => void }) {
  const [title, setTitle] = useState(item.title)
  const [territory, setTerritory] = useState(item.territory ?? 'B')
  const [format, setFormat] = useState(item.format ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateBasicFields(item.id, item.revision, { title, territory, format: format || null })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="detail-section">
      <h2>Editar (ainda em backlog)</h2>
      <Card className="detail-edit-card">
        <label>
          Título
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Território
          <select value={territory ?? ''} onChange={(e) => setTerritory(e.target.value)}>
            {TERRITORY_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Formato
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">—</option>
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <button className="detail-primary-btn" disabled={saving} onClick={save}>
          Salvar
        </button>
      </Card>
    </section>
  )
}
