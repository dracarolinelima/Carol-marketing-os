import type { ReactNode } from 'react'
import './shared.css'

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'card ' + className}>{children}</div>
}

export function LoadingState() {
  return <div className="state-block state-loading">Carregando dados reais do pipeline…</div>
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-block state-error">
      Não consegui carregar os dados. {message}
      <div className="state-error-hint">O servidor do Dashboard (porta 3000) está rodando?</div>
    </div>
  )
}

export function EmptyConstruction({ what }: { what: string }) {
  return (
    <Card className="construction-card">
      <span className="construction-tag">Em construção</span>
      <p>
        {what} ainda não tem dados reais ou função implementada nesta interface.
        Esta tela existe para mostrar a estrutura de navegação completa — o
        conteúdo real entra em uma próxima etapa, quando houver decisão sobre
        como construir essa parte.
      </p>
    </Card>
  )
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  selecionado: 'Selecionado',
  'em-desenvolvimento': 'Em desenvolvimento',
  'em-producao': 'Em produção',
  revisao: 'Em revisão',
  pronto: 'Pronto',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] ?? status}</span>
}
