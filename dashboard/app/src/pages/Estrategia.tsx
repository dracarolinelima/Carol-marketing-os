import { usePipeline, useStrategy } from '../api/usePipeline'
import { Card, ContentCard, ErrorState, LoadingState, PageHeader } from '../components/shared'
import './estrategia.css'

interface BlockContent {
  id: string
  title: string
  function?: string
  journeyStage?: string
  status?: string
  note?: string
}

interface Candidate {
  id: string
  title: string
  function?: string
  journeyStage?: string
  blocker?: string | null
  note?: string
}

interface NextNeeded {
  function?: string
  journeyStage?: string
  objective?: string
  description?: string
  candidates?: Candidate[]
  dependency?: string
}

interface ActiveBlock {
  id: string
  name: string
  territory: string
  status: string
  rationale: string
  journeyProgression: string
  publishedContext?: string
  contents: BlockContent[]
  nextNeeded?: NextNeeded
  furtherProgression?: NextNeeded
}

interface AlwaysOn {
  line: string
  territory: string
  cadence: string
  rationale: string
  publishedContext?: BlockContent[]
  archived?: { id: string; title: string; rejectionReason?: string; learning?: string }[]
  backlog?: Candidate[]
  nextNeeded?: { description?: string; dependency?: string; agentAction?: string }
}

interface ScientificPriority {
  package: string
  name: string
  status: string
  priority: string
  blocks?: string[]
  humanAction?: string
  agentAction?: string
}

interface NextAction {
  order: number
  action: string
  agent: string
  justification?: string
}

const STAGES = ['RECONHECER', 'ENTENDER', 'CONFIAR', 'PROCURAR']

