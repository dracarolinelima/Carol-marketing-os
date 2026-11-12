export interface CopyCard {
  num: number
  label: string | null
  text: string
}

export interface CopyView {
  contentId: string
  title: string
  content: {
    cards: CopyCard[]
    caption: string
    cta: string | null
  }
  editable: boolean
  origin: string
}

export async function getCopy(id: string): Promise<CopyView> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}/copy`)
  if (!res.ok) throw new Error(`GET copy -> HTTP ${res.status}`)
  return res.json()
}
