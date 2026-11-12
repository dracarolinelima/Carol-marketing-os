import type { ContentItem } from './types'

async function patch(id: string, body: Record<string, unknown>): Promise<ContentItem> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

async function handoff(id: string, body: Record<string, unknown>): Promise<ContentItem> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

// Caroline aprova um conteudo em revisao -> pronto, pendencia liberada.
export function approveToReady(id: string, expectedRevision: number): Promise<ContentItem> {
  return handoff(id, {
    agent: 'Caroline',
    expectedRevision,
    toOwner: null,
    pendingType: 'nenhuma',
    status: 'pronto',
    note: 'Aprovado pela Dra. Caroline via Central de Comando.',
  })
}

// Caroline aprova o angulo de um brief (pendingType decisao) -> segue para o Creator.
export function approveAngleToCreator(id: string, expectedRevision: number, note?: string): Promise<ContentItem> {
  return handoff(id, {
    agent: 'Caroline',
    expectedRevision,
    toOwner: 'Creator',
    pendingType: 'nenhuma',
    status: 'em-producao',
    note: note || 'Angulo aprovado pela Dra. Caroline, segue para producao de copy.',
  })
}

// Caroline devolve para o Creator com uma nota (motivo obrigatorio).
export function returnToCreator(id: string, expectedRevision: number, note: string): Promise<ContentItem> {
  return handoff(id, {
    agent: 'Caroline',
    expectedRevision,
    toOwner: 'Creator',
    pendingType: 'nenhuma',
    status: 'em-producao',
    note,
  })
}

// Caroline pede ajuste no brief (volta para o Strategist) com nota obrigatoria.
export function requestBriefAdjustment(id: string, expectedRevision: number, note: string): Promise<ContentItem> {
  return handoff(id, {
    agent: 'Caroline',
    expectedRevision,
    toOwner: 'Strategist',
    pendingType: 'nenhuma',
    note,
  })
}

// Remove a data de publicacao (tira do calendario, mantem o status).
export function unscheduleContent(id: string, expectedRevision: number): Promise<ContentItem> {
  return patch(id, {
    agent: 'Caroline',
    expectedRevision,
    publishDate: null,
    note: 'Data removida do Cronograma pela Dra. Caroline.',
  })
}

// Arquiva um conteudo (fecha qualquer pendencia aberta automaticamente).
export function archiveContent(id: string, expectedRevision: number, note: string): Promise<ContentItem> {
  return patch(id, {
    agent: 'Caroline',
    expectedRevision,
    status: 'arquivado',
    confirmClosePending: true,
    note,
  })
}

export function updateBasicFields(
  id: string,
  expectedRevision: number,
  fields: { title?: string; territory?: string; format?: string | null },
): Promise<ContentItem> {
  return patch(id, { agent: 'Caroline', expectedRevision, ...fields })
}
