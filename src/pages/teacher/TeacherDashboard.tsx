// src/pages/teacher/TeacherDashboard.tsx
import { Users, FileClock, BookOpen, CalendarDays } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { ScheduleGrid } from "@/components/ScheduleGrid"
import { DashboardLayout } from "@/components/DashboardLayout"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { WEEK_DAYS_FULL } from "@/lib/constants"
import locales from "@/lib/locales.json"
import { getTeacherDashboardData } from "@/lib/selectors"

export function TeacherDashboard() {
  const { user } = useAuth()
  const todayName = WEEK_DAYS_FULL[new Date().getDay()]

  const { data, loading } = usePageData((d) =>
    getTeacherDashboardData(d, user?.refId ?? d.teachers[0]?.id, todayName)
  )

  if (loading || !data) return <Loader fullHeight />

  const { teacher, courses, students, pendingGrades, schedules, todaySlots } = data
  const hasToday = todaySlots.length > 0

  return (
    <DashboardLayout
      title={`${locales.common.greeting}, ${teacher.title} ${teacher.lastName}`}
      subtitle={`${teacher.matricule} · ${courses.length} ${locales.teacher.active_courses.toLowerCase()}`}
      stats={
        <>
          <KPICard
            title={locales.teacher.total_students}
            value={students.length}
            subtitle={locales.teacher.all_promotions}
            icon={Users}
            colorClass="bg-chart-1/10 text-chart-1"
          />
          <KPICard
            title={locales.teacher.pending_grades}
            value={pendingGrades.length}
            subtitle={locales.teacher.to_validate}
            icon={FileClock}
            colorClass="bg-chart-3/15 text-chart-3"
          />
          <KPICard
            title={locales.teacher.taught_courses}
            value={courses.length}
            subtitle={locales.student.current_semester}
            icon={BookOpen}
            colorClass="bg-chart-2/10 text-chart-2"
          />
          <KPICard
            title={locales.teacher.weekly_sessions}
            value={schedules.length}
            subtitle={locales.teacher.today_schedule}
            icon={CalendarDays}
            colorClass="bg-chart-4/10 text-chart-4"
          />
        </>
      }
    >
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{locales.teacher.today_schedule}</CardTitle>
          <CardDescription>
            {hasToday
              ? `${locales.student.schedule} ${todayName.toLowerCase()}`
              : `${locales.student.no_classes} (${todayName.toLowerCase()}) — ${locales.teacher.schedule_overview}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleGrid
            slots={hasToday ? todaySlots : schedules}
            courses={courses}
            showDay={!hasToday}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locales.teacher.my_courses}</CardTitle>
          <CardDescription>{locales.teacher.courses_charge}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {courses.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {c.credits} {locales.teacher.credits}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
