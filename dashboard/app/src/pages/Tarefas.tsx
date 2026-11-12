import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, ErrorState, LoadingState, PageHeader } from '../components/shared'
import { createTask, deleteTask, getTasks, updateTask, type Task } from '../api/tasksClient'
import './tarefas.css'

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>(null)
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    getTasks()
      .then(setTasks)
      .catch((e) => setError(String(e.message || e)))
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await createTask({ title: title.trim(), priority: priority || undefined, dueDate: dueDate || undefined })
      setTitle('')
      setPriority(null)
      setDueDate('')
      load()
    } catch (e) {
      setError(String((e as Error).message || e))
    } finally {
      setSaving(false)
    }
  }

  async function toggleDone(t: Task) {
    await updateTask(t.id, { status: t.status === 'aberta' ? 'concluida' : 'aberta' })
    load()
  }

  async function remove(id: string) {
    await deleteTask(id)
    load()
  }

  if (error) return <ErrorState message={error} />
  if (!tasks) return <LoadingState />

  const open = tasks.filter((t) => t.status === 'aberta')
  const done = tasks.filter((t) => t.status === 'concluida')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader title="Tarefas" subtitle={`${open.length} em aberto`} />

      <Card className="task-form-card">
        <form onSubmit={handleCreate} className="task-form">
          <input
            type="text"
            placeholder="Nova tarefa…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-input"
          />
          <select value={priority ?? ''} onChange={(e) => setPriority((e.target.value || null) as Task['priority'])}>
            <option value="">Prioridade</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button type="submit" disabled={saving || !title.trim()}>
            Adicionar
          </button>
        </form>
      </Card>

      <section className="section">
        <h2>Em aberto</h2>
        {open.length === 0 && <Card>Nenhuma tarefa aberta.</Card>}
        <div className="task-list">
          {open.map((t) => (
            <Card key={t.id} className={'task-item' + (t.dueDate && t.dueDate < today ? ' task-overdue' : '')}>
              <input type="checkbox" checked={false} onChange={() => toggleDone(t)} />
              <div className="task-body">
                <strong>{t.title}</strong>
                <span className="task-meta">
                  {t.priority && <span className={`priority-tag priority-${t.priority}`}>{t.priority}</span>}
                  {t.dueDate && <span>prazo {formatDate(t.dueDate)}</span>}
                </span>
              </div>
              <button className="icon-btn" onClick={() => remove(t.id)} aria-label="Excluir">
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </Card>
          ))}
        </div>
      </section>

      {done.length > 0 && (
        <section className="section">
          <h2>Concluídas</h2>
          <div className="task-list">
            {done.map((t) => (
              <Card key={t.id} className="task-item task-done">
                <input type="checkbox" checked={true} onChange={() => toggleDone(t)} />
                <div className="task-body">
                  <strong>{t.title}</strong>
                </div>
                <button className="icon-btn" onClick={() => remove(t.id)} aria-label="Excluir">
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
