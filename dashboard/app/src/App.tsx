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
import Estudio from './pages/Estudio'
import Estrategia from './pages/Estrategia'
import Analise from './pages/Analise'
import ConteudoDetalhe from './pages/ConteudoDetalhe'

export default function App() {
  return (
    <Routes>
      <Route path="/app" element={<Layout />}>
        <Route index element={<VisaoGeral />} />
        <Route path="tarefas" element={<Tarefas />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="pautas" element={<BancoDePautas />} />
        <Route path="estrategia" element={<Estrategia />} />
        <Route path="producao" element={<Producao />} />
        <Route path="estudio" element={<Estudio />} />
        <Route path="aprovacao" element={<Aprovacao />} />
        <Route path="programar" element={<Programar />} />
        <Route path="feed" element={<PreviaFeed />} />
        <Route path="analise" element={<Analise />} />
        <Route path="conteudo/:id" element={<ConteudoDetalhe />} />
      </Route>
    </Routes>
  )
}
