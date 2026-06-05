// src/pages/apparitorat/ApparitoratDashboard.tsx
import { Users, UserCog, Venus, Mars } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { InscriptionDialog } from "@/pages/apparitorat/InscriptionDialog"
import { DashboardLayout } from "@/components/DashboardLayout"
import { usePageData } from "@/hooks/usePageData"
import type { Student } from "@/types"
import locales from "@/lib/locales.json"
import { getApparitoratStats, enrichStudent } from "@/lib/selectors"

interface PendingRow extends Student {
  facultyCode: string
  promotionName: string
}

export function ApparitoratDashboard() {
  const { data, loading } = usePageData(getApparitoratStats)

  if (loading || !data) return <Loader fullHeight />

  const columns: Column<PendingRow>[] = [
    {
      key: "matricule",
      header: locales.apparitorat.matricule,
      render: (s) => <span className="font-mono text-xs">{s.matricule}</span>,
    },
    {
      key: "name",
      header: locales.apparitorat.student,
      render: (s) => (
        <span className="font-medium text-foreground">
          {s.firstName} {s.lastName}
        </span>
      ),
    },
    { key: "faculty", header: locales.apparitorat.faculty, render: (s) => s.facultyCode },
    { key: "promotion", header: locales.apparitorat.promotion, render: (s) => s.promotionName },
    {
      key: "status",
      header: locales.apparitorat.status,
      align: "right",
      render: (s) => (
        <div className="flex justify-end">
          <StatusBadge status={s.status} />
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout
      title={locales.apparitorat.dashboard_title}
      subtitle={locales.apparitorat.dashboard_subtitle}
      action={<InscriptionDialog />}
      stats={
        <>
          <KPICard title={locales.apparitorat.total_effectif} value={data.total} icon={Users} colorClass="bg-chart-1/10 text-chart-1" subtitle={`${locales.apparitorat.capacity_max}: ${data.totalMax}`} />
          <KPICard title={locales.apparitorat.girls} value={data.girls} icon={Venus} colorClass="bg-chart-4/10 text-chart-4" />
          <KPICard title={locales.apparitorat.boys} value={data.boys} icon={Mars} colorClass="bg-chart-5/10 text-chart-5" />
          <KPICard title={locales.apparitorat.pending} value={data.pendingCount} icon={UserCog} colorClass="bg-chart-3/15 text-chart-3" />
        </>
      }
    >
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{locales.apparitorat.pending_folders}</CardTitle>
          <CardDescription>{locales.apparitorat.pending_folders_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data.pending}
            rowKey={(s) => s.id}
            emptyTitle={locales.apparitorat.empty_pending}
            emptyDescription={locales.apparitorat.empty_pending_desc}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locales.apparitorat.faculty_distribution}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {data.byFaculty.map((f) => (
              <li key={f.code} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{f.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{f.code}</p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">
                  {f.count}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
