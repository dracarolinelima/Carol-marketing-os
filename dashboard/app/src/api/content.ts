import type { ContentItem } from './types'

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
