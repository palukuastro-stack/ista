// src/lib/selectors.ts
import type { AppData, Student, Teacher, Course, ScheduleSlot, Grade, Announcement } from "../types"

/**
 * Enriches a student object with faculty code and promotion name.
 */
export function enrichStudent(d: AppData, student: Student) {
  return {
    ...student,
    facultyCode: d.faculties.find((f) => f.id === student.facultyId)?.code ?? "—",
    promotionName: d.promotions.find((p) => p.id === student.promotionId)?.name ?? "—",
  }
}

/**
 * Gets enriched students list.
 */
export function getEnrichedStudents(d: AppData) {
  return d.students.map(s => enrichStudent(d, s))
}

/**
 * Enriches a course object with promotion name, teacher info and schedules.
 */
export function enrichCourse(d: AppData, course: Course) {
  const promotion = d.promotions.find((p) => p.id === course.promotionId)
  const teacher = d.teachers.find((t) => t.id === course.teacherId)
  const room = d.rooms.find(r => r.id === course.roomId)
  const schedules = d.schedules.filter(s => s.courseId === course.id)

  return {
    ...course,
    promotionName: promotion?.name ?? "—",
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Non attribué",
    teacherTitle: teacher?.title ?? "",
    roomName: room?.name ?? "Non attribuée",
    schedules
  }
}

/**
 * Gets enriched courses list.
 */
export function getEnrichedCourses(d: AppData) {
  return d.courses.map(c => enrichCourse(d, c))
}

/**
 * Filters announcements by audience and sorts them by date.
 */
export function getAnnouncementsFor(d: AppData, audience: "student" | "teacher" | "all" | "global") {
  return d.announcements
    .filter((a) => a.audience === "all" || a.audience === audience)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Gets dashboard metrics for a teacher.
 */
export function getTeacherDashboardData(d: AppData, teacherId: string, todayDayName: string) {
  const teacher = d.teachers.find((t) => t.id === teacherId) ?? d.teachers[0]
  const courses = d.courses.filter((c) => c.teacherId === teacher.id)
  const promotionIds = new Set(courses.map((c) => c.promotionId))
  const students = d.students.filter((s) => promotionIds.has(s.promotionId))
  const courseIds = new Set(courses.map((c) => c.id))
  const pendingGrades = d.grades.filter(
    (g) => courseIds.has(g.courseId) && g.status === "pending",
  )
  const schedules = d.schedules.filter((s) => s.teacherId === teacher.id)
  const todaySlots = schedules.filter((s) => s.day === todayDayName)

  return { teacher, courses, students, pendingGrades, schedules, todaySlots }
}

/**
 * Gets dashboard metrics for a student.
 */
export function getStudentDashboardData(d: AppData, studentId: string) {
  const student = d.students.find((s) => s.id === studentId) ?? d.students[0]
  const courses = d.courses.filter((c) => c.promotionId === student.promotionId)
  const schedules = d.schedules.filter((s) => s.promotionId === student.promotionId)
  const grades = d.grades.filter((g) => g.studentId === student.id)
  const announcements = getAnnouncementsFor(d, "student")
  const validated = grades.filter((g) => g.status === "validated").length

  return { student, courses, schedules, announcements, grades, validated }
}

/**
 * Gets global stats for Apparitorat.
 */
export function getApparitoratStats(d: AppData) {
  const total = d.students.length
  let girls = 0
  let boys = 0
  const pending: any[] = []

  d.students.forEach((s) => {
    if (s.gender === "F") girls++
    if (s.gender === "M") boys++
    if (s.status === "pending") {
      pending.push(enrichStudent(d, s))
    }
  })

  const pendingCount = pending.length
  const totalMax = d.rooms.reduce((acc, r) => acc + r.capacity, 0)

  const byFaculty = d.faculties.map((f) => ({
    name: f.name,
    code: f.code,
    count: d.students.filter((s) => s.facultyId === f.id).length,
  }))

  return { total, girls, boys, pendingCount, totalMax, pending, byFaculty }
}

/**
 * Gets dashboard metrics for Secretariat General.
 */
export function getSecretariatGeneralDashboardData(d: AppData) {
  const totalStudents = d.students.length
  const activeStudents = d.students.filter((s) => s.status === "active").length
  const byFaculty = d.faculties.map((f) => ({
    id: f.id,
    name: f.name,
    code: f.code,
    dean: f.dean,
    studentCount: d.students.filter((s) => s.facultyId === f.id).length,
    courseCount: d.courses.filter((c) => c.facultyId === f.id).length,
    teacherCount: d.teachers.filter((t) => t.facultyId === f.id).length,
  }))
  const recentAnnouncements = d.announcements
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return {
    totalStudents,
    activeStudents,
    totalFaculties: d.faculties.length,
    totalTeachers: d.teachers.length,
    totalCourses: d.courses.length,
    byFaculty,
    recentAnnouncements,
  }
}

/**
 * Gets dashboard metrics for a specific Faculty.
 */
export function getFacultyDashboardData(d: AppData, facultyId: string) {
  const faculty = d.faculties.find((f) => f.id === facultyId) ?? d.faculties[0]
  const promotions = d.promotions.filter((p) => p.facultyId === faculty.id)
  const students = d.students.filter((s) => s.facultyId === faculty.id)
  const courses = d.courses.filter((c) => c.facultyId === faculty.id)
  const teachers = d.teachers.filter((t) => t.facultyId === faculty.id)

  return { faculties: d.faculties, faculty, promotions, students, courses, teachers }
}

/**
 * Gets dashboard metrics for Rectorat.
 */
export function getRectoratDashboardData(d: AppData) {
  const totalStudents = d.students.length
  const activeStudents = d.students.filter((s) => s.status === "active").length
  const validatedGrades = d.grades.filter((g) => g.status === "validated").length
  const pendingGrades = d.grades.filter((g) => g.status === "pending").length

  const byFaculty = d.faculties.map((f) => ({
    name: f.code,
    fullName: f.name,
    etudiants: d.students.filter((s) => s.facultyId === f.id).length,
  }))

  const recentActivity = [
    {
      label: "validated_grades_label", // These will be used as keys for locales in the component
      value: validatedGrades,
      total: d.grades.length,
      percent: d.grades.length ? Math.round((validatedGrades / d.grades.length) * 100) : 0,
      color: "bg-chart-3",
    },
    {
      label: "active_students_label",
      value: activeStudents,
      total: totalStudents,
      percent: totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0,
      color: "bg-chart-1",
    },
  ]

  return {
    totalStudents,
    activeStudents,
    totalFaculties: d.faculties.length,
    totalCourses: d.courses.length,
    validatedGrades,
    pendingGrades,
    byFaculty,
    recentActivity,
  }
}
