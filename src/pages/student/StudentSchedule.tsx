// src/pages/student/StudentSchedule.tsx
import { CalendarOff, Clock, MapPin } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { EmptyState } from "@/components/ui/EmptyState"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { WEEK_DAYS } from "@/lib/constants"
import type { Course, ScheduleSlot } from "@/types"

export function StudentSchedule() {
  const { user } = useAuth()

  const { data, loading } = usePageData((d) => {
    const student = d.students.find((s) => s.id === user?.refId) ?? d.students[0]
    const courses = d.courses.filter((c) => c.promotionId === student.promotionId)
    const slots   = d.schedules.filter((s) => s.promotionId === student.promotionId)
    return { student, courses, slots }
  })

  if (loading || !data) return <Loader fullHeight />

  const { courses, slots } = data
  const courseOf = (id: string) => courses.find((c) => c.id === id)

  const byDay = WEEK_DAYS.map((day) => ({
    day,
    slots: slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.start.localeCompare(b.start)),
  })).filter((g) => g.slots.length > 0)

  return (
    <>
      <PageHeader
        title="Mon emploi du temps"
        subtitle="Vos séances de cours organisées par jour."
      />

      {byDay.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarOff}
              title="Aucun cours programmé"
              description="Aucune séance n'est planifiée pour votre promotion."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {byDay.map(({ day, slots: daySlots }) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {daySlots.map((slot: ScheduleSlot) => {
                    const course = courseOf(slot.courseId) as Course | undefined
                    return (
                      <li
                        key={slot.id}
                        className="rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <p className="font-medium text-foreground">{course?.name ?? "Cours"}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {slot.start} – {slot.end}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {slot.room}
                          </span>
                          {course && (
                            <span className="font-mono text-[11px]">{course.code}</span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
