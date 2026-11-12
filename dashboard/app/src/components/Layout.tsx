import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Lightbulb,
  PenTool,
  Palette,
  CheckCircle2,
  Send,
  GalleryHorizontal,
  BarChart3,
} from 'lucide-react'
import './layout.css'

const NAV_ITEMS = [
  { to: '/app/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/app/tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: '/app/calendario', label: 'Cronograma', icon: Calendar },
  { to: '/app/pautas', label: 'Banco de pautas', icon: Lightbulb },
  { to: '/app/producao', label: 'Produção', icon: PenTool },
  { to: '/app/estudio', label: 'Estúdio de arte', icon: Palette },
  { to: '/app/aprovacao', label: 'Aprovação', icon: CheckCircle2 },
  { to: '/app/programar', label: 'Programar posts', icon: Send },
  { to: '/app/feed', label: 'Prévia do feed', icon: GalleryHorizontal },
  { to: '/app/analise', label: 'Análise', icon: BarChart3 },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-script">Dra. Caroline Lima</span>
          <span className="sidebar-brand-sub">Central de Comando</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' is-active' : '')}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v2 ainda ativo em /v2</span>
        </div>
      </aside>
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}
