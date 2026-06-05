// src/pages/Placeholder.tsx
import { Construction } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { EmptyState } from "@/components/ui/EmptyState"

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} subtitle="Cette section sera disponible prochainement." />
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={Construction}
          title="Module en construction"
          description="L'interface de ce module est prévue dans une prochaine itération du projet ISTA-Goma."
        />
      </div>
    </>
  )
}
