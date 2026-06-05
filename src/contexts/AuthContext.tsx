// src/contexts/AuthContext.tsx
// Real JWT-based authentication context.
// Token is stored under "ista-token" in localStorage.
// On mount it validates any existing token by calling /auth/me.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import { authApi, ApiError } from "@/lib/api"
import type { Role, User } from "@/types"

const TOKEN_KEY = "ista-token"

interface AuthContextValue {
  user: User | null
  role: Role | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: if a token exists, validate it by calling /auth/me.
  // This keeps the session alive across page reloads.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi.me()
      .then((res) => {
        setUser(res.user as User)
      })
      .catch(() => {
        // Token is invalid or expired — clear it silently.
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    // api.ts now auto-unwraps the envelope: res = { token, user }
    localStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user as User)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    // Fire-and-forget — no need to await
    authApi.logout().catch(() => {})
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user ? (user.role as Role) : null,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      forgotPassword,
    }),
    [user, isLoading, login, logout, forgotPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider")
  return ctx
}
