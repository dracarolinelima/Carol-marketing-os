import type { ContentItem } from './types'

const TERRITORY_LABELS: Record<string, string> = {
  A: 'Dor/endometriose/adenomiose',
  B: 'Perimenopausa/menopausa',
  C: 'Histeroscopia/pólipos',
  D: 'Fertilidade',
  E: 'Contracepção',
  F: 'SOP/metabolismo',
  TRANS: 'Transversal',
}

export async function createContent(input: {
  title: string
  territory: string
  format?: string
}): Promise<ContentItem> {
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent: 'Caroline',
      title: input.title,
      territory: input.territory,
      territoryLabel: TERRITORY_LABELS[input.territory] ?? input.territory,
      type: 'bloco',
      note: 'Criado pela Dra. Caroline via Banco de pautas.',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  // POST /api/content only accepts title/territory/type/plannedWeek/note —
  // format is set with a follow-up PATCH so the quick-capture form can still
  // offer it.
  if (input.format) {
    const patched = await fetch(`/api/content/${encodeURIComponent(data.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'Caroline', expectedRevision: data.revision, format: input.format }),
    })
    if (patched.ok) return patched.json()
  }
  return data
}

export async function patchContentDate(
  id: string,
  expectedRevision: number,
  publishDate: string,
): Promise<ContentItem> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent: 'Caroline',
      expectedRevision,
      publishDate,
      note: 'Data reagendada pelo Cronograma (arrastar e soltar).',
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`) as Error & { code?: string }
    err.code = data.code
    throw err
  }
  return data
}
