// src/pages/student/StudentResources.tsx
import { ExternalLink, FolderOpen, Download } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { RESOURCE_ICONS, RESOURCE_LABELS, RESOURCE_COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { Loader } from "@/components/ui/Loader"
import type { AppData } from "@/types"

export function StudentResources() {
  const { user } = useAuth()
  const { data, loading } = usePageData((d: AppData) => {
    const student = d.students.find(s => s.id === user?.refId) || d.students[0]
    if (!student) return null

    const coursesWithResources = d.courses
      .filter((c) => c.promotionId === student.promotionId)
      .map((c) => {
        const teacher   = d.teachers.find((t) => t.id === c.teacherId)
        const resources = d.courseResources.filter((r) => r.courseId === c.id)
        return {
          ...c,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "—",
          resources,
        }
      })
      .filter((c) => c.resources.length > 0)

    return { coursesWithResources }
  })

  if (loading || !data) return <Loader fullHeight />

  const { coursesWithResources } = data
  const totalResources = coursesWithResources.reduce((acc: number, c: any) => acc + c.resources.length, 0)

  return (
    <>
      <PageHeader
        title="Ressources de cours"
        subtitle="Documents, vidéos et liens partagés par vos enseignants."
      />

      {coursesWithResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Aucune ressource disponible</p>
              <p className="text-sm text-muted-foreground">
                Vos enseignants partageront ici des documents et liens utiles.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {totalResources} ressource{totalResources !== 1 ? "s" : ""} disponible
            {totalResources !== 1 ? "s" : ""} dans {coursesWithResources.length} cours
          </p>

          <div className="space-y-6">
            {coursesWithResources.map((c: any) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{c.code}</span> · {c.teacherName}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {c.resources.length} ressource{c.resources.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {c.resources.map((r: any) => {
                      const RIcon = (RESOURCE_ICONS as any)[r.type]
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                        >
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${(RESOURCE_COLORS as any)[r.type]}`}
                          >
                            <RIcon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {r.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(RESOURCE_LABELS as any)[r.type]} · Ajouté le {r.createdAt}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {r.type === "pdf" || r.type === "doc" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => toast.success("Téléchargement démarré")}
                              >
                                <Download className="size-3.5" />
                                <span className="hidden sm:inline">Télécharger</span>
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              asChild
                            >
                              <a href={r.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3.5" />
                                <span className="hidden sm:inline">Ouvrir</span>
                              </a>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  )
}
