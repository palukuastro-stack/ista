// src/pages/secretariat_general/SecretariatGeneralRecours.tsx
import { useState } from "react"
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/hooks/usePageData"
import { resolveGradeAppeal } from "@/lib/store"
import type { GradeAppeal } from "@/types"
import locales from "@/lib/locales.json"

interface AppealRow extends GradeAppeal {
  studentName: string
  courseName: string
  currentScore: number
}

const STATUS_CONFIG = {
  pending: { label: "En attente", class: "border-warning text-warning" },
  approved: { label: "Approuvé", class: "border-success text-success" },
  rejected: { label: "Rejeté", class: "border-destructive text-destructive" },
}

export function SecretariatGeneralRecours() {
  const store = useStore()
  const [statusFilter, setStatusFilter] = useState<"all" | GradeAppeal["status"]>("all")
  const [resolveTarget, setResolveTarget] = useState<AppealRow | null>(null)
  const [decision, setDecision] = useState<"approved" | "rejected">("approved")
  const [response, setResponse] = useState("")

  const appeals: AppealRow[] = store.gradeAppeals.map((a) => {
    const student = store.students.find((s) => s.id === a.studentId)
    const course = store.courses.find((c) => c.id === a.courseId)
    const grade = store.grades.find((g) => g.id === a.gradeId)
    return {
      ...a,
      studentName: student ? `${student.firstName} ${student.lastName}` : a.studentId,
      courseName: course?.name ?? "Cours",
      currentScore: grade?.score ?? 0,
    }
  })

  const filtered =
    statusFilter === "all" ? appeals : appeals.filter((a) => a.status === statusFilter)

  const pending = appeals.filter((a) => a.status === "pending").length
  const approved = appeals.filter((a) => a.status === "approved").length
  const rejected = appeals.filter((a) => a.status === "rejected").length

  function handleResolve() {
    if (!resolveTarget || !response.trim()) return
    resolveGradeAppeal(resolveTarget.id, decision, response.trim())
    setResolveTarget(null)
    setResponse("")
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="flex-1 sm:w-48 sm:flex-none">
            <SelectValue placeholder={locales.apparitorat.all_status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locales.apparitorat.all_status}</SelectItem>
            <SelectItem value="pending">{locales.apparitorat.status_pending}</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="En attente"
          value={pending}
          icon={Clock}
          colorClass="bg-warning/10 text-warning"
        />
        <KPICard
          title="Approuvés"
          value={approved}
          icon={CheckCircle2}
          colorClass="bg-success/10 text-success"
        />
        <KPICard
          title="Rejetés"
          value={rejected}
          icon={XCircle}
          colorClass="bg-destructive/10 text-destructive"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Aucun recours</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "all"
                  ? "Aucun recours soumis pour le moment."
                  : `Aucun recours avec le statut « ${STATUS_CONFIG[statusFilter as GradeAppeal["status"]]?.label} ».`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold">{a.studentName}</CardTitle>
                    <CardDescription>
                      {a.courseName} · Note : {a.currentScore}/20 ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${STATUS_CONFIG[a.status].class}`}
                  >
                    {STATUS_CONFIG[a.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Motif :</p>
                  <p className="text-sm text-foreground">{a.reason}</p>
                </div>
                {a.response && (
                  <div className="rounded-md bg-chart-1/5 border border-chart-1/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Réponse :</p>
                    <p className="text-sm text-foreground">{a.response}</p>
                  </div>
                )}
                {a.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResolveTarget(a)
                      setDecision("approved")
                      setResponse("")
                    }}
                  >
                    Traiter ce recours
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={resolveTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setResolveTarget(null); setResponse("") }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Traiter le recours</DialogTitle>
          </DialogHeader>
          {resolveTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{resolveTarget.studentName}</p>
                <p className="text-muted-foreground">
                  {resolveTarget.courseName} · {resolveTarget.currentScore}/20
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{resolveTarget.reason}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Décision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approuver le recours</SelectItem>
                    <SelectItem value="rejected">Rejeter le recours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Réponse / Justification</Label>
                <Textarea
                  placeholder="Expliquez votre décision à l'étudiant…"
                  rows={3}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveTarget(null); setResponse("") }}>
              Annuler
            </Button>
            <Button onClick={handleResolve} disabled={!response.trim()}>
              Confirmer la décision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
