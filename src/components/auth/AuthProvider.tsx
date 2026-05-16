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
    const unsub = subscribeAuthState(
      (u) => {
        setUser(u)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setIsLoading(false)
      },
    )
    return () => unsub()
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
