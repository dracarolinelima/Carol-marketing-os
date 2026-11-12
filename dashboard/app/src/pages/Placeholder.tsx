import { EmptyConstruction, PageHeader } from '../components/shared'

export default function Placeholder({ title, subtitle, what }: { title: string; subtitle: string; what: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyConstruction what={what} />
    </div>
  )
}
