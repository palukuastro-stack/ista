// src/pages/rectorat/RectoratDashboard.tsx
import { Users, GraduationCap, TrendingUp, BookOpen } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { usePageData } from "@/hooks/usePageData"
import { useAuth } from "@/contexts/AuthContext"
import locales from "@/lib/locales.json"
import { getRectoratDashboardData } from "@/lib/selectors"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

export function RectoratDashboard() {
  const { user } = useAuth()

  const { data, loading } = usePageData(getRectoratDashboardData)

  if (loading || !data) return <Loader fullHeight />

  const userName = user ? `${user.firstName} ${user.lastName}` : locales.rectorat.fallback_name

  return (
    <>
      <PageHeader
        title={`${locales.common.greeting}, ${userName}`}
        subtitle={locales.rectorat.title_desc}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={locales.rectorat.students}
          value={data.totalStudents}
          subtitle={`${data.activeStudents} ${locales.rectorat.active_students}`}
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title={locales.rectorat.faculties}
          value={data.totalFaculties}
          subtitle={locales.rectorat.academic_entities}
          icon={GraduationCap}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <KPICard
          title={locales.rectorat.active_courses}
          value={data.totalCourses}
          subtitle={locales.common.semester}
          icon={BookOpen}
          colorClass="bg-chart-4/10 text-chart-4"
        />
        <KPICard
          title={locales.rectorat.pending_grades}
          value={data.pendingGrades}
          subtitle={`${data.validatedGrades} ${locales.rectorat.validated}`}
          icon={TrendingUp}
          colorClass="bg-chart-3/15 text-chart-3"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{locales.rectorat.students_by_faculty}</CardTitle>
            <CardDescription>{locales.rectorat.students_enrolled}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byFaculty} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  labelFormatter={(label: string) => {
                    const item = data.byFaculty.find((f) => f.name === label)
                    return item?.fullName ?? label
                  }}
                />
                <Bar dataKey="etudiants" name={locales.rectorat.students} radius={[4, 4, 0, 0]}>
                  {data.byFaculty.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locales.rectorat.key_indicators}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentActivity.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {locales.rectorat[item.label as keyof typeof locales.rectorat]}
                  </span>
                  <span className="font-semibold text-foreground">
                    {item.value}/{item.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{item.percent}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
