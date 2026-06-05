// src/contexts/AppContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { NAV_BY_ROLE, getPortal, type NavItem } from "@/lib/portals"
import type { PortalInfo } from "@/types"

type Theme = "light" | "dark"
const THEME_KEY = "ista-theme"

interface AppContextValue {
  theme: Theme
  toggleTheme: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  nav: NavItem[]
  portal: (PortalInfo & { color: string }) | undefined
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(THEME_KEY) as Theme | null
  if (stored) return stored
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  )
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  const value = useMemo<AppContextValue>(() => {
    return {
      theme,
      toggleTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      nav: role ? NAV_BY_ROLE[role] : [],
      portal: role ? getPortal(role) : undefined,
    }
  }, [theme, toggleTheme, sidebarOpen, toggleSidebar, role])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp doit être utilisé dans un AppProvider")
  return ctx
}
