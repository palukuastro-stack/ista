// src/pages/rectorat/RectoratStats.tsx
import { TrendingUp, Award, FileClock, Users } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { KPICard } from "@/components/ui/KPICard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/Loader"
import { usePageData } from "@/hooks/usePageData"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function RectoratStats() {
  const { data, loading } = usePageData((d) => {
    const totalStudents = d.students.length
    const active = d.students.filter((s) => s.status === "active").length
    const pending = d.students.filter((s) => s.status === "pending").length
    const suspended = d.students.filter((s) => s.status === "suspended").length

    const validatedGrades = d.grades.filter((g) => g.status === "validated")
    const avgScore =
      validatedGrades.length > 0
        ? validatedGrades.reduce((acc, g) => acc + g.score, 0) / validatedGrades.length
        : 0

    const gradeDistribution = [
      { label: "16-20", count: validatedGrades.filter((g) => g.score >= 16).length },
      { label: "14-15", count: validatedGrades.filter((g) => g.score >= 14 && g.score < 16).length },
      { label: "12-13", count: validatedGrades.filter((g) => g.score >= 12 && g.score < 14).length },
      { label: "10-11", count: validatedGrades.filter((g) => g.score >= 10 && g.score < 12).length },
      { label: "<10", count: validatedGrades.filter((g) => g.score < 10).length },
    ]

    const statusDistribution = [
      { name: "Actifs", value: active },
      { name: "En attente", value: pending },
      { name: "Suspendus", value: suspended },
    ]

    const byFaculty = d.faculties.map((f) => ({
      name: f.code,
      fullName: f.name,
      étudiants: d.students.filter((s) => s.facultyId === f.id).length,
      cours: d.courses.filter((c) => c.facultyId === f.id).length,
    }))

    return {
      totalStudents,
      active,
      validatedGrades: validatedGrades.length,
      pendingGrades: d.grades.filter((g) => g.status === "pending").length,
      avgScore: Number(avgScore.toFixed(1)),
      gradeDistribution,
      statusDistribution,
      byFaculty,
    }
  })

  if (loading || !data) return <Loader fullHeight />

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle="Analyses académiques et indicateurs de performance de l'institution."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total étudiants"
          value={data.totalStudents}
          subtitle={`${data.active} actifs`}
          icon={Users}
          colorClass="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title="Moyenne générale"
          value={`${data.avgScore}/20`}
          subtitle="Notes validées"
          icon={TrendingUp}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <KPICard
          title="Notes validées"
          value={data.validatedGrades}
          subtitle="Ce semestre"
          icon={Award}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <KPICard
          title="Notes en attente"
          value={data.pendingGrades}
          subtitle="À valider"
          icon={FileClock}
          colorClass="bg-chart-3/15 text-chart-3"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
            <CardDescription>Notes validées par tranche</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.gradeDistribution}
                margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
                <Bar dataKey="count" name="Étudiants" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statuts des étudiants</CardTitle>
            <CardDescription>Répartition par statut d'inscription</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {data.statusDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparatif inter-facultés</CardTitle>
          <CardDescription>Étudiants et cours par faculté</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.byFaculty}
              margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
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
              <Bar dataKey="étudiants" name="Étudiants" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cours" name="Cours" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  )
}
