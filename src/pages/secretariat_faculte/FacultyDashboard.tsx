// src/pages/secretariat_faculte/FacultyDashboard.tsx
import { useState } from "react"
import { Users, GraduationCap, BookOpen, UserSquare2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import locales from "@/lib/locales.json"
import { getFacultyDashboardData } from "@/lib/selectors"
import { useAuth } from "@/contexts/AuthContext"

export function FacultyDashboard() {
  const { user } = useAuth()
  const [facultyId, setFacultyId] = useState(user?.facultyId || "f1")

  const { data, loading } = usePageData((d) =>
    getFacultyDashboardData(d, facultyId)
  )

  if (loading || !data) return <Loader fullHeight />

  return (
    <>
      <PageHeader
        title={locales.secretariat_faculte.dashboard_title}
        subtitle={`${data.faculty.name} · ${locales.secretariat_faculte.dean} : ${data.faculty.dean}`}
        action={
          <Select value={facultyId} onValueChange={setFacultyId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={locales.secretariat_faculte.faculty_select} />
            </SelectTrigger>
            <SelectContent>
              {data.faculties.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title={locales.secretariat_faculte.students} value={data.students.length} icon={Users} colorClass="bg-chart-1/10 text-chart-1" />
        <KPICard title={locales.secretariat_faculte.promotions} value={data.promotions.length} icon={GraduationCap} colorClass="bg-chart-2/10 text-chart-2" />
        <KPICard title={locales.secretariat_faculte.courses} value={data.courses.length} icon={BookOpen} colorClass="bg-chart-4/10 text-chart-4" />
        <KPICard title={locales.secretariat_faculte.teachers} value={data.teachers.length} icon={UserSquare2} colorClass="bg-chart-3/15 text-chart-3" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locales.secretariat_faculte.promotions}</CardTitle>
            <CardDescription>{locales.secretariat_faculte.promotions_effectifs}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.promotions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{locales.secretariat_faculte.level} {p.level}</p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">
                    {data.students.filter((s) => s.promotionId === p.id).length}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locales.secretariat_faculte.faculty_teachers}</CardTitle>
            <CardDescription>{locales.secretariat_faculte.faculty_teachers_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.teachers.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">
                      {t.firstName} {t.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{t.matricule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
