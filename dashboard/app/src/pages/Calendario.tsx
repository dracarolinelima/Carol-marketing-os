import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getPipeline } from '../api/client'
import { patchContentDate } from '../api/content'
import { unscheduleContent } from '../api/handoff'
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/shared'
import type { ContentItem, Pipeline } from '../api/types'
import './calendario.css'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const SCHEDULABLE_STATUSES = ['em-producao', 'revisao', 'pronto']

export default function Calendario() {
  const navigate = useNavigate()
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [dragId, setDragId] = useState<string | null>(null)

  function load() {
    getPipeline()
      .then(setPipeline)
      .catch((e) => setError(String(e.message || e)))
  }

  useEffect(load, [])

  if (error) return <ErrorState message={error} />
  if (!pipeline) return <LoadingState />

  const contents = pipeline.contents
  const byDate = contents.reduce<Record<string, ContentItem[]>>((acc, c) => {
    if (!c.publishDate) return acc
    acc[c.publishDate] = acc[c.publishDate] ?? []
    acc[c.publishDate].push(c)
    return acc
  }, {})

  const unscheduled = contents.filter((c) => !c.publishDate && SCHEDULABLE_STATUSES.includes(c.status))

  async function handleDrop(dateStr: string) {
    if (!dragId) return
    const item = contents.find((c) => c.id === dragId)
    setDragId(null)
    if (!item) return
    try {
      await patchContentDate(item.id, item.revision, dateStr)
      setNotice(`"${item.title}" movido para ${formatDayLong(dateStr)}.`)
      load()
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code === undefined && /HTTP 409/.test(err.message)) {
        setNotice('Alguém alterou esse conteúdo nesse meio tempo. Recarregando dados reais…')
      } else {
        setNotice(`Não consegui mover: ${err.message}`)
      }
      load()
    }
  }

  async function handleUnschedule(c: ContentItem) {
    try {
      await unscheduleContent(c.id, c.revision)
      setNotice(`"${c.title}" voltou para não agendados.`)
      load()
    } catch (e) {
      setNotice(`Não consegui remover: ${String((e as Error).message || e)}`)
      load()
    }
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().slice(0, 10)

  const cells: (string | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  return (
    <div>
      <PageHeader
        title="Cronograma"
        subtitle="Arraste um card para outro dia para reagendar. Clique num card para abrir os detalhes. ✕ remove a data."
      />

      {notice && <div className="calendar-notice">{notice}</div>}

      <div className="calendar-nav">
        <button className="icon-btn" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
          <ChevronLeft size={18} />
        </button>
        <strong>{firstOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button className="icon-btn" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-layout">
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div className="calendar-weekday" key={w}>
              {w}
            </div>
          ))}
          {cells.map((dateStr, i) =>
            dateStr ? (
              <div
                key={dateStr}
                className={'calendar-cell' + (dateStr === todayStr ? ' calendar-cell-today' : '')}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(dateStr)}
              >
                <span className="calendar-daynum">{Number(dateStr.slice(-2))}</span>
                <div className="calendar-cell-items">
                  {(byDate[dateStr] ?? []).map((c) => (
                    <div
                      key={c.id}
                      className="calendar-chip"
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onClick={() => navigate(`/app/conteudo/${encodeURIComponent(c.id)}`)}
                      title={c.title}
                    >
                      <span className="calendar-chip-title">{c.title}</span>
                      <button
                        className="calendar-chip-remove"
                        title="Remover do cronograma"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnschedule(c)
                        }}
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={'empty-' + i} className="calendar-cell calendar-cell-outside" />
            ),
          )}
        </div>

        <aside className="calendar-sidebar">
          <h2>Não agendados ({unscheduled.length})</h2>
          <p className="calendar-sidebar-hint">Arraste para um dia do calendário, ou clique para abrir.</p>
          <div className="unscheduled-list">
            {unscheduled.map((c) => (
              <Card
                key={c.id}
                className="unscheduled-card"
                draggable
                onDragStart={() => setDragId(c.id)}
                onClick={() => navigate(`/app/conteudo/${encodeURIComponent(c.id)}`)}
              >
                <strong>{c.title}</strong>
                <StatusBadge status={c.status} />
              </Card>
            ))}
            {unscheduled.length === 0 && <span className="calendar-sidebar-hint">Nada pronto para agendar.</span>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function formatDayLong(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}
