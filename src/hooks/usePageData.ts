// src/hooks/usePageData.ts
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { getState, subscribe } from "@/lib/store"
import type { AppData } from "@/types"

/** Subscribe to the live in-memory data store (re-renders on mutation). */
export function useStore(): AppData {
  return useSyncExternalStore(subscribe, getState, getState)
}

interface PageDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Simulates an asynchronous network request reading from the local JSON store.
 * A short artificial delay lets components display loading states.
 */
export function usePageData<T>(
  selector: (data: AppData) => T,
  delay = 600,
): PageDataResult<T> {
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      if (!active) return
      try {
        setData(selectorRef.current(store))
        setLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
        setLoading(false)
      }
    }, delay)
    return () => {
      active = false
      clearTimeout(timer)
    }
    // Re-run when the underlying store changes
  }, [store, delay])

  return { data, loading, error }
}
