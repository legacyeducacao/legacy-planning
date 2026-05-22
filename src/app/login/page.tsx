"use client"

import { ArrowRight, Check, Lock, Mail, Shield, User } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth"
import "./login.css"

type TabMode = "entrar" | "solicitar"

/* ───────────────── Firebase error → friendly PT-BR ───────────────── */
function getAuthErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code
    switch (code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "E-mail ou senha incorretos."
      case "auth/email-already-in-use":
        return "Este e-mail já está cadastrado."
      case "auth/weak-password":
        return "A senha deve ter pelo menos 6 caracteres."
      case "auth/too-many-requests":
        return "Acesso bloqueado temporariamente. Tente mais tarde."
      case "auth/user-disabled":
        return "Esta conta foi desativada por um administrador."
      case "auth/invalid-email":
        return "Formato de e-mail inválido."
      default:
        break
    }
  }
  if (err instanceof Error) {
    const msg = err.message
    if (
      msg.includes("auth/invalid-credential") ||
      msg.includes("invalid-credential")
    )
      return "E-mail ou senha incorretos."
    if (msg.includes("auth/email-already-in-use"))
      return "Este e-mail já está cadastrado."
    if (msg.includes("auth/too-many-requests"))
      return "Acesso bloqueado temporariamente. Tente mais tarde."
    return msg
  }
  return "Falha ao autenticar. Verifique suas credenciais."
}

