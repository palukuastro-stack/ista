// src/pages/rectorat/RectoratFaculties.tsx
import { Building2, Users, BookOpen, GraduationCap, UserSquare2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Loader } from "@/components/ui/Loader"
import { usePageData } from "@/hooks/usePageData"

interface FacultyRow {
  id: string
  name: string
  code: string
  dean: string
  studentCount: number
  activeCount: number
  teacherCount: number
  courseCount: number
  promotionCount: number
}

export function RectoratFaculties() {
  const { data, loading } = usePageData((d) => {
    const rows: FacultyRow[] = d.faculties.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      dean: f.dean,
      studentCount: d.students.filter((s) => s.facultyId === f.id).length,
      activeCount: d.students.filter((s) => s.facultyId === f.id && s.status === "active").length,
      teacherCount: d.teachers.filter((t) => t.facultyId === f.id).length,
      courseCount: d.courses.filter((c) => c.facultyId === f.id).length,
      promotionCount: d.promotions.filter((p) => p.facultyId === f.id).length,
    }))
    return rows
  })

  if (loading || !data) return <Loader fullHeight />

  const totalStudents = data.reduce((acc, f) => acc + f.studentCount, 0)
  const totalTeachers = data.reduce((acc, f) => acc + f.teacherCount, 0)
  const totalCourses = data.reduce((acc, f) => acc + f.courseCount, 0)

  const columns: Column<FacultyRow>[] = [
    {
      key: "faculty",
      header: "Faculté",
      render: (f) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{f.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{f.code}</p>
        </div>
      ),
    },
    {
      key: "dean",
      header: "Doyen",
      render: (f) => <span className="text-muted-foreground">{f.dean}</span>,
    },
    {
      key: "students",
      header: "Étudiants",
      align: "center",
      render: (f) => (
        <div className="text-center">
          <p className="font-semibold text-foreground">{f.studentCount}</p>
          <p className="text-xs text-muted-foreground">{f.activeCount} actifs</p>
        </div>
      ),
    },
    {
      key: "promotions",
      header: "Promotions",
      align: "center",
      render: (f) => f.promotionCount,
    },
    {
      key: "courses",
      header: "Cours",
      align: "center",
      render: (f) => f.courseCount,
    },
    {
      key: "teachers",
      header: "Enseignants",
      align: "center",
      render: (f) => f.teacherCount,
    },
  ]

  return (
    <>
      <PageHeader
        title="Facultés"
        subtitle="Pilotage institutionnel par entité académique."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Total étudiants"
          value={totalStudents}
          subtitle={`${data.length} facultés`}
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title="Enseignants"
          value={totalTeachers}
          subtitle="Corps enseignant"
          icon={UserSquare2}
          colorClass="bg-chart-3/15 text-chart-3"
        />
        <KPICard
          title="Cours"
          value={totalCourses}
          subtitle="Unités d'enseignement"
          icon={BookOpen}
          colorClass="bg-chart-4/10 text-chart-4"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(f) => f.id}
        emptyTitle="Aucune faculté"
        emptyDescription="Aucune faculté n'est enregistrée."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">{f.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{f.code}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/50 p-2">
                  <Users className="mx-auto mb-1 size-4 text-muted-foreground" />
                  <p className="text-lg font-bold text-foreground">{f.studentCount}</p>
                  <p className="text-[10px] text-muted-foreground">étudiants</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <GraduationCap className="mx-auto mb-1 size-4 text-muted-foreground" />
                  <p className="text-lg font-bold text-foreground">{f.promotionCount}</p>
                  <p className="text-[10px] text-muted-foreground">promos</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <BookOpen className="mx-auto mb-1 size-4 text-muted-foreground" />
                  <p className="text-lg font-bold text-foreground">{f.courseCount}</p>
                  <p className="text-[10px] text-muted-foreground">cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
