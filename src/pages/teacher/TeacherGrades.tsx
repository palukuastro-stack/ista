import { useState, useMemo, useEffect } from "react"
import { CheckCircle2, Plus, Loader2, Search, Filter, History, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/Loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { gradeApi } from "@/lib/api"
import type { Grade, Student } from "@/types"

interface GradeStudent extends Student {
  grade?: Grade
}

export function TeacherGrades() {
  const { user } = useAuth()
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [assessmentTitle, setAssessmentTitle] = useState<string>("")
  const [assessmentType, setAssessmentType] = useState<Grade["type"]>("Interro")
  const [session, setSession] = useState<string>("Session Normale")

  const { data, loading, refresh } = usePageData((d) => {
    const teacherId = user?.refId
    const teacher = d.teachers.find((t) => t.id === teacherId) || d.teachers[0]
    if (!teacher) return { teacher: null, courses: [], students: [], grades: [] }

    const courses = d.courses.filter((c) => c.teacherId === teacher.id)
    return { teacher, courses, students: d.students, grades: d.grades }
  })

  useEffect(() => {
    if (data?.courses.length && !selectedCourseId) {
      setSelectedCourseId(data.courses[0].id)
    }
  }, [data?.courses, selectedCourseId])

  const currentCourse = data?.courses.find(c => c.id === selectedCourseId)

  const studentsInPromotion = useMemo(() => {
    if (!currentCourse || !data?.students) return []
    return data.students.filter(s => s.promotionId === currentCourse.promotionId)
  }, [currentCourse, data?.students])

  const gradedContext = useMemo(() => {
    if (!selectedCourseId || !assessmentTitle || !data?.grades) return []

    return studentsInPromotion.map(student => {
      const grade = data.grades.find(g =>
        g.studentId === student.id &&
        g.courseId === selectedCourseId &&
        g.type === assessmentType &&
        g.assessment_title === assessmentTitle
      )
      return { ...student, grade }
    })
  }, [selectedCourseId, assessmentTitle, assessmentType, data?.grades, studentsInPromotion])

  const alreadyGraded = gradedContext.filter(s => !!s.grade)
  const toBeGraded = gradedContext.filter(s => !s.grade)

  const handleScoreChange = async (studentId: string, scoreStr: string) => {
    if (!selectedCourseId || !assessmentTitle) {
      toast.error("Veuillez sélectionner un cours et donner un titre à l'évaluation")
      return
    }

    const score = parseFloat(scoreStr)
    if (isNaN(score) || score < 0 || score > 20) return

    try {
      await gradeApi.upsert({
        studentId,
        courseId: selectedCourseId,
        promotionId: currentCourse!.promotionId,
        score,
        session,
        type: assessmentType,
        assessmentTitle
      })
      toast.success("Note enregistrée")
      await refresh()
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const columnsAlreadyGraded: Column<GradeStudent>[] = [
    {
      key: "student",
      header: "Étudiant",
      render: (s) => (
        <div>
          <p className="font-medium">{s.firstName} {s.lastName}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{s.matricule}</p>
        </div>
      )
    },
    {
      key: "score",
      header: "Note /20",
      align: "right",
      render: (s) => (
        <div className="flex justify-end items-center gap-2">
          <Input
            type="number"
            className="w-20 h-8 text-right font-bold"
            defaultValue={s.grade?.score}
            onBlur={(e) => handleScoreChange(s.id, e.target.value)}
            step="0.5"
            min="0"
            max="20"
          />
        </div>
      )
    }
  ]

  const columnsToBeGraded: Column<GradeStudent>[] = [
    {
      key: "student",
      header: "Étudiant",
      render: (s) => (
        <div>
          <p className="font-medium">{s.firstName} {s.lastName}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{s.matricule}</p>
        </div>
      )
    },
    {
      key: "score",
      header: "Saisir la note",
      align: "right",
      render: (s) => (
        <div className="flex justify-end">
          <Input
            type="number"
            placeholder="—"
            className="w-20 h-8 text-right"
            onBlur={(e) => handleScoreChange(s.id, e.target.value)}
            step="0.5"
            min="0"
            max="20"
          />
        </div>
      )
    }
  ]

  if (loading || !data || !data.teacher) return <Loader fullHeight />

  const { courses } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des cotes"
        subtitle="Saisissez les notes par évaluation. Les étudiants passent automatiquement en section 'Déjà cotés'."
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Cours</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre de l'évaluation</Label>
              <Input
                placeholder="Ex: Chapitre 1, Examen Mi-Semestre..."
                className="bg-background"
                value={assessmentTitle}
                onChange={e => setAssessmentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={assessmentType} onValueChange={(v: any) => setAssessmentType(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interro">Interrogation</SelectItem>
                  <SelectItem value="TP">Travail Pratique</SelectItem>
                  <SelectItem value="TD">Travaux Dirigés</SelectItem>
                  <SelectItem value="Examen">Examen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Session Normale">Session Normale</SelectItem>
                  <SelectItem value="Rattrapage">Rattrapage</SelectItem>
                  <SelectItem value="Travail pratique">Travail pratique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!assessmentTitle ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Filter className="mb-4 size-12 opacity-20" />
            <p>Veuillez donner un <strong>titre</strong> à votre évaluation pour commencer la saisie.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                  {toBeGraded.length}
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">À coter</h3>
              </div>
            </div>
            <DataTable
              columns={columnsToBeGraded}
              data={toBeGraded}
              rowKey={s => s.id}
              emptyTitle="Tout est en ordre"
              emptyDescription="Tous les étudiants de cette promotion ont été cotés pour cette évaluation."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600">
                  {alreadyGraded.length}
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Déjà cotés</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">Modifiable</Badge>
            </div>
            <DataTable
              columns={columnsAlreadyGraded}
              data={alreadyGraded}
              rowKey={s => s.id}
              emptyTitle="Aucune note"
              emptyDescription="Saisissez une note dans la colonne de gauche pour commencer."
            />
          </div>
        </div>
      )}
    </div>
  )
}
