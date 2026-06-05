// src/components/AnnouncementList.tsx
import { Megaphone } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Announcement } from "@/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function AnnouncementList({ items }: { items: Announcement[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Aucune annonce"
        description="Il n'y a aucune annonce à afficher pour le moment."
      />
    )
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <li key={a.id} className="space-y-1.5 px-4 py-4 first:pt-0 last:pb-0 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-foreground">{a.title}</p>
            <StatusBadge status={a.priority} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
          <p className="text-xs text-muted-foreground">
            {a.author} · {formatDate(a.date)}
          </p>
        </li>
      ))}
    </ul>
  )
}
