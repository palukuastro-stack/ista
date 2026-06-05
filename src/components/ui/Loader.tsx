// src/components/ui/Loader.tsx
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps {
  label?: string
  className?: string
  fullHeight?: boolean
}

export function Loader({ label = "Chargement...", className, fullHeight }: LoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullHeight ? "min-h-[50vh]" : "py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
