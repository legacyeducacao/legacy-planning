"use client"

import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth"

type Mode = "login" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, isLoading } = useAuth()
  const next = params.get("next") || "/"

  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  // Já logado? Redireciona pro destino.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next)
    }
  }, [user, isLoading, next, router])

  const handleGoogle = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      router.replace(next)
    } catch (err) {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : "Falha ao entrar com Google",
      )
    } finally {
      setBusy(false)
    }
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error("Preencha email e senha")
      return
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Informe seu nome")
      return
    }
    setBusy(true)
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      router.replace(next)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Falha ao autenticar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--r-canvas)" }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/brand/legacy-mark.png"
            alt="LegacyPlanning"
            width={36}
            height={36}
            priority
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: "var(--r-ink)",
            }}
          >
            LegacyPlanning
          </span>
        </div>

        <h1
          className="mb-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "var(--r-ink)",
          }}
        >
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </h1>
        <p
          className="mb-8"
          style={{ color: "var(--r-body)", fontSize: "15px" }}
        >
          {mode === "login"
            ? "Acesse as transcrições, atas e tarefas da sua equipe."
            : "Sua primeira ata fica disponível em segundos."}
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-full py-3 text-[14px] font-semibold transition-colors disabled:opacity-60"
          style={{
            background: "var(--r-surface-card)",
            border: "1px solid var(--r-hairline-strong)",
            color: "var(--r-ink)",
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Entrar com Google
        </button>

        <div className="mb-5 flex items-center gap-3">
          <span
            className="h-px flex-1"
            style={{ background: "var(--r-hairline)" }}
          />
          <span
            className="mono-eyebrow text-[11px]"
            style={{ color: "var(--r-mute)" }}
          >
            ou
          </span>
          <span
            className="h-px flex-1"
            style={{ background: "var(--r-hairline)" }}
          />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="w-full rounded-full px-5 py-3 text-[14px] outline-none"
              style={{
                background: "var(--r-surface-card)",
                border: "1px solid var(--r-hairline)",
                color: "var(--r-ink)",
              }}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@empresa.com"
            autoComplete="email"
            className="w-full rounded-full px-5 py-3 text-[14px] outline-none"
            style={{
              background: "var(--r-surface-card)",
              border: "1px solid var(--r-hairline)",
              color: "var(--r-ink)",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            className="w-full rounded-full px-5 py-3 text-[14px] outline-none"
            style={{
              background: "var(--r-surface-card)",
              border: "1px solid var(--r-hairline)",
              color: "var(--r-ink)",
            }}
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold transition-colors disabled:opacity-60"
            style={{
              background: "var(--r-primary)",
              color: "var(--r-on-dark)",
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p
          className="mt-5 text-center text-[13px]"
          style={{ color: "var(--r-mute)" }}
        >
          {mode === "login" ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                style={{
                  color: "var(--r-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Criar uma agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                style={{
                  color: "var(--r-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
      <Toaster />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
