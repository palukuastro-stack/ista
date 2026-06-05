// src/lib/store.ts
import rawData from "@/data.json"
import { normalizeUser } from "./utils"
import type {
  AppData,
  Grade,
  Student,
  Teacher,
  Faculty,
  Promotion,
  Assignment,
  Submission,
  GradeAppeal,
  CourseResource,
  Notification,
  Role,
  Announcement,
  Room,
  User,
  ScheduleSlot,
} from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Clamp a numeric score to the 0–20 range. */
function clampScore(n: number): number {
  return Math.max(0, Math.min(20, Number.isFinite(n) ? n : 0))
}

// ─── State initialisation ─────────────────────────────────────────────────────
// All seed data lives in data.json — this function just defensively ensures
// every required array exists even if the JSON is extended incrementally.

function initState(): AppData {
  const raw = structuredClone(rawData) as unknown as Partial<AppData> & { users?: any[] }

  const users = (raw.users || []).map(normalizeUser) as User[]

  const students = (raw.students || []).map((s) => ({
    ...s,
    middleName: s.middleName || "",
    birthDate: s.birthDate || "2000-01-01"
  } as Student))

  const teachers = (raw.teachers || []).map((t) => ({
    ...t,
    middleName: t.middleName || ""
  } as Teacher))

  const announcements = (raw.announcements || []).map((a) => ({
    ...a,
    scope: a.scope || "global"
  } as Announcement))

  const grades = (raw.grades || []).map((g) => ({
    ...g,
    type: g.type || "Examen"
  } as Grade))

  return {
    ...raw,
    users,
    students,
    teachers,
    announcements,
    grades,
    faculties:        raw.faculties        ?? [],
    promotions:       raw.promotions       ?? [],
    courses:          raw.courses          ?? [],
    schedules:        raw.schedules        ?? [],
    teacherTitles:    raw.teacherTitles    ?? [],
    assignments:      raw.assignments      ?? [],
    submissions:      raw.submissions      ?? [],
    gradeAppeals:     raw.gradeAppeals     ?? [],
    courseResources:  raw.courseResources  ?? [],
    notifications:    raw.notifications    ?? [],
    rooms:            raw.rooms            ?? [],
  } as AppData
}

let state: AppData = initState()

// ─── Subscription (useSyncExternalStore) ─────────────────────────────────────

type Listener = () => void
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): AppData {
  return state
}

