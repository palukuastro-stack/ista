// src/pages/secretariat_faculte/FacultyCourses.tsx
import { useState } from "react"
import { BookOpen, Clock, UserCheck, DoorOpen, Trash2, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { courseApi, scheduleApi } from "@/lib/api"
import { enrichCourse } from "@/lib/selectors"
import type { Course, ScheduleSlot, AppData } from "@/types"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/Loader"

interface CourseRow extends Course {
  promotionName: string
  teacherName: string
  teacherTitle: string
  roomName: string
  schedules: ScheduleSlot[]
}

export function FacultyCourses() {
  const { user } = useAuth()
  const facultyId = user?.facultyId || "f1"

  const { data, loading, refresh } = usePageData((d: AppData) => {
    const rows: CourseRow[] = d.courses.map(c => enrichCourse(d, c))
    return {
      rows,
      faculties: d.faculties,
      promotions: d.promotions,
      teachers: d.teachers,
      rooms: d.rooms
    }
  })

  const [promotionFilter, setPromotionFilter] = useState("all")
  const [assignTeacherTarget, setAssignTeacherTarget] = useState<CourseRow | null>(null)
  const [manageSlotsTarget, setManageSlotsTarget] = useState<CourseRow | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [selectedDay, setSelectedDay] = useState<ScheduleSlot["day"]>("Lundi")
  const [timeSlot, setTimeSlot] = useState<"matin" | "apres_midi" | "journee">("matin")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading || !data) return <Loader fullHeight />

  const filtered = data.rows.filter((r) => {
    const isSameFaculty = r.facultyId === facultyId
    const isSamePromotion = promotionFilter === "all" || r.promotionId === promotionFilter
    return isSameFaculty && isSamePromotion
  })

  const totalHours = filtered.reduce((acc, r) => acc + r.hours, 0)
  const totalCredits = filtered.reduce((acc, r) => acc + r.credits, 0)

  const teachersForDialog = assignTeacherTarget
    ? data.teachers.filter((t) => t.facultyId === assignTeacherTarget.facultyId)
    : []

  async function handleAssignTeacher() {
    if (!assignTeacherTarget || !selectedTeacherId) return
    setIsSubmitting(true)
    try {
      await courseApi.assignTeacher(assignTeacherTarget.id, selectedTeacherId)
      toast.success("Enseignant mis à jour")
      await refresh()
      setAssignTeacherTarget(null)
      setSelectedTeacherId("")
    } catch (err) {
      toast.error("Erreur lors de l'attribution")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddSlot() {
    if (!manageSlotsTarget || !selectedRoomId || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    const start = timeSlot === "apres_midi" ? "13:00" : "08:00"
    const end = timeSlot === "matin" ? "12:00" : "17:00"

    setIsSubmitting(true)
    try {
      await scheduleApi.create({
        courseId: manageSlotsTarget.id,
        promotionId: manageSlotsTarget.promotionId,
        teacherId: manageSlotsTarget.teacherId,
        day: selectedDay,
        start_time: start,
        end_time: end,
        room: selectedRoomId,
        startDate,
        endDate
      })

      toast.success("Horaire ajouté avec succès")
      await refresh()
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveSlot(slotId: string) {
    try {
      await scheduleApi.delete(slotId)
      toast.success("Horaire supprimé")
      await refresh()
    } catch (err) {
      toast.error("Erreur lors de la suppression")
      console.error(err)
    }
  }

  function resetForm() {
    setSelectedRoomId("")
    setSelectedDay("Lundi")
    setTimeSlot("matin")
    setStartDate("")
    setEndDate("")
  }

  const columns: Column<CourseRow>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => <span className="font-mono text-xs">{c.code}</span>,
    },
    {
      key: "name",
      header: "Cours",
      render: (c) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.promotionName}</p>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Enseignant",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground">{c.teacherName}</p>
            {c.teacherTitle && (
              <p className="text-xs text-muted-foreground">{c.teacherTitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 text-xs"
            onClick={() => {
              setAssignTeacherTarget(c)
              setSelectedTeacherId(c.teacherId || "")
            }}
          >
            <UserCheck className="size-3.5" />
            Changer
          </Button>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Horaires & Salles",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {c.schedules.length > 0 ? (
              <div className="space-y-0.5">
                {c.schedules.map((s, idx) => (
                  <p key={idx} className="text-[10px] leading-tight text-muted-foreground uppercase">
                    {s.day} {s.start_time}-{s.end_time} · {data.rooms.find(r => r.id === s.room)?.name || s.room}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic uppercase">Non programmé</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => {
              setManageSlotsTarget(c)
              resetForm()
            }}
          >
            <Clock className="size-3.5" />
          </Button>
        </div>
      )
    },
    {
      key: "credits",
      header: "Crédits",
      align: "center",
      render: (c) => (
        <Badge variant="secondary" className="text-xs">
          {c.credits}
        </Badge>
      ),
    },
    {
      key: "hours",
      header: "Heures",
      align: "center",
      render: (c) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="size-3.5" />
          {c.hours}h
        </span>
      ),
    },
  ]

  const facultyPromotions = data.promotions.filter(p => p.facultyId === facultyId)

  return (
    <>
      <PageHeader
        title="Cours"
        subtitle="Catalogue des cours — attribuez chaque cours à un enseignant et gérez les horaires."
        action={
          <Select value={promotionFilter} onValueChange={setPromotionFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Toutes les promotions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les promotions</SelectItem>
              {facultyPromotions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPICard
          title="Cours"
          value={filtered.length}
          subtitle="Unités d'enseignement"
          icon={BookOpen}
          colorClass="bg-chart-4/10 text-chart-4"
        />
        <KPICard
          title="Volume horaire total"
          value={`${totalHours}h`}
          subtitle={`${totalCredits} crédits`}
          icon={Clock}
          colorClass="bg-chart-2/10 text-chart-2"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(c) => c.id}
        emptyTitle="Aucun cours"
        emptyDescription="Aucun cours à afficher pour cette faculté."
      />

      <Dialog
        open={assignTeacherTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setAssignTeacherTarget(null); setSelectedTeacherId("") }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Attribuer un enseignant</DialogTitle>
          </DialogHeader>
          {assignTeacherTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{assignTeacherTarget.name}</p>
                <p className="text-muted-foreground">{assignTeacherTarget.promotionName}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Enseignant</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachersForDialog.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                        <span className="ml-1 text-muted-foreground">({t.title})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAssignTeacherTarget(null); setSelectedTeacherId("") }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignTeacher}
              disabled={!selectedTeacherId || selectedTeacherId === assignTeacherTarget?.teacherId || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Attribuer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={manageSlotsTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setManageSlotsTarget(null); resetForm() }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer l'horaire</DialogTitle>
          </DialogHeader>
          {manageSlotsTarget && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{manageSlotsTarget.name}</p>
                <p className="text-muted-foreground">{manageSlotsTarget.promotionName}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horaires actuels</p>
                <div className="divide-y rounded-md border">
                  {manageSlotsTarget.schedules.length === 0 ? (
                    <p className="p-3 text-center text-xs text-muted-foreground">Aucun horaire programmé</p>
                  ) : (
                    manageSlotsTarget.schedules.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <p className="font-medium uppercase">{s.day} {s.start_time}-{s.end_time}</p>
                          <p className="text-muted-foreground">{data.rooms.find(r => r.id === s.room)?.name || s.room} · {s.startDate} au {s.endDate}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleRemoveSlot(s.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-accent/30 p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Ajouter un créneau</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">Salle</Label>
                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Salle…" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">Jour</Label>
                    <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v as any)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">Horaire</Label>
                    <Select value={timeSlot} onValueChange={(v) => setTimeSlot(v as any)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matin">08-12h</SelectItem>
                        <SelectItem value="apres_midi">13-17h</SelectItem>
                        <SelectItem value="journee">08-17h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">Du</Label>
                    <Input type="date" className="h-8 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] uppercase">Au</Label>
                    <Input type="date" className="h-8 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" className="w-full h-8 text-xs font-bold uppercase tracking-widest" onClick={handleAddSlot} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : "Ajouter ce créneau"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageSlotsTarget(null)} disabled={isSubmitting}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
