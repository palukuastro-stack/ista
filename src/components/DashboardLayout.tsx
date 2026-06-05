// src/components/DashboardLayout.tsx
import type { ReactNode } from "react"
import { PageHeader } from "@/components/ui/PageHeader"

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  action?: ReactNode
  stats?: ReactNode
  children: ReactNode
}

export function DashboardLayout({
  title,
  subtitle,
  action,
  stats,
  children
}: DashboardLayoutProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} action={action} />

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}
