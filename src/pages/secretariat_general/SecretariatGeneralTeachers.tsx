// src/pages/secretariat_general/SecretariatGeneralTeachers.tsx
import { useState } from "react"
import { UserSquare2, Plus, UserCheck, UserX, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { teacherApi } from "@/lib/api"
import type { Teacher, AppData } from "@/types"
import { toast } from "sonner"
import { Loader } from "@/components/ui/Loader"

interface TeacherRow extends Teacher {
  facultyName: string
  courseCount: number
}

export function SecretariatGeneralTeachers() {
  const { data, loading, refresh } = usePageData((d: AppData) => {
    const rows: TeacherRow[] = d.teachers.map((t) => ({
      ...t,
      facultyName: d.faculties.find((f) => f.id === t.facultyId)?.name ?? "—",
      courseCount: d.courses.filter((c) => c.teacherId === t.id).length,
    }))
    return { rows, faculties: d.faculties, teacherTitles: d.teacherTitles }
  })

  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName:  "",
    middleName: "",
    description: "",
    email:     "",
    phone:     "",
    facultyId: "",
    title:     "Professeur",
  })

  if (loading || !data) return <Loader fullHeight />

  const { rows, faculties } = data
  const titles = data.teacherTitles.length > 0 ? data.teacherTitles : ["Professeur", "Chef de Travaux", "Assistant"]

  const active  = rows.filter((r) => r.status === "active").length
  const pending = rows.filter((r) => r.status === "pending").length

  async function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.facultyId) return
    setIsSubmitting(true)
    try {
      const year = new Date().getFullYear()
      const seq = String(rows.length + 1).padStart(3, "0")

      await teacherApi.create({
        matricule: `ENS-${year}-${seq}`,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        middleName: form.middleName.trim(),
        description: form.description.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        facultyId: form.facultyId,
        title:     form.title,
        status:    "active",
      })

      toast.success(`Enseignant ajouté. Un email d'invitation a été envoyé à ${form.email}`)
      await refresh()
      setForm({ firstName: "", lastName: "", middleName: "", description: "", email: "", phone: "", facultyId: "", title: titles[0] })
      setOpen(false)
    } catch (err) {
      toast.error("Erreur lors de l'ajout de l'enseignant")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<TeacherRow>[] = [
    {
      key: "name",
      header: "Enseignant",
      render: (t) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{t.firstName} {t.lastName}</p>
          <p className="font-mono text-xs text-muted-foreground">{t.matricule}</p>
        </div>
      ),
    },
    { key: "title",   header: "Titre",  render: (t) => t.title },
    { key: "faculty", header: "Faculté", render: (t) => t.facultyName },
    {
      key: "email",
      header: "Email",
      render: (t) => <span className="truncate text-xs text-muted-foreground">{t.email}</span>,
    },
    {
      key: "courses",
      header: "Cours",
      align: "center",
      render: (t) => <span className="text-sm font-medium text-foreground">{t.courseCount}</span>,
    },
    {
      key: "status",
      header: "Statut",
      align: "right",
      render: (t) => (
        <div className="flex justify-end">
          <StatusBadge status={t.status} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Enseignants"
        subtitle="Gérez le corps enseignant de l'institution."
        action={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            Ajouter un enseignant
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Total enseignants" value={rows.length} icon={UserSquare2} colorClass="bg-chart-3/15 text-chart-3" />
        <KPICard title="Actifs"            value={active}      icon={UserCheck}   colorClass="bg-chart-1/10 text-chart-1" />
        <KPICard title="En attente"        value={pending}     icon={UserX}       colorClass="bg-chart-4/10 text-chart-4" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        emptyTitle="Aucun enseignant"
        emptyDescription="Ajoutez des enseignants à l'institution."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un enseignant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input
                  placeholder="Bahati"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Postnom</Label>
                <Input
                  placeholder="Mugisho"
                  value={form.middleName}
                  onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input
                  placeholder="Jean-Paul"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="prenom.nom@ista-goma.cd"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                placeholder="+243 9XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description / Bio</Label>
              <Input
                placeholder="Spécialiste en réseaux..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Faculté</Label>
                <Select
                  value={form.facultyId}
                  onValueChange={(v) => setForm((f) => ({ ...f, facultyId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {faculties.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Select
                  value={form.title}
                  onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {titles.map((t: string) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button
              onClick={handleAdd}
              disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.facultyId || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
