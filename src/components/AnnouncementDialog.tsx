// src/components/AnnouncementDialog.tsx
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addAnnouncement } from "@/lib/store"
import { useAuth } from "@/contexts/AuthContext"
import { usePageData } from "@/hooks/usePageData"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Role } from "@/types"

interface AnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnouncementDialog({ open, onOpenChange }: AnnouncementDialogProps) {
  const { user } = useAuth()
  const { data } = usePageData(d => d)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState<"info" | "important" | "urgent">("info")
  const [scope, setScope] = useState<"global" | "faculty" | "course">("global")
  const [targetId, setTargetId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const canCreateGlobal = ["rectorat", "secretariat_general", "apparitorat"].includes(user?.role || "")
  const canCreateFacultyAnnouncement = user?.role === "secretariat_faculte"
  const canCreateCourse = user?.role === "teacher"

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newAnnouncement = {
      id: `a-${Date.now()}`,
      title,
      body,
      author: user?.firstName + " " + user?.lastName,
      date: new Date().toISOString().split("T")[0],
      audience: (scope === "global" ? "all" : "student") as any,
      priority,
      scope,
      targetId: scope === "global" ? undefined : targetId,
    }

    setTimeout(() => {
      addAnnouncement(newAnnouncement)
      setIsLoading(false)
      onOpenChange(false)
      toast.success("Annonce créée avec succès")
      setTitle("")
      setBody("")
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un communiqué</DialogTitle>
          <DialogDescription>
            Diffusez une information importante aux membres de l'université.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Portée</Label>
              <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canCreateGlobal && <SelectItem value="global">Global</SelectItem>}
                  {canCreateFacultyAnnouncement && <SelectItem value="faculty">Faculté</SelectItem>}
                  {canCreateCourse && <SelectItem value="course">Cours</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {scope === "faculty" && data && (
            <div className="space-y-2">
              <Label>Faculté cible</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une faculté" />
                </SelectTrigger>
                <SelectContent>
                  {data.faculties.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "course" && data && (
            <div className="space-y-2">
              <Label>Cours cible</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un cours" />
                </SelectTrigger>
                <SelectContent>
                  {data.courses.filter(c => c.teacherId === user?.refId).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Diffuser l'annonce
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
