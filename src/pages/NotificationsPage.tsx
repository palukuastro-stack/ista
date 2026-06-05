import { useState } from "react"
import { Bell, Megaphone, CheckCheck, Star, AlertCircle, BookMarked, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnnouncementList } from "@/components/AnnouncementList"
import { AnnouncementDialog } from "@/components/AnnouncementDialog"
import { Loader } from "@/components/ui/Loader"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"
import locales from "@/lib/locales.json"

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: any; label: string; color: string }
> = {
  grade_modified: {
    icon: Star,
    label: locales.common.type_grade_modified,
    color: "bg-chart-2/10 text-chart-2",
  },
  new_appeal: {
    icon: AlertCircle,
    label: locales.common.type_new_appeal,
    color: "bg-warning/10 text-warning",
  },
  appeal_resolved: {
    icon: CheckCheck,
    label: locales.common.type_appeal_resolved,
    color: "bg-success/10 text-success",
  },
  course_assigned: {
    icon: BookMarked,
    label: locales.common.type_course_assigned,
    color: "bg-chart-5/10 text-chart-5",
  },
}

function relativeDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return locales.common.just_now
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("announcements")
  const [dialogOpen, setDialogOpen] = useState(false)

  const canCreate = ["rectorat", "secretariat_general", "apparitorat", "secretariat_faculte", "teacher"].includes(user?.role || "")

  const { data, loading } = usePageData((d) => {
    const student = user?.role === "student" ? d.students.find(s => s.id === user.refId) : null

    const announcements = d.announcements
      .filter((a) => {
        // Global scope: everyone who matches audience
        if (a.scope === "global") {
          return a.audience === "all" || a.audience === user?.role
        }

        // Faculty scope: students of that faculty
        if (a.scope === "faculty") {
          if (user?.role === "student") {
            return student?.facultyId === a.targetId
          }
          if (user?.role === "secretariat_faculte") {
            // Secretaire of that faculty can see it too
            // Assuming we would check the secretary's faculty here
            return true
          }
          return false
        }

        // Course scope: students in that course
        if (a.scope === "course") {
          if (user?.role === "student") {
            // Check if student has a grade in this course (as proxy for being in it)
            // or just has access to it.
            return d.grades.some(g => g.studentId === student?.id && g.courseId === a.targetId)
          }
          if (user?.role === "teacher") {
            const teacher = d.teachers.find(t => t.id === user.refId)
            return teacher?.courseIds.includes(a.targetId || "")
          }
          return false
        }

        return false
      })
      .sort((a, b) => b.date.localeCompare(a.date))
    
    const notifications = d.notifications
      .filter((n) => n.targetRole === user?.role)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return { announcements, notifications }
  })

  if (loading || !data) return <Loader fullHeight />

  const { announcements, notifications } = data
  const unreadNotifications = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title={locales.common.notifications_title}
          subtitle={locales.common.notifications_subtitle}
        />
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{locales.common.create_announcement}</span>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:max-w-md">
          <TabsTrigger value="announcements" className="gap-1.5 px-2 text-xs sm:text-sm">
            <Megaphone className="hidden size-4 sm:block" />
            {locales.common.announcements_tab}
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 py-0 text-[10px]">
              {announcements.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 px-2 text-xs sm:text-sm">
            <Bell className="hidden size-4 sm:block" />
            {locales.common.notifications_tab}
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-0.5 h-5 px-1.5 py-0 text-[10px]">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-4 sm:mt-6">
          <Card className="overflow-hidden border-0 shadow-none sm:border sm:shadow-sm">
            <CardContent className="p-0">
              <AnnouncementList items={announcements} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 sm:mt-6">
          {notifications.length === 0 ? (
            <Card className="border-0 shadow-none sm:border sm:shadow-sm">
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="size-6 text-muted-foreground" />
                </div>
                <div className="text-center px-4">
                  <p className="font-medium text-foreground">{locales.common.no_notifications}</p>
                  <p className="text-sm text-muted-foreground">
                    {locales.common.no_notifications_desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                {unreadNotifications > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => user?.role && markAllNotificationsRead(user.role)}
                  >
                    <CheckCheck className="size-3.5" />
                    {locales.common.mark_all_read}
                  </Button>
                )}
              </div>
              <div className="grid gap-3">
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type]
                  const NIcon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markNotificationRead(n.id)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-all active:scale-[0.98] sm:gap-4 sm:p-4",
                        !n.read ? "border-primary/30 bg-primary/5" : "bg-card hover:bg-accent/30",
                      )}
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11 sm:rounded-lg", cfg.color)}>
                        <NIcon className="size-5 sm:size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 sm:text-xs">
                            {cfg.label}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {relativeDate(n.createdAt)}
                          </span>
                        </div>
                        <p className={cn(
                          "mt-1 text-sm leading-snug text-foreground sm:text-base",
                          !n.read ? "font-medium" : "font-normal text-muted-foreground/90"
                        )}>
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="mt-1 size-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/10" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AnnouncementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
