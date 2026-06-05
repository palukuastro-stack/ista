// src/pages/apparitorat/ApparitoratStudents.tsx
import { useMemo, useState } from "react"
import { Search, FileDown, FileSpreadsheet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePageData } from "@/hooks/usePageData"
import { enrichStudent } from "@/lib/selectors"
import type { Student } from "@/types"
import { toast } from "sonner"
import { EditStudentDialog } from "./EditStudentDialog"
import locales from "@/lib/locales.json"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

interface StudentRow extends Student {
  facultyCode: string
  promotionName: string
}

export function ApparitoratStudents() {
  const [query, setQuery] = useState("")
  const [faculty, setFaculty] = useState("all")
  const [promotion, setPromotion] = useState("all")
  const [status, setStatus] = useState("all")
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null)

  const { data, loading } = usePageData((d) => {
    const students: StudentRow[] = d.students.map(s => enrichStudent(d, s))
    return { students, faculties: d.faculties, promotions: d.promotions }
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.students.filter((s) => {
      const matchQ =
        !q ||
        [s.firstName, s.lastName, s.matricule, s.email].join(" ").toLowerCase().includes(q)
      const matchF = faculty === "all" || s.facultyId === faculty
      const matchP = promotion === "all" || s.promotionId === promotion
      const matchS = status === "all" || s.status === status
      return matchQ && matchF && matchP && matchS
    })
  }, [data, query, faculty, promotion, status])

  const exportToPDF = () => {
    const doc = new jsPDF()
    const promotionName = promotion !== "all"
      ? data?.promotions.find(p => p.id === promotion)?.name
      : locales.apparitorat.list_type_all
    const facultyName = faculty !== "all"
      ? data?.faculties.find(f => f.id === faculty)?.name
      : locales.apparitorat.all_faculties

    // Header
    const img = new Image()
    img.src = "/ista.jpeg"
    img.onload = () => {
      doc.addImage(img, "JPEG", 14, 10, 25, 25)
      finalizePDF(doc, promotionName ?? "", facultyName ?? "")
    }
    img.onerror = () => {
      finalizePDF(doc, promotionName ?? "", facultyName ?? "")
    }
  }

  const finalizePDF = (doc: jsPDF, promotionName: string, facultyName: string) => {
    doc.setFontSize(20)
    doc.setTextColor(0, 102, 204)
    doc.text(locales.apparitorat.university_name, 50, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("INSTITUT SUPÉRIEUR DES TECHNIQUES APPLIQUÉES", 50, 26)

    doc.setDrawColor(0, 102, 204)
    doc.line(14, 35, 196, 35)

    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(locales.apparitorat.student_list.toUpperCase(), 14, 45)

    doc.setFontSize(11)
    doc.text(`${locales.apparitorat.faculty}: ${facultyName}`, 14, 52)
    doc.text(`${locales.apparitorat.promotion}: ${promotionName}`, 14, 58)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 64)

    const tableData = filtered.map(s => [
      s.matricule,
      `${s.firstName} ${s.lastName}`,
      s.facultyCode,
      s.promotionName,
      s.phone,
      s.status
    ])

    ;(doc as any).autoTable({
      startY: 70,
      head: [[
        locales.apparitorat.matricule,
        locales.apparitorat.student_label,
        locales.apparitorat.faculty,
        locales.apparitorat.promotion,
        locales.apparitorat.phone_label,
        locales.apparitorat.status
      ]],
      body: tableData,
    })

    doc.save(`liste_etudiants_${promotionName}.pdf`)
    toast.success("PDF généré avec succès")
  }

  const exportToExcel = () => {
    const promotionName = promotion !== "all"
      ? data?.promotions.find(p => p.id === promotion)?.name
      : locales.apparitorat.list_type_all
    const facultyName = faculty !== "all"
      ? data?.faculties.find(f => f.id === faculty)?.name
      : locales.apparitorat.all_faculties

    // Prepare header rows
    const headerData = [
      [locales.apparitorat.university_name],
      ["INSTITUT SUPÉRIEUR DES TECHNIQUES APPLIQUÉES"],
      [],
      [locales.apparitorat.student_list.toUpperCase()],
      [`${locales.apparitorat.faculty}: ${facultyName}`],
      [`${locales.apparitorat.promotion}: ${promotionName}`],
      [`Date: ${new Date().toLocaleDateString()}`],
      []
    ]

    const tableData = filtered.map(s => ({
      [locales.apparitorat.matricule]: s.matricule,
      [locales.apparitorat.student_label]: `${s.firstName} ${s.lastName}`,
      [locales.apparitorat.faculty]: s.facultyCode,
      [locales.apparitorat.promotion]: s.promotionName,
      [locales.apparitorat.phone_label]: s.phone,
      [locales.apparitorat.status]: s.status
    }))

    const worksheet = XLSX.utils.aoa_to_sheet(headerData)
    XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A9" })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students")
    XLSX.writeFile(workbook, `liste_etudiants_${promotionName}.xlsx`)
    toast.success("Excel généré avec succès")
  }

  const columns: Column<StudentRow>[] = [
    {
      key: "matricule",
      header: locales.apparitorat.matricule,
      render: (s) => <span className="font-mono text-xs">{s.matricule}</span>,
    },
    {
      key: "name",
      header: locales.apparitorat.student_label,
      render: (s) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {s.firstName} {s.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{s.email}</p>
        </div>
      ),
    },
    { key: "phone", header: locales.apparitorat.phone_label, render: (s) => s.phone },
    { key: "faculty", header: locales.apparitorat.faculty, render: (s) => s.facultyCode },
    { key: "promotion", header: locales.apparitorat.promotion, render: (s) => s.promotionName },
    {
      key: "status",
      header: locales.apparitorat.status,
      align: "right",
      render: (s) => (
        <div className="flex justify-end">
          <StatusBadge status={s.status} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <Button variant="ghost" size="sm" onClick={() => setEditingStudent(s)}>
          {locales.apparitorat.modify_button}
        </Button>
      ),
    },
  ]

  return (
    <>
      <EditStudentDialog
        student={editingStudent}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      />
      <PageHeader
        title={locales.apparitorat.students_title}
        subtitle={locales.apparitorat.students_subtitle}
        action={
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1 sm:flex-none">
              <FileSpreadsheet className="mr-2 size-4 shrink-0" />
              <span className="truncate">{locales.apparitorat.export_excel}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} className="flex-1 sm:flex-none">
              <FileDown className="mr-2 size-4 shrink-0" />
              <span className="truncate">{locales.apparitorat.export_pdf}</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locales.apparitorat.search_placeholder}
            className="pl-9"
            aria-label={locales.apparitorat.search_aria}
          />
        </div>
        <Select value={faculty} onValueChange={(v) => { setFaculty(v); setPromotion("all") }}>
          <SelectTrigger className="flex-1 sm:w-48 sm:flex-none">
            <SelectValue placeholder={locales.apparitorat.faculty} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locales.apparitorat.all_faculties}</SelectItem>
            {data?.faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={promotion} onValueChange={setPromotion}>
          <SelectTrigger className="flex-1 sm:w-48 sm:flex-none">
            <SelectValue placeholder={locales.apparitorat.promotion} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locales.apparitorat.all_promotions}</SelectItem>
            {data?.promotions
              .filter(p => faculty === "all" || p.facultyId === faculty)
              .map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="flex-1 sm:w-36 sm:flex-none">
            <SelectValue placeholder={locales.apparitorat.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locales.apparitorat.all_status}</SelectItem>
            <SelectItem value="active">{locales.apparitorat.status_active}</SelectItem>
            <SelectItem value="pending">{locales.apparitorat.status_pending}</SelectItem>
            <SelectItem value="suspended">{locales.apparitorat.status_suspended}</SelectItem>
            <SelectItem value="finished">{locales.apparitorat.status_finished}</SelectItem>
            <SelectItem value="dropped">{locales.apparitorat.status_dropped}</SelectItem>
            <SelectItem value="excluded">{locales.apparitorat.status_excluded}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle={locales.apparitorat.no_student_found}
        emptyDescription={locales.apparitorat.no_student_found_desc}
      />
    </>
  )
}
