import type { Pipeline, StrategyDoc } from './types'

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getPipeline(): Promise<Pipeline> {
  return getJSON<Pipeline>('/api/pipeline')
}

export function getStrategy(): Promise<StrategyDoc> {
  return getJSON<StrategyDoc>('/api/strategy')
}