/* ───────────────── Inline Google icon (official colors) ───────────── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.16c-.27 1.4-1.07 2.59-2.28 3.39v2.82h3.68C21.7 18.74 23 15.77 23 12.27Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.08 0 5.66-1.02 7.55-2.78l-3.68-2.82c-1.02.68-2.32 1.09-3.87 1.09-2.97 0-5.49-2-6.39-4.69H1.83v2.92A11.5 11.5 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.61 14.8a6.78 6.78 0 0 1 0-4.32V7.56H1.83a11.5 11.5 0 0 0 0 10.16l3.78-2.92Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.68 0 3.18.58 4.36 1.7l3.27-3.27C17.65 1.24 15.07 0 12 0 7.6 0 3.82 2.55 1.83 6.27l3.78 2.92C6.51 6.5 9.03 4.77 12 4.77Z"
      />
    </svg>
  )
}

/* ───────────────── Password-eye toggle SVG ────────────────────────── */
function EyeIcon({ open, size = 18 }: { open: boolean; size?: number }) {
  if (open) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, isLoading } = useAuth()
  const next = params.get("next") || "/"

  /* ── state ── */
  const [tab, setTab] = useState<TabMode>("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [pwVisible, setPwVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})

  /* hydrate remembered email */
  useEffect(() => {
    const savedEmail = localStorage.getItem("lp-remembered-email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

  /* redirect if already authenticated */
  useEffect(() => {
    if (!isLoading && user) router.replace(next)
  }, [user, isLoading, next, router])

  /* ── validation helpers ── */
  const validateEmail = (val: string) => {
    if (!val) {
      setErrors((p) => ({ ...p, email: "O e-mail é obrigatório" }))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrors((p) => ({ ...p, email: "Insira um e-mail válido" }))
      return false
    }
    setErrors((p) => ({ ...p, email: undefined }))
    return true
  }

  const validatePassword = (val: string) => {
    if (!val) {
      setErrors((p) => ({ ...p, password: "A senha é obrigatória" }))
      return false
    }
    if (val.length < 8) {
      setErrors((p) => ({ ...p, password: "Mínimo 8 caracteres" }))
      return false
    }
    setErrors((p) => ({ ...p, password: undefined }))
    return true
  }

  const validateName = (val: string) => {
    if (!val.trim()) {
      setErrors((p) => ({ ...p, name: "O nome é obrigatório" }))
      return false
    }
    setErrors((p) => ({ ...p, name: undefined }))
    return true
  }

  /* ── auth handlers ── */
  const handleGoogle = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      router.replace(next)
    } catch (err) {
      console.error(err)
      toast.error(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const ok =
      validateEmail(email) &&
      validatePassword(password) &&
      (tab === "solicitar" ? validateName(name) : true)
    if (!ok) return

    setBusy(true)
    try {
      if (tab === "solicitar") {
        await signUpWithEmail(email.trim(), password, name.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      if (rememberMe) {
        localStorage.setItem("lp-remembered-email", email.trim())
      } else {
        localStorage.removeItem("lp-remembered-email")
      }
      router.replace(next)
    } catch (err) {
      console.error(err)
      toast.error(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  /* display name shown on the dark card */
  const firstName = user?.displayName?.split(" ")[0] ?? null

  /* ─────────────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────────────── */
  return (
    <div className="lp-d" data-palette="navy">
      <Toaster position="top-right" richColors />

      {/* vertical seam line */}
      <div className="lp-d-seam" aria-hidden="true" />

      {/* ── TOP BAR ── */}
      <header className="lp-d-top">
        {/* Wordmark: logo Convene + "LEGACY PLANNING" */}
        <a href="/" className="flex items-center gap-3.5 no-underline">
          <Image
            src="/brand/legacy-mark.png"
            alt="LegacyPlanning"
            width={28}
            height={28}
            priority
          />
          <span
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#0e1118",
            }}
          >
            Legacy Planning
          </span>
        </a>

        <div className="lp-d-top-right">
          <span className="lp-d-mono">não tem conta?</span>
          <button
            type="button"
            className="lp-d-link"
            onClick={() => setTab("solicitar")}
          >
            Solicitar acesso
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── MAIN SPLIT ── */}
      <main className="lp-d-main">
        {/* ─── LEFT: pitch ─── */}
        <section>
          <div className="lp-d-tag">entrar · aurora ativa</div>

          <h1 className="lp-d-headline">
            Sua reunião começa aqui.
            <br />
            <em>Tudo no seu nome.</em>
          </h1>

          <p className="lp-d-lede">
            Acesse pra abrir sua agenda do dia, conferir as transcrições da
            semana e seguir os próximos passos pendentes da equipe.
          </p>

          <div className="lp-d-stats">
            <div>
              <span className="lp-d-stat-val">~5 min</span>
              <span className="lp-d-stat-lbl">da gravação à ata pronta</span>
            </div>
            <div>
              <span className="lp-d-stat-val">sem prompts</span>
              <span className="lp-d-stat-lbl">só envia o áudio</span>
            </div>
            <div>
              <span className="lp-d-stat-val">ata estruturada</span>
              <span className="lp-d-stat-lbl">
                decisões, plano e responsáveis no lugar certo
              </span>
            </div>
          </div>
        </section>

        {/* ─── RIGHT: dark card ─── */}
        <aside className="lp-d-card">
          {/* card tag */}
          <div className="lp-d-card-tag">
            {tab === "entrar" ? "entrar" : "solicitar acesso"}
          </div>

          {/* card title — personalized if user known */}
          <h2 className="lp-d-card-title">
            {firstName ? (
              <>
                Bem-vindo de volta,
                <br />
                <em>{firstName}.</em>
              </>
            ) : (
              "Bem-vindo de volta."
            )}
          </h2>
          <p className="lp-d-card-sub">Vamos abrir sua agenda de hoje.</p>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Tabs */}
            <div className="lp-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "entrar"}
                className={`lp-tab${tab === "entrar" ? " is-active" : ""}`}
                onClick={() => setTab("entrar")}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "solicitar"}
                className={`lp-tab${tab === "solicitar" ? " is-active" : ""}`}
                onClick={() => setTab("solicitar")}
              >
                Solicitar acesso
              </button>
            </div>

            {/* Name field (solicitar only) */}
            {tab === "solicitar" && (
              <div className="lp-field" style={{ marginBottom: 16 }}>
                <label className="lp-field-label" htmlFor="lp-name">
                  Nome completo
                </label>
                <div
                  className={`lp-field-input${errors.name ? " lp-field-input--error" : ""}`}
                >
                  <span className="lp-field-icon">
                    <User size={18} aria-hidden="true" />
                  </span>
                  <input
                    id="lp-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name)
                        setErrors((p) => ({ ...p, name: undefined }))
                    }}
                  />
                </div>
                {errors.name && (
                  <span className="lp-field-error">{errors.name}</span>
                )}
              </div>
            )}

            {/* Email */}
            <div className="lp-field" style={{ marginBottom: 16 }}>
              <label className="lp-field-label" htmlFor="lp-email">
                E-mail
              </label>
              <div
                className={`lp-field-input${errors.email ? " lp-field-input--error" : ""}`}
              >
                <span className="lp-field-icon">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <input
                  id="lp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email)
                      setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  onBlur={() => validateEmail(email)}
                />
              </div>
              {errors.email && (
                <span className="lp-field-error">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-field-label" htmlFor="lp-password">
                Senha
              </label>
              <div
                className={`lp-field-input${errors.password ? " lp-field-input--error" : ""}`}
              >
                <span className="lp-field-icon">
                  <Lock size={18} aria-hidden="true" />
                </span>
                <input
                  id="lp-password"
                  type={pwVisible ? "text" : "password"}
                  autoComplete={
                    tab === "solicitar" ? "new-password" : "current-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password)
                      setErrors((p) => ({ ...p, password: undefined }))
                  }}
                />
                <button
                  type="button"
                  aria-label={pwVisible ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setPwVisible((v) => !v)}
                  style={{
                    background: "none",
                    border: 0,
                    color: "inherit",
                    cursor: "pointer",
                    opacity: 0.6,
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <EyeIcon open={pwVisible} size={18} />
                </button>
              </div>
              {errors.password && (
                <span className="lp-field-error">{errors.password}</span>
              )}
            </div>

            {/* Remember / Forgot */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "18px 0 24px",
              }}
            >
              <label
                className="lp-checkbox"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                  aria-label="Lembrar-me"
                />
                <span
                  className={`lp-checkbox-box${rememberMe ? "" : " off"}`}
                  aria-hidden="true"
                >
                  {rememberMe && <Check size={12} strokeWidth={3} />}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  Lembrar-me
                </span>
              </label>
              <a
                href="#"
                className="lp-link"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Esqueci a senha
              </a>
            </div>

            {/* CTA: ENTRAR */}
            <button
              type="submit"
              disabled={busy}
              className="lp-btn-primary"
              aria-busy={busy}
            >
              {busy ? (
                /* spinner */
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  style={{ animation: "lp-spin 0.75s linear infinite" }}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 2a6 6 0 0 1 6 6"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <Shield size={14} aria-hidden="true" />
              )}
              {busy
                ? tab === "solicitar"
                  ? "ENVIANDO…"
                  : "ENTRANDO…"
                : tab === "solicitar"
                  ? "SOLICITAR"
                  : "ENTRAR"}
            </button>

            {/* Divider or */}
            <div className="lp-or">ou</div>

            {/* Google */}
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogle}
              className="lp-btn-google"
            >
              <GoogleIcon size={18} />
              Entrar com Google
            </button>
          </form>
        </aside>
      </main>

      {/* ── BOTTOM BAR ── */}
      <footer className="lp-d-bottom">
        <span># copyright 2026 — legacy educação</span>
        <div className="lp-d-bottom-right">
          <a href="#">suporte</a>
          <a href="#">status</a>
          <a href="#">privacidade</a>
        </div>
      </footer>

      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-field-input--error { border-color: #cf2d56 !important; }
        .lp-field-error {
          font-size: 12px;
          color: #cf2d56;
          margin-top: -4px;
        }
      `}</style>
    </div>
  )
}
