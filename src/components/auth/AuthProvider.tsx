"use client"

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { subscribeAuthState } from "@/lib/auth"
import type { AuthUser } from "@/types/auth"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Safety fallback: se o Supabase não responder em 3.5s, destrava o estado de loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3500)

    const unsub = subscribeAuthState(
      (u) => {
        clearTimeout(timer)
        setUser(u)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        clearTimeout(timer)
        setError(err.message)
        setIsLoading(false)
      },
    )
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, error }),
    [user, isLoading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
