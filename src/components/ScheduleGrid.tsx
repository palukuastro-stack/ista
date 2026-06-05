// src/components/ScheduleGrid.tsx
import { Clock, MapPin } from "lucide-react"
import { EmptyState } from "@/components/ui/EmptyState"
import { CalendarOff } from "lucide-react"
import type { Course, ScheduleSlot } from "@/types"

interface ScheduleGridProps {
  slots: ScheduleSlot[]
  courses: Course[]
  showDay?: boolean
}

const DAY_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export function ScheduleGrid({ slots, courses, showDay = true }: ScheduleGridProps) {
  if (slots.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Aucun cours programmé"
        description="Il n'y a aucune séance planifiée pour cette période."
      />
    )
  }

  const sorted = [...slots].sort((a, b) => {
    const d = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    return d !== 0 ? d : a.start.localeCompare(b.start)
  })

  const courseName = (id: string) => courses.find((c) => c.id === id)

  return (
    <ul className="divide-y divide-border">
      {sorted.map((slot) => {
        const course = courseName(slot.courseId)
        return (
          <li key={slot.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-primary/10 py-2 text-primary">
              <span className="text-xs font-medium uppercase">
                {showDay ? slot.day.slice(0, 3) : "Auj."}
              </span>
              <span className="text-sm font-semibold">{slot.start}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {course?.name ?? "Cours"}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {slot.start} - {slot.end}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {slot.room}
                </span>
                {course ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {course.code}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
