export interface HistoryEntry {
  type?: string
  from?: string | null
  to?: string | null
  timestamp: string
  agent?: string
  note?: string | null
  revision?: number
}

export interface MetricsSnapshot {
  snapshots: unknown[]
  evidence: unknown[]
}

export interface ContentItem {
  id: string
  title: string
  slug?: string | null
  territory?: string | null
  territoryLabel?: string | null
  type?: string | null
  editorialFunction?: string | null
  journeyStage?: string | null
  format?: string | null
  status: string
  substatus?: string | null
  nextAction?: string | null
  block?: string | null
  publishDate?: string | null
  plannedWeek?: string | null
  scientificPackage?: string | null
  scientificPackageStatus?: string | null
  approvedCopy?: string | null
  visualBrief?: string | null
  caption?: boolean | null
  assets?: string[]
  postUrl?: string | null
  metrics?: MetricsSnapshot
  leads?: unknown[]
  learnings?: unknown[]
  blocker?: string | null
  note?: string | null
  currentOwner?: string | null
  pendingType?: string
  blockerReason?: string | null
  lastUpdate?: string
  lastAgent?: string
  revision: number
  createdAt?: string
  history?: HistoryEntry[]
}

export interface Pipeline {
  version?: string
  lastUpdated?: string
  contents: ContentItem[]
}

export interface StrategyDoc {
  generatedAt: string
  generatedBy: string
  [key: string]: unknown
}
