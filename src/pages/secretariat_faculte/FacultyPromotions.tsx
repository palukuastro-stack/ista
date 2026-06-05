// src/pages/secretariat_faculte/FacultyPromotions.tsx
import { useState } from "react"
import { Users, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Loader } from "@/components/ui/Loader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import type { Promotion } from "@/types"

interface PromotionRow extends Promotion {
  facultyName: string
  facultyCode: string
  realStudentCount: number
}

export function FacultyPromotions() {
  const { user } = useAuth()
  const [facultyId, setFacultyId] = useState(user?.facultyId || "all")

  const { data, loading } = usePageData((d) => {
    const rows: PromotionRow[] = d.promotions.map((p) => {
      const faculty = d.faculties.find((f) => f.id === p.facultyId)
      const realCount = d.students.filter((s) => s.promotionId === p.id).length
      return {
        ...p,
        facultyName: faculty?.name ?? "—",
        facultyCode: faculty?.code ?? "—",
        realStudentCount: realCount,
      }
    })
    return { rows, faculties: d.faculties }
  })

  if (loading || !data) return <Loader fullHeight />

  const filtered =
    facultyId === "all" ? data.rows : data.rows.filter((r) => r.facultyId === facultyId)

  const totalStudents = filtered.reduce((acc, r) => acc + r.realStudentCount, 0)

  const columns: Column<PromotionRow>[] = [
    {
      key: "name",
      header: "Promotion",
      render: (p) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground">Niveau {p.level}</p>
        </div>
      ),
    },
    { key: "faculty", header: "Faculté", render: (p) => p.facultyCode },
    {
      key: "students",
      header: "Étudiants",
      align: "center",
      render: (p) => (
        <span className="font-semibold text-foreground">{p.realStudentCount}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacité officielle",
      align: "center",
      render: (p) => (
        <span className="text-muted-foreground">{p.studentCount}</span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Promotions"
        subtitle="Gestion des promotions et des effectifs."
        action={
          <Select value={facultyId} onValueChange={setFacultyId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Toutes les facultés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les facultés</SelectItem>
              {data.faculties.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPICard
          title="Promotions"
          value={filtered.length}
          subtitle="Filière(s) actives"
          icon={GraduationCap}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <KPICard
          title="Étudiants inscrits"
          value={totalStudents}
          subtitle="Total réel"
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        emptyTitle="Aucune promotion"
        emptyDescription="Aucune promotion à afficher pour cette faculté."
      />
    </>
  )
}
