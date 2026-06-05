// src/pages/apparitorat/InscriptionDialog.tsx
import { useMemo, useState } from "react"
import { UserPlus } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import { studentApi } from "@/lib/api"
import type { AppData } from "@/types"
import { toast } from "sonner"

interface FormState {
  firstName: string
  lastName: string
  middleName: string
  birthDate: string
  email: string
  phone: string
  gender: "M" | "F" | ""
  facultyId: string
  promotionId: string
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  birthDate: "",
  email: "",
  phone: "",
  gender: "",
  facultyId: "",
  promotionId: "",
}

const selector = (d: AppData) => ({
  faculties: d.faculties,
  promotions: d.promotions,
  studentCount: d.students.length
})

export function InscriptionDialog() {
  const { data, refresh } = usePageData(selector)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredPromotions = useMemo(
    () => data?.promotions.filter((p) => !form.facultyId || p.facultyId === form.facultyId) ?? [],
    [data?.promotions, form.facultyId],
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis."
    if (!form.lastName.trim()) e.lastName = "Le nom est requis."
    if (!form.middleName.trim()) e.middleName = "Le postnom est requis."
    if (!form.birthDate) e.birthDate = "La date de naissance est requise."
    if (!form.email.trim()) e.email = "L'email est requis."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide."
    if (!form.gender) e.gender = "Le genre est requis."
    if (!form.facultyId) e.facultyId = "La faculté est requise."
    if (!form.promotionId) e.promotionId = "La promotion est requise."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const year = new Date().getFullYear()
      const seq = String((data?.studentCount ?? 0) + 1).padStart(3, "0")

      await studentApi.create({
        matricule: `ISTA-${year}-${seq}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        birthDate: form.birthDate,
        email: form.email.trim(),
        phone: form.phone.trim() || "—",
        gender: form.gender as "M" | "F",
        promotionId: form.promotionId,
        facultyId: form.facultyId,
        status: "pending",
        enrollmentDate: new Date().toISOString().slice(0, 10),
      })

      toast.success(`Inscription réussie ! Un email avec les accès a été envoyé à ${form.email}`)
      await refresh()
      setForm(EMPTY)
      setErrors({})
      setOpen(false)
    } catch (err) {
      toast.error("Erreur lors de l'inscription.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!data) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setErrors({})
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Inscrire un étudiant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle inscription</DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'étudiant. Le statut initial est « En attente ».
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName ? (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="middleName">Postnom</Label>
              <Input
                id="middleName"
                value={form.middleName}
                onChange={(e) => set("middleName", e.target.value)}
                aria-invalid={!!errors.middleName}
              />
              {errors.middleName ? (
                <p className="text-xs text-destructive">{errors.middleName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName ? (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                aria-invalid={!!errors.birthDate}
              />
              {errors.birthDate ? (
                <p className="text-xs text-destructive">{errors.birthDate}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+243 ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v as "M" | "F")}>
                <SelectTrigger aria-invalid={!!errors.gender}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender ? (
                <p className="text-xs text-destructive">{errors.gender}</p>
              ) : null}
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
                <SelectTrigger aria-invalid={!!errors.facultyId}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {data.faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.facultyId ? (
                <p className="text-xs text-destructive">{errors.facultyId}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Promotion</Label>
              <Select
                value={form.promotionId}
                onValueChange={(v) => set("promotionId", v)}
                disabled={!form.facultyId}
              >
                <SelectTrigger aria-invalid={!!errors.promotionId}>
                  <SelectValue
                    placeholder={form.facultyId ? "Sélectionner" : "Choisir une faculté"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredPromotions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.promotionId ? (
                <p className="text-xs text-destructive">{errors.promotionId}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'inscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
