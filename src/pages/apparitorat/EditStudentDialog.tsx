// src/pages/apparitorat/EditStudentDialog.tsx
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/hooks/usePageData"
import { updateStudent } from "@/lib/store"
import type { Student } from "@/types"
import { toast } from "sonner"
import locales from "@/lib/locales.json"
import { useAuth } from "@/contexts/AuthContext"

interface EditStudentDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
  const store = useStore()
  const { role } = useAuth()
  const [form, setForm] = useState<Student | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (student) {
      setForm({ ...student })
    }
  }, [student])

  const promotions = useMemo(
    () => store.promotions.filter((p) => !form?.facultyId || p.facultyId === form.facultyId),
    [store.promotions, form?.facultyId],
  )

  if (!form) return null

  const set = <K extends keyof Student>(key: K, value: Student[K]) => {
    setForm((f) => f ? ({ ...f, [key]: value }) : null)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis."
    if (!form.lastName.trim()) e.lastName = "Le nom est requis."
    if (!form.email.trim()) e.email = "L'email est requis."
    if (!form.facultyId) e.facultyId = "La faculté est requise."
    if (!form.promotionId) e.promotionId = "La promotion est requise."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    updateStudent(form)
    toast.success(`${locales.apparitorat.student} mis à jour avec succès`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{locales.apparitorat.edit_student_title}</DialogTitle>
          <DialogDescription>
            {locales.apparitorat.edit_student_desc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastName">Nom</Label>
              <Input
                id="edit-lastName"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-middleName">Postnom</Label>
              <Input
                id="edit-middleName"
                value={form.middleName}
                onChange={(e) => set("middleName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-firstName">Prénom</Label>
              <Input
                id="edit-firstName"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as any)}
                disabled={role !== "secretariat_general"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{locales.apparitorat.status_active}</SelectItem>
                  <SelectItem value="suspended">{locales.apparitorat.status_suspended}</SelectItem>
                  <SelectItem value="excluded">{locales.apparitorat.status_excluded}</SelectItem>
                </SelectContent>
              </Select>
              {role !== "secretariat_general" && (
                <p className="text-[10px] text-muted-foreground italic">
                  Modification réservée au Secrétariat Général
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v as "M" | "F")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Faculté</Label>
              <Select
                value={form.facultyId}
                onValueChange={(v) => {
                  set("facultyId", v)
                  set("promotionId", "")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {store.faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Promotion</Label>
              <Select
                value={form.promotionId}
                onValueChange={(v) => set("promotionId", v)}
                disabled={!form.facultyId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {promotions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{locales.apparitorat.save_button}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
