// src/pages/student/StudentDashboard.tsx
import { BookOpen, GaugeCircle, CalendarClock, Award } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { ScheduleGrid } from "@/components/ScheduleGrid"
import { AnnouncementList } from "@/components/AnnouncementList"
import { DashboardLayout } from "@/components/DashboardLayout"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import locales from "@/lib/locales.json"
import { getStudentDashboardData } from "@/lib/selectors"

export function StudentDashboard() {
  const { user } = useAuth()

  const { data, loading } = usePageData((d) =>
    getStudentDashboardData(d, user?.refId ?? d.students[0]?.id)
  )

  if (loading || !data) return <Loader fullHeight />

  const { student, courses, schedules, announcements, grades, validated } = data

  return (
    <DashboardLayout
      title={`${locales.common.greeting}, ${student.firstName}`}
      subtitle={`${student.matricule} · ${student.promotionId.toUpperCase()}`}
      stats={
        <>
          <KPICard
            title={locales.student.courses_enrolled}
            value={courses.length}
            subtitle={locales.student.current_semester}
            icon={BookOpen}
            colorClass="bg-chart-1/10 text-chart-1"
          />
          <KPICard
            title={locales.student.general_average}
            value={`${student.average.toFixed(1)}/20`}
            subtitle={locales.common.session_in_progress}
            icon={GaugeCircle}
            colorClass="bg-chart-2/10 text-chart-2"
          />
          <KPICard
            title={locales.rectorat.validated_grades_label}
            value={`${validated}/${grades.length}`}
            subtitle={locales.rectorat.validated}
            icon={Award}
            colorClass="bg-chart-3/15 text-chart-3"
          />
          <KPICard
            title={locales.teacher.weekly_sessions}
            value={schedules.length}
            subtitle={locales.student.schedule}
            icon={CalendarClock}
            colorClass="bg-chart-4/10 text-chart-4"
          />
        </>
      }
    >
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{locales.student.next_courses}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleGrid slots={schedules} courses={courses} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locales.student.latest_announcements}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementList items={announcements.slice(0, 3)} />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
