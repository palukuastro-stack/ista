// src/components/ui/StatusBadge.tsx
import { cn } from "@/lib/utils"
import type { StatusValue } from "@/types"

interface StatusBadgeProps {
  status: StatusValue | string
  className?: string
}

const CONFIG: Record<string, { label: string; classes: string }> = {
  active: { label: "Actif", classes: "bg-success/12 text-success border-success/25" },
  validated: { label: "Validé", classes: "bg-success/12 text-success border-success/25" },
  pending: { label: "En attente", classes: "bg-warning/15 text-warning-foreground border-warning/30" },
  important: { label: "Important", classes: "bg-warning/15 text-warning-foreground border-warning/30" },
  suspended: { label: "Suspendu", classes: "bg-destructive/12 text-destructive border-destructive/25" },
  rejected: { label: "Rejeté", classes: "bg-destructive/12 text-destructive border-destructive/25" },
  urgent: { label: "Urgent", classes: "bg-destructive/12 text-destructive border-destructive/25" },
  info: { label: "Info", classes: "bg-primary/10 text-primary border-primary/25" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = CONFIG[status] ?? {
    label: status,
    classes: "bg-muted text-muted-foreground border-border",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </span>
  )
}
