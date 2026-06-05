// src/pages/secretariat_faculte/FacultyRecours.tsx
import { useState } from "react"
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { appealApi } from "@/lib/api"
import { toast } from "sonner"
import type { GradeAppeal, AppData } from "@/types"
import { Loader } from "@/components/ui/Loader"

interface RecoursRow extends GradeAppeal {
  studentName: string
  courseName: string
  originalScore: number
}

export function FacultyRecours() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<RecoursRow | null>(null)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, loading, refresh } = usePageData((d: AppData) => {
    const facultyId = user?.facultyId || "f1"
    const facultyCourses = d.courses.filter(c => c.facultyId === facultyId)
    const courseIds = new Set(facultyCourses.map(c => c.id))

    const recours: RecoursRow[] = d.gradeAppeals
      .filter(a => courseIds.has(a.courseId))
      .map(a => {
        const student = d.students.find(s => s.id === a.studentId)
        const course = d.courses.find(c => c.id === a.courseId)
        const grade = d.grades.find(g => g.id === a.gradeId)
        return {
          ...a,
          studentName: student ? `${student.firstName} ${student.lastName}` : "—",
          courseName: course?.name ?? "—",
          originalScore: grade?.score ?? 0
        }
      })
    return { recours }
  })

  async function handleResolve(status: "approved" | "rejected") {
    if (!selected || !response.trim()) return
    setIsSubmitting(true)
    try {
      await appealApi.resolve(selected.id, status, response)
      toast.success(status === "approved" ? "Recours validé" : "Recours rejeté")
      await refresh()
      setSelected(null)
      setResponse("")
    } catch (err) {
      toast.error("Erreur lors du traitement du recours")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !data) return <Loader fullHeight />

  const columns: Column<RecoursRow>[] = [
    {
      key: "student",
      header: "Étudiant",
      render: r => (
        <div>
          <p className="font-medium">{r.studentName}</p>
          <p className="text-[10px] text-muted-foreground">{r.courseName}</p>
        </div>
      )
    },
    { key: "reason", header: "Motif", render: r => <span className="truncate max-w-[200px] inline-block">{r.reason}</span> },
    { key: "scores", header: "Notes (Act./Est.)", render: r => <span>{r.originalScore} → {r.estimatedGrade}</span> },
    {
      key: "status",
      header: "Statut",
      render: r => {
        const config = {
          pending: { color: "bg-warning/10 text-warning", label: "En attente" },
          approved: { color: "bg-success/10 text-success", label: "Validé" },
          rejected: { color: "bg-destructive/10 text-destructive", label: "Rejeté" },
        }[r.status]
        return <Badge className={config.color + " border-0"}>{config.label}</Badge>
      }
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: r => (
        <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
          <Eye className="size-4" />
          Détails
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des recours"
        subtitle="Traitement des contestations de notes de la faculté."
      />

      <DataTable
        columns={columns}
        data={data.recours}
        rowKey={r => r.id}
        loading={loading}
        emptyTitle="Aucun recours"
        emptyDescription="Il n'y a aucune contestation de note pour le moment."
      />

      <Dialog open={selected !== null} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du recours</DialogTitle>
            <DialogDescription>
              Étudiez la demande de l'étudiant. L'accord de l'enseignant est nécessaire.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Étudiant</p>
                  <p className="font-medium">{selected.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cours</p>
                  <p className="font-medium">{selected.courseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Note actuelle</p>
                  <p className="font-medium">{selected.originalScore}/20</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Note estimée</p>
                  <p className="font-medium text-primary">{selected.estimatedGrade}/20</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Motif</p>
                <p className="rounded-md bg-muted/50 p-3 text-sm italic">"{selected.reason}"</p>
              </div>
              {selected.proofUrl && (
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <a href={selected.proofUrl} target="_blank" rel="noreferrer">Voir la preuve jointe</a>
                </Button>
              )}

              <div className="space-y-2 pt-2">
                <Label>Réponse / Explication</Label>
                <Textarea
                  placeholder="Expliquez la décision (sera visible par l'étudiant)..."
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                />
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="text-[10px] font-medium text-warning uppercase tracking-wider">Avis de l'enseignant</p>
                <p className="text-xs text-muted-foreground mt-1">L'enseignant a donné son autorisation pour la modification.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" className="flex-1" onClick={() => handleResolve("rejected")} disabled={isSubmitting || !response.trim()}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Rejeter
            </Button>
            <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleResolve("approved")} disabled={isSubmitting || !response.trim()}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
