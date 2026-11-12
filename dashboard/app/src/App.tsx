import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import VisaoGeral from './pages/VisaoGeral'
import Calendario from './pages/Calendario'
import BancoDePautas from './pages/BancoDePautas'
import Producao from './pages/Producao'
import Aprovacao from './pages/Aprovacao'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/app" element={<Layout />}>
        <Route index element={<VisaoGeral />} />
        <Route
          path="tarefas"
          element={
            <Placeholder
              title="Tarefas"
              subtitle="Pendências por responsável e período"
              what="A entidade de tarefa leve (responsável, prazo, prioridade, comentários)"
            />
          }
        />
        <Route path="calendario" element={<Calendario />} />
        <Route path="pautas" element={<BancoDePautas />} />
        <Route path="producao" element={<Producao />} />
        <Route
          path="estudio"
          element={
            <Placeholder
              title="Estúdio de arte"
              subtitle="Geração de carrosséis a partir de texto aprovado"
              what="O editor visual de slides (modelos 1080×1440, tipografia, cores, exportação)"
            />
          }
        />
        <Route path="aprovacao" element={<Aprovacao />} />
        <Route
          path="programar"
          element={
            <Placeholder
              title="Programar posts"
              subtitle="Fila de conteúdos aprovados aguardando publicação"
              what="O agendamento com data/hora e integração com Metricool"
            />
          }
        />
        <Route
          path="feed"
          element={
            <Placeholder
              title="Prévia do feed"
              subtitle="Grade 3:4 com publicados e programados"
              what="A grade visual do feed, gerada a partir das imagens do estúdio"
            />
          }
        />
        <Route
          path="analise"
          element={
            <Placeholder
              title="Análise"
              subtitle="Métricas do Instagram via Metricool/Windsor"
              what="A importação periódica de métricas por conteúdo, tema e formato"
            />
          }
        />
      </Route>
    </Routes>
  )
}