// ─── ID Generation ────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  const mapping: Record<string, keyof AppData> = {
    s: "students",
    t: "teachers",
    f: "faculties",
    p: "promotions",
    asgn: "assignments",
    sub: "submissions",
    res: "courseResources",
    room: "rooms",
    sch: "schedules",
  }

  const collectionName = mapping[prefix] || ((prefix + "s") as keyof AppData)
  const collection = state[collectionName] as any[] | undefined
  if (!collection) return uid(prefix + "-")

  const max = collection.reduce((acc: number, item: any) => {
    const n = Number(item.id.replace(/\D/g, ""))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `${prefix}${max + 1}`
}

// ─── Students ────────────────────────────────────────────────────────────────

export function addStudent(student: Student) {
  state = { ...state, students: [student, ...state.students] }
  emit()
}

export function updateStudent(student: Student) {
  state = {
    ...state,
    students: state.students.map((s) => (s.id === student.id ? student : s)),
  }
  emit()
}

// ─── Grades ───────────────────────────────────────────────────────────────────

export function updateGradeStatus(id: string, status: Grade["status"]) {
  state = { ...state, grades: state.grades.map((g) => (g.id === id ? { ...g, status } : g)) }
  emit()
}

export function setGradeScore(id: string, rawScore: number) {
  const score = clampScore(rawScore)
  const grade   = state.grades.find((g) => g.id === id)
  const student = grade ? state.students.find((s) => s.id === grade.studentId) : undefined
  const course  = grade ? state.courses.find((c) => c.id === grade.courseId)   : undefined

  const notification: Notification = {
    id: uid("notif-"),
    type: "grade_modified",
    message: `Note modifiée — ${student ? `${student.firstName} ${student.lastName}` : "Étudiant"} · ${course?.name ?? "cours"} : ${score}/20`,
    targetRole: "secretariat_general",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: {
      gradeId:   id,
      studentId: grade?.studentId ?? "",
      courseId:  grade?.courseId  ?? "",
    },
  }

  state = {
    ...state,
    grades: state.grades.map((g) => (g.id === id ? { ...g, score } : g)),
    notifications: [notification, ...state.notifications],
  }
  emit()
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export function addTeacher(teacher: Teacher) {
  state = { ...state, teachers: [teacher, ...state.teachers] }
  emit()
}

export function nextTeacherMatricule(): string {
  const max = state.teachers.reduce((acc, t) => {
    const n = Number(t.matricule.replace(/\D/g, ""))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `ENS-${String(max + 1).padStart(3, "0")}`
}

// ─── Faculties & Promotions ───────────────────────────────────────────────────

export function addFaculty(faculty: Faculty) {
  state = { ...state, faculties: [faculty, ...state.faculties] }
  emit()
}

export function addPromotion(promotion: Promotion) {
  state = { ...state, promotions: [promotion, ...state.promotions] }
  emit()
}

// ─── Course–teacher assignment ────────────────────────────────────────────────

export function assignCourseToTeacher(courseId: string, teacherId: string) {
  const course      = state.courses.find((c) => c.id === courseId)
  const teacher     = state.teachers.find((t) => t.id === teacherId)
  const oldTeacherId = course?.teacherId

  const notification: Notification = {
    id: uid("notif-"),
    type: "course_assigned",
    message: `Cours attribué — "${course?.name ?? courseId}" → ${teacher ? `${teacher.firstName} ${teacher.lastName}` : "Enseignant"}`,
    targetRole: "secretariat_general",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: { courseId, teacherId },
  }

  state = {
    ...state,
    courses: state.courses.map((c) => (c.id === courseId ? { ...c, teacherId } : c)),
    teachers: state.teachers.map((t) => {
      if (t.id === oldTeacherId && oldTeacherId !== teacherId) {
        return { ...t, courseIds: t.courseIds.filter((id) => id !== courseId) }
      }
      if (t.id === teacherId) {
        return {
          ...t,
          courseIds: t.courseIds.includes(courseId) ? t.courseIds : [...t.courseIds, courseId],
        }
      }
      return t
    }),
    notifications: [notification, ...state.notifications],
  }
  emit()
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export function addAssignment(assignment: Assignment) {
  state = { ...state, assignments: [assignment, ...state.assignments] }
  emit()
}

export function removeAssignment(id: string) {
  state = {
    ...state,
    assignments: state.assignments.filter((a) => a.id !== id),
    submissions: state.submissions.filter((s) => s.assignmentId !== id),
  }
  emit()
}

export function nextAssignmentId(): string {
  return generateId("asgn")
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export function addSubmission(submission: Submission) {
  state = { ...state, submissions: [submission, ...state.submissions] }
  emit()
}

export function gradeSubmission(id: string, rawGrade: number, feedback: string) {
  const score = clampScore(rawGrade)
  const sub = state.submissions.find((s) => s.id === id)
  const assignment = sub ? state.assignments.find((a) => a.id === sub.assignmentId) : undefined
  const student = sub ? state.students.find((s) => s.id === sub.studentId) : undefined

  // Auto-sync to grades
  if (sub && assignment && student) {
    const gradeId = uid("g-")
    const newGrade: Grade = {
      id: gradeId,
      studentId: sub.studentId,
      courseId: assignment.courseId,
      promotionId: student.promotionId,
      score,
      status: "pending",
      session: "Travail pratique",
      type: assignment.type === "Formulaire" ? "Interro" : "TP",
      assessmentTitle: assignment.title
    }
    state = {
      ...state,
      grades: [newGrade, ...state.grades]
    }
  }

  state = {
    ...state,
    submissions: state.submissions.map((s) => (s.id === id ? { ...s, grade: score, feedback } : s)),
  }
  emit()
}

export function addGrade(grade: Grade) {
  state = { ...state, grades: [grade, ...state.grades] }
  emit()
}

export function upsertGrade(grade: Omit<Grade, "id" | "status">) {
  const existingIndex = state.grades.findIndex(
    (g) =>
      g.studentId === grade.studentId &&
      g.courseId === grade.courseId &&
      g.type === grade.type &&
      g.assessmentTitle === grade.assessmentTitle
  )

  if (existingIndex >= 0) {
    const updatedGrades = [...state.grades]
    updatedGrades[existingIndex] = {
      ...updatedGrades[existingIndex],
      score: clampScore(grade.score),
      session: grade.session,
    }
    state = { ...state, grades: updatedGrades }
  } else {
    const newGrade: Grade = {
      ...grade,
      id: uid("g-"),
      score: clampScore(grade.score),
      status: "pending",
    }
    state = { ...state, grades: [newGrade, ...state.grades] }
  }
  emit()
}

export function nextSubmissionId(): string {
  return generateId("sub")
}

// ─── Grade Appeals ────────────────────────────────────────────────────────────

export function addGradeAppeal(appeal: GradeAppeal) {
  const notification: Notification = {
    id: uid("notif-"),
    type: "new_appeal",
    message: `Nouveau recours soumis — "${appeal.reason.substring(0, 60)}${appeal.reason.length > 60 ? "…" : ""}"`,
    targetRole: "secretariat_general",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: { appealId: appeal.id, gradeId: appeal.gradeId },
  }
  state = {
    ...state,
    gradeAppeals: [appeal, ...state.gradeAppeals],
    notifications: [notification, ...state.notifications],
  }
  emit()
}

export function resolveGradeAppeal(
  id: string,
  status: "approved" | "rejected",
  response: string,
) {
  state = {
    ...state,
    gradeAppeals: state.gradeAppeals.map((a) => (a.id === id ? { ...a, status, response } : a)),
  }
  emit()
}

export function nextAppealId(): string {
  return uid("recours-")
}

// ─── Course Resources ─────────────────────────────────────────────────────────

export function addCourseResource(resource: CourseResource) {
  state = { ...state, courseResources: [resource, ...state.courseResources] }
  emit()
}

export function removeCourseResource(id: string) {
  state = { ...state, courseResources: state.courseResources.filter((r) => r.id !== id) }
  emit()
}

export function nextResourceId(): string {
  return generateId("res")
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function addRoom(room: Room) {
  state = { ...state, rooms: [room, ...state.rooms] }
  emit()
}

export function removeRoom(id: string) {
  state = { ...state, rooms: state.rooms.filter((r) => r.id !== id) }
  emit()
}

export function nextRoomId(): string {
  return generateId("room")
}

// ─── Schedules & Conflicts ───────────────────────────────────────────────────

export function checkScheduleConflict(
  roomId: string,
  day: string,
  start: string,
  end: string,
  startDate?: string,
  endDate?: string,
  excludeSlotId?: string
): ScheduleSlot | null {
  return state.schedules.find((s) => {
    if (s.id === excludeSlotId) return false
    if (s.room !== roomId) return false
    if (s.day !== day) return false

    // Overlap in date range if provided
    if (startDate && endDate && s.startDate && s.endDate) {
      if (startDate > s.endDate || endDate < s.startDate) return false
    }

    // Overlap in time: (StartA < EndB) and (EndA > StartB)
    return start < s.end && end > s.start
  }) || null
}

export function addScheduleSlot(slot: Omit<ScheduleSlot, "id">) {
  const conflict = checkScheduleConflict(
    slot.room,
    slot.day,
    slot.start,
    slot.end,
    slot.startDate,
    slot.endDate
  )

  if (conflict) {
    const course = state.courses.find(c => c.id === conflict.courseId)
    const room = state.rooms.find(r => r.id === conflict.room)
    throw new Error(
      `Conflit détecté: La salle "${room?.name || conflict.room}" est déjà occupée par le cours "${course?.name || conflict.courseId}" le ${conflict.day} de ${conflict.start} à ${conflict.end}.`
    )
  }

  const newSlot = { ...slot, id: generateId("sch") }
  state = { ...state, schedules: [newSlot, ...state.schedules] }
  emit()
}

export function removeScheduleSlot(id: string) {
  state = { ...state, schedules: state.schedules.filter((s) => s.id !== id) }
  emit()
}

export function updateCourseAssignment(courseId: string, teacherId: string, roomId?: string) {
  state = {
    ...state,
    courses: state.courses.map((c) =>
      c.id === courseId ? { ...c, teacherId, roomId } : c
    ),
    teachers: state.teachers.map((t) => {
      // Remove from old teacher
      const isOld = t.courseIds.includes(courseId) && t.id !== teacherId
      if (isOld) {
        return { ...t, courseIds: t.courseIds.filter((id) => id !== courseId) }
      }
      // Add to new teacher
      if (t.id === teacherId) {
        return {
          ...t,
          courseIds: t.courseIds.includes(courseId) ? t.courseIds : [...t.courseIds, courseId],
        }
      }
      return t
    })
  }
  emit()
}

// ─── Announcements ────────────────────────────────────────────────────────────

export function addAnnouncement(announcement: Announcement) {
  state = { ...state, announcements: [announcement, ...state.announcements] }
  emit()
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function markNotificationRead(id: string) {
  state = {
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }
  emit()
}

export function markAllNotificationsRead(role: Role) {
  state = {
    ...state,
    notifications: state.notifications.map((n) =>
      n.targetRole === role ? { ...n, read: true } : n,
    ),
  }
  emit()
}
