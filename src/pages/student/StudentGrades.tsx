// src/pages/student/StudentGrades.tsx
import { useState } from "react"
import { GaugeCircle, Award, FileClock, AlertCircle, Upload, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { appealApi } from "@/lib/api"
import type { Grade } from "@/types"
import { toast } from "sonner"
import { Loader } from "@/components/ui/Loader"

interface GradeRow extends Grade {
  courseName: string
  courseCode: string
  credits: number
  appealStatus: "pending" | "approved" | "rejected" | null
  appealMessage?: string
}

export function StudentGrades() {
  const { user } = useAuth()
  const { data, loading, refresh } = usePageData((d) => {
    const student = d.students.find(s => s.id === user?.refId) || d.students[0]
    if (!student) return null

    const grades: GradeRow[] = d.grades
      .filter((g) => g.studentId === student.id)
      .map((g) => {
        const course  = d.courses.find((c) => c.id === g.courseId)
        const appeal  = d.gradeAppeals.find(
          (a) => a.gradeId === g.id && a.studentId === student.id,
        )
        return {
          ...g,
          courseName:   course?.name     ?? "Cours",
          courseCode:   course?.code     ?? "—",
          credits:      course?.credits  ?? 0,
          appealStatus: (appeal?.status as any)   ?? null,
          appealMessage: appeal?.status_message,
        }
      })

    return { student, grades }
  })

  const [appealGrade, setAppealGrade] = useState<GradeRow | null>(null)
  const [reason, setReason] = useState("")
  const [estimatedGrade, setEstimatedGrade] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading || !data) return <Loader fullHeight />

  const { student, grades } = data
  const validated = grades.filter((g: any) => g.status === "validated").length
  const pending   = grades.filter((g: any) => g.status === "pending").length

  async function handleAppeal() {
    if (!appealGrade || !reason.trim()) return
    setIsSubmitting(true)

    try {
      await appealApi.create({
        studentId: student.id,
        courseId:  appealGrade.courseId,
        gradeId:   appealGrade.id,
        reason:    reason.trim(),
        status:    "pending",
        estimatedGrade: Number(estimatedGrade) || 0,
      })

      toast.success("Recours soumis avec succès")
      await refresh()
      setAppealGrade(null)
      setReason("")
      setEstimatedGrade("")
    } catch (err) {
      toast.error("Erreur lors de la soumission du recours")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeDialog() {
    setAppealGrade(null)
    setReason("")
  }

  const columns: Column<GradeRow>[] = [
    {
      key: "course",
      header: "Cours",
      render: (g) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{g.courseName}</p>
          <p className="font-mono text-xs text-muted-foreground">{g.courseCode}</p>
        </div>
      ),
    },
    { key: "credits", header: "Crédits", align: "center", render: (g) => g.credits },
    { key: "session", header: "Session", render: (g) => g.session },
    {
      key: "score",
      header: "Note",
      align: "center",
      render: (g) => (
        <span className={g.score >= 10 ? "font-semibold text-success" : "font-semibold text-destructive"}>
          {g.score}/20
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      align: "center",
      render: (g) => <Badge variant="secondary" className="text-[10px]">{g.type}</Badge>
    },
    {
      key: "status",
      header: "Statut",
      align: "center",
      render: (g) => <StatusBadge status={g.status} />,
    },
    {
      key: "appeal",
      header: "Recours",
      align: "right",
      render: (g) => {
        if (g.appealStatus) {
          const config = {
            pending: { color: "border-warning text-warning", label: "En cours" },
            approved: { color: "border-success text-success", label: "Validé" },
            rejected: { color: "border-destructive text-destructive", label: "Rejeté" },
          }[g.appealStatus]

          return (
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={config.color + " text-xs"}>{config.label}</Badge>
              {g.appealMessage && (
                <p className="max-w-[150px] text-right text-[10px] text-muted-foreground leading-tight">
                  {g.appealMessage}
                </p>
              )}
            </div>
          )
        }
        if (g.status !== "validated") return null
        return (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setAppealGrade(g)}>
            <AlertCircle className="size-3.5" />
            Contester
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader title="Mes notes" subtitle="Vos résultats par cours et par session." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Moyenne générale" value={`${student.average.toFixed(1)}/20`} icon={GaugeCircle} colorClass="bg-chart-2/10 text-chart-2" />
        <KPICard title="Notes validées"   value={validated}                           icon={Award}        colorClass="bg-chart-1/10 text-chart-1" />
        <KPICard title="En attente"       value={pending}                             icon={FileClock}    colorClass="bg-chart-3/15 text-chart-3" />
      </div>

      <DataTable
        columns={columns}
        data={grades}
        rowKey={(g) => g.id}
        emptyTitle="Aucune note"
        emptyDescription="Vos résultats apparaîtront ici dès leur publication."
      />

      <Dialog open={appealGrade !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contester une note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {appealGrade && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{appealGrade.courseName}</p>
                <p className="text-muted-foreground">
                  Note actuelle : <span className="font-semibold">{appealGrade.score}/20</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="estimated-grade">Note estimée</Label>
              <Input
                id="estimated-grade"
                type="number"
                min="0"
                max="20"
                placeholder="Ex: 15"
                value={estimatedGrade}
                onChange={(e) => setEstimatedGrade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motif du recours</Label>
              <Textarea
                id="reason"
                placeholder="Expliquez pourquoi vous contestez cette note…"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preuve (Image de la copie)</Label>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full gap-2" type="button" onClick={() => toast.info("Simulateur d'upload")}>
                  <Upload className="size-4" />
                  Choisir un fichier
                </Button>
                <p className="text-xs text-muted-foreground">Format JPG, PNG ou PDF (max. 5Mo)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Votre demande sera transmise au secrétariat de faculté pour analyse.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleAppeal} disabled={!reason.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Soumettre le recours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
