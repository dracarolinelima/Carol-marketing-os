import { usePipeline, useStrategy } from '../api/usePipeline'
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/shared'
import './visaoGeral.css'

interface PendingDecision {
  priority?: string
  item?: string
  decision?: string
}

export default function VisaoGeral() {
  const pipeline = usePipeline()
  const strategy = useStrategy()

  if (pipeline.loading) return <LoadingState />
  if (pipeline.error || !pipeline.data) return <ErrorState message={pipeline.error ?? ''} />

  const contents = pipeline.data.contents
  const byStatus = contents.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  const pendingApproval = contents.filter((c) => c.pendingType === 'aprovacao' || c.pendingType === 'decisao')
  const pendingDecisions = (strategy.data?.pendingHumanDecisions as PendingDecision[] | undefined) ?? []

  return (
    <div>
      <PageHeader
        title="Visão geral"
        subtitle={`${contents.length} conteúdos no pipeline · atualizado em ${formatDate(pipeline.data.lastUpdated)}`}
      />

      <div className="stat-row">
        <StatCard label="Backlog" value={byStatus.backlog ?? 0} />
        <StatCard label="Em produção" value={(byStatus['em-desenvolvimento'] ?? 0) + (byStatus['em-producao'] ?? 0)} />
        <StatCard label="Em revisão" value={byStatus.revisao ?? 0} />
        <StatCard label="Publicados" value={byStatus.publicado ?? 0} />
      </div>

      <section className="section">
        <h2>Pendências para a Dra. Caroline</h2>
        {strategy.loading && <LoadingState />}
        {!strategy.loading && pendingDecisions.length === 0 && (
          <Card>Nenhuma pendência estratégica registrada em strategy.json.</Card>
        )}
        {pendingDecisions.length > 0 && (
          <Card className="decision-list">
            {pendingDecisions.map((d, i) => (
              <div className="decision-item" key={i}>
                <span className={`priority-dot priority-${(d.priority ?? '').toLowerCase()}`} />
                <div>
                  <strong>{d.item}</strong>
                  <p>{d.decision}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="section">
        <h2>Aguardando aprovação ou decisão ({pendingApproval.length})</h2>
        {pendingApproval.length === 0 && <Card>Nada aguardando aprovação no momento.</Card>}
        {pendingApproval.length > 0 && (
          <div className="content-grid">
            {pendingApproval.map((c) => (
              <Card key={c.id} className="content-card">
                <div className="content-card-top">
                  <StatusBadge status={c.status} />
                  <span className="content-id">{c.id}</span>
                </div>
                <strong>{c.title}</strong>
                <span className="content-meta">
                  {c.territoryLabel ?? c.territory} · {c.editorialFunction ?? 'função não definida'}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Card>
  )
}

function formatDate(iso?: string): string {
  if (!iso) return 'data desconhecida'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}
