export interface Task {
  id: string
  title: string
  status: 'aberta' | 'concluida'
  priority: 'alta' | 'media' | 'baixa' | null
  dueDate: string | null
  assignee: string | null
  linkedContentId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error(`GET /api/tasks -> HTTP ${res.status}`)
  const data = await res.json()
  return data.tasks
}

export async function createTask(input: {
  title: string
  priority?: Task['priority']
  dueDate?: string | null
  linkedContentId?: string | null
}): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`POST /api/tasks -> HTTP ${res.status}`)
  return res.json()
}

export async function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'dueDate' | 'notes'>>): Promise<Task> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`PATCH /api/tasks/${id} -> HTTP ${res.status}`)
  return res.json()
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/tasks/${id} -> HTTP ${res.status}`)
}
