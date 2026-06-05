// src/pages/apparitorat/ApparitoratRooms.tsx
import { useState } from "react"
import { DoorOpen, Plus, Loader2, Trash2, Calendar } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { usePageData } from "@/hooks/usePageData"
import { roomApi } from "@/lib/api"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { toast } from "sonner"
import type { Room } from "@/types"
import { Loader } from "@/components/ui/Loader"

export function ApparitoratRooms() {
  const { data, loading, refresh } = usePageData(d => ({ rooms: d.rooms }))
  const [createOpen, setCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    capacity: "",
    description: "",
    category: "Salle de cours" as any
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await roomApi.create({
        name: form.name,
        capacity: Number(form.capacity),
        description: form.description,
        category: form.category
      })
      toast.success("Salle ajoutée avec succès")
      await refresh()
      setCreateOpen(false)
      setForm({ name: "", capacity: "", description: "", category: "Salle de cours" })
    } catch (err) {
      toast.error("Erreur lors de la création du local")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await roomApi.delete(id)
      toast.success("Salle supprimée")
      await refresh()
    } catch (err) {
      toast.error("Erreur lors de la suppression")
      console.error(err)
    }
  }

  if (loading || !data) return <Loader fullHeight />

  const columns: Column<Room>[] = [
    { key: "name", header: "Nom de la salle", render: r => <span className="font-medium">{r.name}</span> },
    { key: "category", header: "Catégorie", render: r => <Badge variant="secondary">{r.category}</Badge> },
    { key: "capacity", header: "Places", align: "center", render: r => r.capacity },
    { key: "description", header: "Description", render: r => <span className="text-xs text-muted-foreground">{r.description}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: r => (
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
          <Trash2 className="size-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des locaux"
        subtitle="Salles de cours, laboratoires et auditoires."
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Ajouter une salle
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Liste des salles</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data.rooms}
              rowKey={r => r.id}
              emptyTitle="Aucune salle"
              emptyDescription="Commencez par ajouter une salle de cours ou un laboratoire."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Planning d'occupation
            </CardTitle>
            <CardDescription>Occupation en temps réel des locaux.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.rooms.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {i % 2 === 0 ? "Occupée par L3 Info (P. Web)" : "Libre"}
                  </p>
                </div>
                <Badge variant={i % 2 === 0 ? "destructive" : "outline"} className="text-[10px]">
                  {i % 2 === 0 ? "Occupé" : "Disponible"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un local</DialogTitle>
            <DialogDescription>Remplissez les champs ci-dessous pour créer une nouvelle salle.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la salle</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Salle A1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de places</Label>
                <Input required type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="Ex: 50" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salle de cours">Salle de cours</SelectItem>
                    <SelectItem value="Laboratoire">Laboratoire</SelectItem>
                    <SelectItem value="Auditoire">Auditoire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Ex: Équipée de projecteur..." />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
