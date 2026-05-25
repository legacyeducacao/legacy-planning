"use client"

import { Loader2, LogOut, ShieldCheck, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { signOut, updateUserDisplayName } from "@/lib/auth"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) setName(user.displayName)
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Nome não pode ficar vazio")
      return
    }
    if (trimmed === user.displayName) {
      toast.info("Sem mudanças pra salvar")
      return
    }
    setSaving(true)
    try {
      await updateUserDisplayName(trimmed)
      toast.success("Nome atualizado")
      // Refresh pra o AuthProvider repuxar o user com o novo displayName
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.replace("/login")
    } catch (err) {
      console.error(err)
      toast.error("Falha ao sair")
      setSigningOut(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <h1 className="text-foreground text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Tua conta e preferências.
          </p>
        </header>

        <section className="border-border bg-card mb-6 rounded-2xl border p-6">
          <h2 className="text-foreground mb-1 text-lg font-semibold">Perfil</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Como você aparece pra você mesmo e (futuramente) pros outros.
          </p>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="displayName"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Nome de exibição
              </label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="border-border bg-muted text-muted-foreground w-full rounded-md border px-3 py-2 text-sm opacity-70"
              />
              <p className="text-muted-foreground mt-1.5 text-xs">
                Pra trocar o e-mail é preciso re-autenticar — fica pra outra
                versão.
              </p>
            </div>

            <div>
              <p className="text-foreground mb-1.5 text-sm font-medium">
                Tipo de conta
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm">
                {user.role === "master" ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-foreground font-medium">Master</span>
                    <span className="text-muted-foreground">
                      · acesso total
                    </span>
                  </>
                ) : (
                  <>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">Padrão</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || name.trim() === user.displayName}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </section>

        <section className="border-destructive/30 bg-destructive/5 rounded-2xl border p-6">
          <h2 className="text-foreground mb-1 text-lg font-semibold">Sair</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Desconecta sua conta deste dispositivo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="gap-2"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sair da conta
          </Button>
        </section>
      </div>
      <Toaster />
    </div>
  )
}