export default function Estrategia() {
  const pipeline = usePipeline()
  const strategy = useStrategy()

  if (pipeline.loading || strategy.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />
  if (strategy.error || !strategy.data) {
    return (
      <div>
        <PageHeader title="Estratégia" />
        <Card>
          Nenhuma análise estratégica encontrada ({strategy.error}). O Strategist precisa gerar
          dashboard/data/strategy.json primeiro.
        </Card>
      </div>
    )
  }

  const data = strategy.data as unknown as {
    generatedAt: string
    activeBlock?: ActiveBlock
    alwaysOn?: AlwaysOn
    scientificPriorities?: ScientificPriority[]
    nextActions?: NextAction[]
    strategicRationale?: string
  }

  return (
    <div>
      <PageHeader
        title="Estratégia"
        subtitle={`Visão do Strategist: o que cada conteúdo faz pelo funil, não só o que está no calendário. Análise de ${formatDate(data.generatedAt)}.`}
      />

      {data.strategicRationale && (
        <section className="section">
          <Card className="strategy-rationale">{data.strategicRationale}</Card>
        </section>
      )}

      {data.activeBlock && <BlockFunnel block={data.activeBlock} pipeline={pipeline.data!.contents} />}

      {data.alwaysOn && <AlwaysOnFunnel alwaysOn={data.alwaysOn} />}

      {data.scientificPriorities && data.scientificPriorities.length > 0 && (
        <section className="section">
          <h2>Pacotes científicos — o que trava o quê</h2>
          <div className="sci-grid">
            {data.scientificPriorities.map((sp) => (
              <Card key={sp.package} className="sci-card">
                <div className="sci-top">
                  <strong>{sp.package}</strong>
                  <span className={`sci-priority sci-priority-${sp.priority?.toLowerCase()}`}>{sp.priority}</span>
                </div>
                <span className="content-meta">{sp.name}</span>
                <span className="sci-status">{sp.status}</span>
                {sp.blocks && sp.blocks.length > 0 && (
                  <div className="sci-blocks">
                    <span className="sci-blocks-label">Trava:</span> {sp.blocks.join(' · ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {data.nextActions && data.nextActions.length > 0 && (
        <section className="section">
          <h2>Próximas ações, em ordem</h2>
          <ol className="next-actions-list">
            {data.nextActions.map((a) => (
              <li key={a.order}>
                <strong>{a.action}</strong>
                <span className="content-meta"> — {a.agent}</span>
                {a.justification && <p>{a.justification}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function BlockFunnel({ block }: { block: ActiveBlock; pipeline: unknown[] }) {
  const byStage: Record<string, BlockContent[]> = { RECONHECER: [], ENTENDER: [], CONFIAR: [], PROCURAR: [] }
  for (const c of block.contents) {
    const stage = stageFromJourney(c.journeyStage)
    if (stage) byStage[stage].push(c)
  }
  const nextStage = stageFromJourney(block.nextNeeded?.journeyStage)
  const furtherStage = stageFromJourney(block.furtherProgression?.journeyStage)

  return (
    <section className="section">
      <h2>
        Bloco ativo — {block.name} <span className="block-status">({block.status})</span>
      </h2>
      <Card className="block-rationale">{block.rationale}</Card>

      <div className="funnel-row">
        {STAGES.map((stage) => (
          <div className="funnel-col" key={stage}>
            <h3>{stage}</h3>
            <div className="funnel-items">
              {byStage[stage].map((c) => (
                <ContentCard key={c.id} id={c.id} className="funnel-item">
                  <strong>{c.title}</strong>
                  <span className="content-meta">{c.function}</span>
                  {c.status && <span className="funnel-item-status">{c.status}</span>}
                </ContentCard>
              ))}
              {stage === nextStage && block.nextNeeded?.candidates && (
                <>
                  <span className="funnel-needed-label">próximo precisa:</span>
                  {block.nextNeeded.candidates.map((cand) => (
                    <ContentCard key={cand.id} id={cand.id} className="funnel-item funnel-item-candidate">
                      <strong>{cand.title}</strong>
                      <span className="content-meta">{cand.function}</span>
                      {cand.blocker && <span className="funnel-blocker">🔒 {cand.blocker}</span>}
                    </ContentCard>
                  ))}
                </>
              )}
              {stage === furtherStage && block.furtherProgression?.candidates && (
                <>
                  <span className="funnel-needed-label">depois:</span>
                  {block.furtherProgression.candidates.map((cand) => (
                    <ContentCard key={cand.id} id={cand.id} className="funnel-item funnel-item-candidate">
                      <strong>{cand.title}</strong>
                      <span className="content-meta">{cand.function}</span>
                      {cand.blocker && <span className="funnel-blocker">🔒 {cand.blocker}</span>}
                    </ContentCard>
                  ))}
                </>
              )}
              {byStage[stage].length === 0 && stage !== nextStage && stage !== furtherStage && (
                <span className="funnel-empty">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AlwaysOnFunnel({ alwaysOn }: { alwaysOn: AlwaysOn }) {
  return (
    <section className="section">
      <h2>
        Linha always-on — {alwaysOn.line} <span className="block-status">({alwaysOn.cadence})</span>
      </h2>
      <Card className="block-rationale">{alwaysOn.rationale}</Card>

      <div className="funnel-row funnel-row-compact">
        <div className="funnel-col">
          <h3>Publicado</h3>
          <div className="funnel-items">
            {(alwaysOn.publishedContext ?? []).map((c) => (
              <ContentCard key={c.id} id={c.id} className="funnel-item">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.function}</span>
              </ContentCard>
            ))}
          </div>
        </div>
        <div className="funnel-col">
          <h3>Backlog (próximos candidatos)</h3>
          <div className="funnel-items">
            {(alwaysOn.backlog ?? []).map((c) => (
              <ContentCard key={c.id} id={c.id} className="funnel-item funnel-item-candidate">
                <strong>{c.title}</strong>
                <span className="content-meta">{c.function}</span>
                {c.blocker && <span className="funnel-blocker">🔒 {c.blocker}</span>}
              </ContentCard>
            ))}
            {(!alwaysOn.backlog || alwaysOn.backlog.length === 0) && <span className="funnel-empty">—</span>}
          </div>
        </div>
      </div>

      {alwaysOn.nextNeeded?.description && (
        <Card className="funnel-next-needed-card">
          <strong>O que falta</strong>
          <p>{alwaysOn.nextNeeded.description}</p>
          {alwaysOn.nextNeeded.dependency && (
            <span className="content-meta">Depende de: {alwaysOn.nextNeeded.dependency}</span>
          )}
        </Card>
      )}

      {alwaysOn.archived && alwaysOn.archived.length > 0 && (
        <details className="funnel-archived">
          <summary>{alwaysOn.archived.length} pauta(s) arquivada(s) nesta linha</summary>
          {alwaysOn.archived.map((a) => (
            <div key={a.id} className="funnel-archived-item">
              <strong>{a.title}</strong>
              {a.rejectionReason && <p>{a.rejectionReason}</p>}
            </div>
          ))}
        </details>
      )}
    </section>
  )
}

function stageFromJourney(journeyStage?: string): string | null {
  if (!journeyStage) return null
  const s = journeyStage.toUpperCase()
  for (const stage of STAGES) {
    if (s.includes(stage) || s.includes(stage.slice(0, 3))) return stage
  }
  if (s.includes('REC')) return 'RECONHECER'
  if (s.includes('ENT')) return 'ENTENDER'
  if (s.includes('CON') && !s.includes('CONV')) return 'CONFIAR'
  if (s.includes('PROC') || s.includes('CONV')) return 'PROCURAR'
  return null
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}
