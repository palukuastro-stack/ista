// src/pages/apparitorat/ApparitoratInscriptions.tsx
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { KPICard } from "@/components/ui/KPICard"
import { Input } from "@/components/ui/input"
import { usePageData } from "@/hooks/usePageData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InscriptionDialog } from "@/pages/apparitorat/InscriptionDialog"
import { Users, UserCheck, UserCog } from "lucide-react"
import type { Student, AppData } from "@/types"
import { Loader } from "@/components/ui/Loader"

export function ApparitoratInscriptions() {
  const [query, setQuery] = useState("")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [promotionFilter, setPromotionFilter] = useState("all")

  const { data, loading } = usePageData((d: AppData) => {
    const facultyName = (id: string) => d.faculties.find((f) => f.id === id)?.code ?? "—"
    const promotionName = (id: string) =>
      d.promotions.find((p) => p.id === id)?.name ?? "—"
    return {
      students: d.students,
      faculties: d.faculties,
      promotions: d.promotions,
      facultyName,
      promotionName,
    }
  })

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data.students

    if (facultyFilter !== "all") {
      list = list.filter(s => s.facultyId === facultyFilter)
    }
    if (promotionFilter !== "all") {
      list = list.filter(s => s.promotionId === promotionFilter)
    }

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((s) =>
        [s.firstName, s.lastName, s.middleName, s.matricule, s.email]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    }
    return list
  }, [data, query, facultyFilter, promotionFilter])

  const counts = useMemo(() => {
    const list = data?.students ?? []
    return {
      total: list.length,
      active: list.filter((s) => s.status === "active").length,
      pending: list.filter((s) => s.status === "pending").length,
    }
  }, [data])

  if (loading || !data) return <Loader fullHeight />

  const columns: Column<Student>[] = [
    {
      key: "matricule",
      header: "Matricule",
      render: (s) => <span className="font-mono text-xs">{s.matricule}</span>,
    },
    {
      key: "name",
      header: "Étudiant",
      render: (s) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {s.firstName} {s.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{s.email}</p>
        </div>
      ),
    },
    {
      key: "faculty",
      header: "Faculté",
      render: (s) => data.facultyName(s.facultyId),
    },
    {
      key: "promotion",
      header: "Promotion",
      render: (s) => data.promotionName(s.promotionId),
    },
    {
      key: "average",
      header: "Moyenne",
      align: "center",
      render: (s) => (s.average > 0 ? `${s.average.toFixed(1)}/20` : "—"),
    },
    {
      key: "status",
      header: "Statut",
      align: "right",
      render: (s) => (
        <div className="flex justify-end">
          <StatusBadge status={s.status} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Inscriptions"
        subtitle="Gestion des inscriptions et du suivi des étudiants."
        action={<InscriptionDialog />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Total étudiants"
          value={counts.total}
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title="Inscriptions actives"
          value={counts.active}
          icon={UserCheck}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <KPICard
          title="En attente"
          value={counts.pending}
          icon={UserCog}
          colorClass="bg-chart-3/15 text-chart-3"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un étudiant..."
            className="pl-9"
            aria-label="Rechercher un étudiant"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Faculté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes facultés</SelectItem>
              {data.faculties.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={promotionFilter} onValueChange={setPromotionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Promotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes promotions</SelectItem>
              {data.promotions.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="Aucun étudiant trouvé"
        emptyDescription="Essayez de modifier votre recherche ou inscrivez un nouvel étudiant."
      />
    </>
  )
}
