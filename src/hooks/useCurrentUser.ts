// src/hooks/useCurrentUser.ts
// Centralises the "find the entity that matches the logged-in user" logic
// so every page uses the same resolution instead of duplicating it.
import { useAuth } from "@/contexts/AuthContext"
import type { AppData, Student, Teacher } from "@/types"

/**
 * Returns the Student record linked to the currently authenticated user.
 * Falls back to the first student in the store so demo mode always works,
 * but with RoleGuard in place an unauthenticated/wrong-role call is unreachable.
 */
export function useCurrentStudent(store: AppData): Student {
  const { user } = useAuth()
  return store.students.find((s) => s.id === user?.refId) ?? store.students[0]
}

/**
 * Returns the Teacher record linked to the currently authenticated user.
 * Falls back to the first teacher for demo purposes.
 */
export function useCurrentTeacher(store: AppData): Teacher {
  const { user } = useAuth()
  return store.teachers.find((t) => t.id === user?.refId) ?? store.teachers[0]
}
