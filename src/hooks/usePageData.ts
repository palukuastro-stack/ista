// src/hooks/usePageData.ts
import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  studentApi,
  teacherApi,
  facultyApi,
  gradeApi,
  announcementApi,
  promotionApi,
  courseApi,
  scheduleApi,
  roomApi,
  assignmentApi,
  submissionApi,
  appealApi,
  resourceApi,
  notificationApi
} from "@/lib/api"
import type { AppData } from "@/types"

interface PageDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to fetch data for a page from the backend.
 * Replaces the in-memory store entirely.
 */
export function usePageData<T>(
  selector: (data: AppData) => T,
): PageDataResult<T> {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real optimized app, we would only fetch what the page needs.
      // For this migration, we fetch common entities to reconstruct the AppData structure
      // that the existing selectors expect.
      const [
        students,
        teachers,
        faculties,
        promotions,
        courses,
        grades,
        announcements,
        schedules,
        rooms,
        assignments,
        submissions,
        appeals,
        resources,
        notifications,
        teacherTitles
      ] = await Promise.all([
        studentApi.list(),
        teacherApi.list(),
        facultyApi.list(),
        promotionApi.list(),
        courseApi.list(),
        gradeApi.list(),
        announcementApi.list(),
        scheduleApi.list(),
        roomApi.list(),
        assignmentApi.list(),
        submissionApi.list(),
        appealApi.list(),
        resourceApi.list(),
        notificationApi.list(),
        teacherApi.titles().catch(() => ["Professeur", "Chef de Travaux", "Assistant"])
      ])

      const appData: AppData = {
        students,
        teachers,
        faculties,
        promotions,
        courses,
        grades,
        announcements,
        schedules,
        rooms,
        assignments,
        submissions,
        gradeAppeals: appeals,
        courseResources: resources,
        notifications,
        teacherTitles
      }

      setData(selectorRef.current(appData))
      setLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, user?.id])

  return { data, loading, error, refresh: fetchData }
}
