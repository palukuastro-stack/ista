// src/pages/student/StudentAssignments.tsx
import { useState } from "react"
import { ClipboardCheck, Clock, CheckCircle2, Star, Upload, FileType, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useStore } from "@/hooks/usePageData"
import { useCurrentStudent } from "@/hooks/useCurrentUser"
import { addSubmission, nextSubmissionId } from "@/lib/store"
import { toast } from "sonner"

export function StudentAssignments() {
  const store   = useStore()
  const student = useCurrentStudent(store)

  const myCourseIds = store.courses
    .filter((c) => c.promotionId === student.promotionId)
    .map((c) => c.id)

  const assignments = store.assignments
    .filter((a) => myCourseIds.includes(a.courseId))
    .map((a) => {
      const course      = store.courses.find((c) => c.id === a.courseId)
      const submission  = store.submissions.find(
        (s) => s.assignmentId === a.id && s.studentId === student.id,
      )
      const isOverdue = !submission && new Date(a.dueDate) < new Date()
      return { ...a, courseName: course?.name ?? "Cours", submission, isOverdue }
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const todo      = assignments.filter((a) => !a.submission && !a.isOverdue).length
  const submitted = assignments.filter((a) => a.submission).length
  const graded    = assignments.filter((a) => a.submission?.grade !== undefined).length

  const [submitTarget, setSubmitTarget] = useState<(typeof assignments)[0] | null>(null)
  const [content, setContent]           = useState("")
  const [isUploading, setIsUploading]   = useState(false)

  function handleSubmit() {
    if (!submitTarget || !content.trim()) return
    setIsUploading(true)

    // Simulate upload
    setTimeout(() => {
      addSubmission({
        id:           nextSubmissionId(),
        assignmentId: submitTarget.id,
        studentId:    student.id,
        content:      content.trim(),
        submittedAt:  new Date().toISOString(),
      })
      setIsUploading(false)
      setSubmitTarget(null)
      setContent("")
      toast.success("Travail remis avec succès")
    }, 1200)
  }

  function closeDialog() {
    setSubmitTarget(null)
    setContent("")
  }

  return (
    <>
      <PageHeader
        title="Travaux"
        subtitle="Les travaux à remettre pour vos cours ce semestre."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="À remettre" value={todo}      icon={ClipboardCheck} colorClass="bg-chart-4/10 text-chart-4" />
        <KPICard title="Remis"      value={submitted}  icon={CheckCircle2}   colorClass="bg-chart-1/10 text-chart-1" />
        <KPICard title="Corrigés"   value={graded}     icon={Star}           colorClass="bg-chart-2/10 text-chart-2" />
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun travail pour vos cours pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const statusLabel =
              a.submission?.grade !== undefined ? "Corrigé"
              : a.submission      ? "Remis"
              : a.isOverdue       ? "Délai dépassé"
              : "À remettre"

            const statusClass =
              a.submission?.grade !== undefined ? "border-success text-success"
              : a.submission      ? "border-chart-2 text-chart-2"
              : a.isOverdue       ? "border-destructive text-destructive"
              : "border-warning text-warning"

            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <CardDescription>
                        {a.courseName} · Échéance : {a.dueDate}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${statusClass}`}>
                      {statusLabel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {a.description && (
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  )}

                  {a.submission ? (
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                      <p className="mb-1 font-medium text-foreground">Ma remise :</p>
                      <p className="text-muted-foreground">{a.submission.content}</p>
                      {a.submission.grade !== undefined && (
                        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                          <span className="text-xs text-muted-foreground">Note :</span>
                          <span
                            className={`text-sm font-semibold ${
                              a.submission.grade >= 10 ? "text-success" : "text-destructive"
                            }`}
                          >
                            {a.submission.grade}/20
                          </span>
                        </div>
                      )}
                      {a.submission.feedback && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">Commentaire : </span>
                          {a.submission.feedback}
                        </p>
                      )}
                    </div>
                  ) : !a.isOverdue ? (
                    <Button size="sm" className="gap-1.5" onClick={() => setSubmitTarget(a)}>
                      <Clock className="size-4" />
                      Remettre le travail
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={submitTarget !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Remettre le travail</DialogTitle>
          </DialogHeader>
          {submitTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{submitTarget.title}</p>
                <p className="text-muted-foreground">{submitTarget.courseName}</p>
              </div>

              <div className="space-y-2">
                <Label>Téléverser un fichier (PDF, ZIP, Image)</Label>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full gap-2 py-8 border-dashed" onClick={() => toast.info("Simulation d'upload")}>
                    <Upload className="size-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Glissez-déposez ou cliquez</p>
                      <p className="text-xs text-muted-foreground">Taille max. 20Mo</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submission-content">Commentaire ou lien externe</Label>
                <Textarea
                  id="submission-content"
                  placeholder="Lien Google Drive, GitHub, ou commentaire additionnel…"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isUploading}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!content.trim() || isUploading}>
              {isUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Envoyer le travail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
