// src/pages/secretariat_general/SecretariatGeneralDashboard.tsx
import { Users, Building2, BookOpen, UserSquare2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { AnnouncementList } from "@/components/AnnouncementList"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { usePageData } from "@/hooks/usePageData"
import locales from "@/lib/locales.json"
import { getSecretariatGeneralDashboardData } from "@/lib/selectors"

interface FacultyRow {
  id: string
  name: string
  code: string
  dean: string
  studentCount: number
  courseCount: number
  teacherCount: number
}

export function SecretariatGeneralDashboard() {
  const { data, loading } = usePageData(getSecretariatGeneralDashboardData)

  const columns: Column<FacultyRow>[] = [
    {
      key: "name",
      header: locales.secretariat_general.faculty_col,
      render: (f) => (
        <div>
          <p className="font-medium text-foreground">{f.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{f.code}</p>
        </div>
      ),
    },
    {
      key: "studentCount",
      header: locales.secretariat_general.students_col,
      align: "center",
      render: (f) => <span className="font-semibold text-foreground">{f.studentCount}</span>,
    },
    {
      key: "courseCount",
      header: locales.secretariat_general.courses_col,
      align: "center",
      className: "text-muted-foreground",
    },
    {
      key: "teacherCount",
      header: locales.secretariat_general.teachers_col,
      align: "right",
      className: "text-muted-foreground",
    },
  ]

  if (loading || !data) return <Loader fullHeight />

  return (
    <>
      <PageHeader
        title={locales.secretariat_general.dashboard_title}
        subtitle={locales.secretariat_general.dashboard_subtitle}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={locales.secretariat_general.enrolled_students}
          value={data.totalStudents}
          subtitle={`${data.activeStudents} ${locales.common.active}`}
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title={locales.secretariat_general.faculties}
          value={data.totalFaculties}
          subtitle={locales.secretariat_general.academic_entities}
          icon={Building2}
          colorClass="bg-chart-5/10 text-chart-5"
        />
        <KPICard
          title={locales.secretariat_general.teachers}
          value={data.totalTeachers}
          subtitle={locales.secretariat_general.teaching_staff}
          icon={UserSquare2}
          colorClass="bg-chart-3/15 text-chart-3"
        />
        <KPICard
          title={locales.secretariat_general.courses}
          value={data.totalCourses}
          subtitle={locales.secretariat_general.teaching_units}
          icon={BookOpen}
          colorClass="bg-chart-4/10 text-chart-4"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{locales.secretariat_general.faculty_distribution}</CardTitle>
            <CardDescription>{locales.secretariat_general.faculty_dist_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data.byFaculty}
              rowKey={(f) => f.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locales.secretariat_general.recent_announcements}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementList items={data.recentAnnouncements} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
