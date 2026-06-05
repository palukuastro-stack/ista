// src/pages/teacher/TeacherCourses.tsx
import { useState } from "react"
import { Users, Clock, BookOpen, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/hooks/usePageData"
import { useCurrentTeacher } from "@/hooks/useCurrentUser"
import { addCourseResource, removeCourseResource, nextResourceId } from "@/lib/store"
import { RESOURCE_ICONS, RESOURCE_LABELS } from "@/lib/constants"
import type { CourseResource } from "@/types"

interface ResForm {
  title: string
  type: CourseResource["type"]
  url: string
}

export function TeacherCourses() {
  const store   = useStore()
  const teacher = useCurrentTeacher(store)

  const [openCourse, setOpenCourse] = useState<string | null>(null)
  const [form, setForm] = useState<ResForm>({ title: "", type: "pdf", url: "" })

  const courses = store.courses
    .filter((c) => c.teacherId === teacher.id)
    .map((c) => ({
      ...c,
      promotionName: store.promotions.find((p) => p.id === c.promotionId)?.name ?? "—",
      studentCount:  store.students.filter((s) => s.promotionId === c.promotionId).length,
      resources:     store.courseResources.filter((r) => r.courseId === c.id),
    }))

  function handleAdd(courseId: string) {
    if (!form.title.trim() || !form.url.trim()) return
    addCourseResource({
      id:        nextResourceId(),
      courseId,
      teacherId: teacher.id,
      title:     form.title.trim(),
      type:      form.type,
      url:       form.url.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    })
    setForm({ title: "", type: "pdf", url: "" })
  }

  function resetDialog() {
    setOpenCourse(null)
    setForm({ title: "", type: "pdf", url: "" })
  }

  return (
    <>
      <PageHeader title="Mes cours" subtitle="Les cours dont vous avez la charge ce semestre." />

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun cours ne vous est assigné pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {c.credits} crédits
                  </span>
                </div>
                <CardTitle className="text-base text-pretty">{c.name}</CardTitle>
                <CardDescription>{c.promotionName}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />{c.studentCount} étudiants
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />{c.hours}h
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3">
                <Dialog
                  open={openCourse === c.id}
                  onOpenChange={(open) => (open ? setOpenCourse(c.id) : resetDialog())}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      <BookOpen className="size-4" />
                      Ressources
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {c.resources.length}
                      </Badge>
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Ressources — {c.name}</DialogTitle>
                    </DialogHeader>

                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {c.resources.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Aucune ressource ajoutée.
                        </p>
                      ) : (
                        c.resources.map((r) => {
                          const RIcon = RESOURCE_ICONS[r.type]
                          return (
                            <div
                              key={r.id}
                              className="flex items-center gap-3 rounded-lg border border-border p-3"
                            >
                              <RIcon className="size-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                                <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {RESOURCE_LABELS[r.type]}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeCourseResource(r.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <p className="text-sm font-semibold text-foreground">Ajouter une ressource</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <Label>Titre de la ressource</Label>
                          <Input
                            placeholder="Ex : Introduction au chapitre 1"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Type de ressource</Label>
                          <Select
                            value={form.type}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, type: v as CourseResource["type"] }))
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">Fichier PDF</SelectItem>
                              <SelectItem value="video">Lien Vidéo (YouTube...)</SelectItem>
                              <SelectItem value="link">Lien Web / Article</SelectItem>
                              <SelectItem value="doc">Document (Word, PPT...)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>URL / Lien de téléchargement</Label>
                          <Input
                            placeholder="https://votre-lien.com/fichier"
                            value={form.url}
                            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        onClick={() => handleAdd(c.id)}
                        disabled={!form.title.trim() || !form.url.trim()}
                        className="gap-1.5"
                      >
                        <Plus className="size-4" />
                        Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
