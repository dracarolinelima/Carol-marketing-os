export interface CopyCard {
  num: number
  label: string | null
  text: string
}

export interface CopyView {
  contentId: string
  title: string
  revision: number
  content: {
    cards: CopyCard[]
    caption: string
    cta: string | null
  }
  editable: boolean
  published: boolean
  origin: string
}

export async function getCopy(id: string): Promise<CopyView> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}/copy`)
  if (!res.ok) throw new Error(`GET copy -> HTTP ${res.status}`)
  return res.json()
}

export async function saveCopyDraft(
  id: string,
  expectedRevision: number,
  content: { cards: CopyCard[]; caption: string; cta?: string | null },
  note?: string,
): Promise<CopyView> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}/copy/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent: 'Caroline',
      expectedRevision,
      cards: content.cards.map((c) => ({ text: c.text, label: c.label })),
      caption: content.caption,
      cta: content.cta ?? null,
      note: note || 'Reescrito pela Dra. Caroline via Central de Comando.',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}
