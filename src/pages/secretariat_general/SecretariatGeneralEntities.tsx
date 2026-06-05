// src/pages/secretariat_general/SecretariatGeneralEntities.tsx
import { useState } from "react"
import { Building2, GraduationCap, Plus, Users, BookOpen, UserSquare2, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/EmptyState"
import { Loader } from "@/components/ui/Loader"
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
import { facultyApi, promotionApi } from "@/lib/api"
import { toast } from "sonner"
import type { Promotion, AppData } from "@/types"

interface PromotionRow extends Promotion {
  facultyName: string
}

export function SecretariatGeneralEntities() {
  const [activeTab, setActiveTab] = useState("faculties")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Faculty Form
  const [facOpen, setFacOpen] = useState(false)
  const [facForm, setFacForm] = useState({ name: "", code: "", dean: "" })

  // Promotion Form
  const [promOpen, setPromOpen] = useState(false)
  const [promForm, setPromForm] = useState({
    name: "",
    level: "1",
    facultyId: "",
  })

  const { data, loading, refresh } = usePageData((d: AppData) => {
    const faculties = d.faculties.map((f) => ({
      ...f,
      studentCount: d.students.filter((s) => s.facultyId === f.id).length,
      activeStudents: d.students.filter((s) => s.facultyId === f.id && s.status === "active").length,
      courseCount: d.courses.filter((c) => c.facultyId === f.id).length,
      teacherCount: d.teachers.filter((t) => t.facultyId === f.id).length,
      promotionCount: d.promotions.filter((p) => p.facultyId === f.id).length,
    }))

    const promotionRows: PromotionRow[] = d.promotions.map(p => ({
      ...p,
      facultyName: d.faculties.find(f => f.id === p.facultyId)?.name ?? "—"
    }))

    return { faculties, promotionRows, allFaculties: d.faculties }
  })

  if (loading || !data) return <Loader fullHeight />

  const { faculties, promotionRows, allFaculties } = data

  const handleAddFaculty = async () => {
    if (!facForm.name || !facForm.code) return
    setIsSubmitting(true)
    try {
      await facultyApi.create({
        name: facForm.name,
        code: facForm.code,
        dean: facForm.dean || "À désigner",
      })
      toast.success("Faculté ajoutée avec succès")
      await refresh()
      setFacForm({ name: "", code: "", dean: "" })
      setFacOpen(false)
    } catch (err) {
      toast.error("Erreur lors de la création")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPromotion = async () => {
    if (!promForm.name || !promForm.facultyId) return
    setIsSubmitting(true)
    try {
      await promotionApi.create({
        name: promForm.name,
        level: promForm.level,
        facultyId: promForm.facultyId,
      })
      toast.success("Promotion créée avec succès")
      await refresh()
      setPromForm({ name: "", level: "1", facultyId: "" })
      setPromOpen(false)
    } catch (err) {
      toast.error("Erreur lors de la création")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const promColumns: Column<PromotionRow>[] = [
    { key: "name", header: "Promotion", render: p => <span className="font-medium">{p.name}</span> },
    { key: "level", header: "Niveau", render: p => `Année ${p.level}` },
    { key: "faculty", header: "Faculté", render: p => p.facultyName },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entités Académiques"
        subtitle="Gestion centralisée des facultés et des promotions de l'institution."
        action={
          <Button onClick={() => activeTab === "faculties" ? setFacOpen(true) : setPromOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            {activeTab === "faculties" ? "Nouvelle Faculté" : "Nouvelle Promotion"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:max-w-md">
          <TabsTrigger value="faculties" className="gap-2">
            <Building2 className="size-4" />
            Facultés
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-2">
            <GraduationCap className="size-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faculties" className="mt-6">
          {faculties.length === 0 ? (
            <EmptyState icon={Building2} title="Aucune faculté" description="Commencez par ajouter une faculté." />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {faculties.map((f: any) => (
                <Card key={f.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5">
                        <Building2 className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base text-pretty">{f.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{f.code}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Doyen :</span> {f.dean}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          Étudiants
                        </div>
                        <p className="mt-1 text-xl font-semibold text-foreground">{f.studentCount}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen className="size-3.5" />
                          Cours
                        </div>
                        <p className="mt-1 text-xl font-semibold text-foreground">{f.courseCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="promotions" className="mt-6">
          <DataTable
            columns={promColumns}
            data={promotionRows}
            rowKey={p => p.id}
            emptyTitle="Aucune promotion"
            emptyDescription="Commencez par ajouter une promotion."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={facOpen} onOpenChange={setFacOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une faculté</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la faculté</Label>
              <Input value={facForm.name} onChange={e => setFacForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Sciences Informatiques" />
            </div>
            <div className="space-y-2">
              <Label>Code / Sigle</Label>
              <Input value={facForm.code} onChange={e => setFacForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: INFO" />
            </div>
            <div className="space-y-2">
              <Label>Doyen</Label>
              <Input value={facForm.dean} onChange={e => setFacForm(f => ({ ...f, dean: e.target.value }))} placeholder="Nom du Doyen" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFacOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleAddFaculty} disabled={!facForm.name || !facForm.code || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promOpen} onOpenChange={setPromOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle Promotion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la promotion</Label>
              <Input value={promForm.name} onChange={e => setPromForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: L1 Informatique" />
            </div>
            <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={promForm.level} onValueChange={v => setPromForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["L1", "L2", "L3", "M1", "M2"].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label>Faculté</Label>
              <Select value={promForm.facultyId} onValueChange={v => setPromForm(f => ({ ...f, facultyId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une faculté..." /></SelectTrigger>
                <SelectContent>
                  {allFaculties.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleAddPromotion} disabled={!promForm.name || !promForm.facultyId || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
