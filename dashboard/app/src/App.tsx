import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import VisaoGeral from './pages/VisaoGeral'
import Calendario from './pages/Calendario'
import BancoDePautas from './pages/BancoDePautas'
import Producao from './pages/Producao'
import Aprovacao from './pages/Aprovacao'
import Tarefas from './pages/Tarefas'
import Programar from './pages/Programar'
import PreviaFeed from './pages/PreviaFeed'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/app" element={<Layout />}>
        <Route index element={<VisaoGeral />} />
        <Route path="tarefas" element={<Tarefas />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="pautas" element={<BancoDePautas />} />
        <Route path="producao" element={<Producao />} />
        <Route
          path="estudio"
          element={
            <Placeholder
              title="Estúdio de arte"
              subtitle="Geração de carrosséis a partir de texto aprovado"
              what="O editor visual de slides (modelos 1080×1440, tipografia, cores, exportação). Depende da decisão D10 — Canva (modelos de marca) vs. editor próprio, ver ROADMAP Fase 6"
            />
          }
        />
        <Route path="aprovacao" element={<Aprovacao />} />
        <Route path="programar" element={<Programar />} />
        <Route path="feed" element={<PreviaFeed />} />
        <Route
          path="analise"
          element={
            <Placeholder
              title="Análise"
              subtitle="Métricas do Instagram via Metricool/Windsor"
              what="A importação periódica de métricas por conteúdo, tema e formato. Os conectores Metricool/Windsor funcionam dentro de sessões do Claude, não no servidor do Dashboard — importar dados reais exige decidir como ligar os dois (ver INTEGRATIONS.md e D8)"
            />
          }
        />
      </Route>
    </Routes>
  )
}
