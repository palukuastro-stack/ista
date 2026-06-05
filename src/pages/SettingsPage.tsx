// src/pages/SettingsPage.tsx
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/PageHeader"
import locales from "@/lib/locales.json"
import { usePageData } from "@/hooks/usePageData"
import { Badge } from "@/components/ui/badge"
import { User, Shield, GraduationCap, BookOpen, Briefcase } from "lucide-react"

export function SettingsPage() {
  const { user } = useAuth()
  const { data } = usePageData((d) => d)

  const student = user?.role === "student" ? data?.students.find(s => s.id === user.refId) : null
  const teacher = user?.role === "teacher" ? data?.teachers.find(t => t.id === user.refId) : null
  const faculty = (student || teacher) ? data?.faculties.find(f => f.id === (student?.facultyId || teacher?.facultyId)) : null
  const promotion = student ? data?.promotions.find(p => p.id === student.promotionId) : null

  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API update
    setTimeout(() => {
      setIsLoading(false)
      toast.success(locales.common.success_update)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={locales.settings.settings_title}
        subtitle={locales.settings.profile_desc}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations Professionnelles</CardTitle>
            <CardDescription>
              Détails liés à votre statut au sein de l'institution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                {user?.role === "student" ? <GraduationCap className="size-10" /> :
                 user?.role === "teacher" ? <BookOpen className="size-10" /> :
                 <Shield className="size-10" />}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold uppercase italic">{user?.firstName} {user?.lastName}</h3>
                <Badge variant="secondary" className="mt-1 font-bold uppercase tracking-widest text-[10px]">
                  {locales.portals[user?.role as keyof typeof locales.portals]}
                </Badge>
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-muted/30 p-4">
              {student && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matricule</span>
                    <span className="font-mono text-sm font-bold">{student.matricule}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promotion</span>
                    <span className="text-sm font-bold uppercase">{promotion?.name || student.promotionId}</span>
                  </div>
                </>
              )}
              {teacher && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matricule</span>
                    <span className="font-mono text-sm font-bold">{teacher.matricule}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titre</span>
                    <span className="text-sm font-bold uppercase">{teacher.title}</span>
                  </div>
                </>
              )}
              {faculty && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Faculté</span>
                  <span className="text-sm font-bold uppercase">{faculty.name}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identifiant Système</span>
                <span className="font-mono text-[10px]">{user?.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{locales.settings.profile_settings}</CardTitle>
            <CardDescription>
              {locales.settings.profile_desc}
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-email">{locales.settings.email_label}</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-phone">{locales.settings.phone_label}</Label>
                <Input
                  id="settings-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+243..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-password">{locales.settings.new_password_label}</Label>
              <div className="relative max-w-sm">
                <Input
                  id="settings-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={locales.settings.password_placeholder}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? locales.common.hide_password : locales.common.show_password}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {locales.settings.save_changes}
            </Button>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
