import { useEffect, useState } from 'react'
import { getPipeline, getStrategy } from './client'
import type { Pipeline, StrategyDoc } from './types'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function usePipeline(): AsyncState<Pipeline> {
  const [state, setState] = useState<AsyncState<Pipeline>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    getPipeline()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }) })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: String(err.message || err) }) })
    return () => { cancelled = true }
  }, [])

  return state
}

export function useStrategy(): AsyncState<StrategyDoc> {
  const [state, setState] = useState<AsyncState<StrategyDoc>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    getStrategy()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }) })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: String(err.message || err) }) })
    return () => { cancelled = true }
  }, [])

  return state
}
