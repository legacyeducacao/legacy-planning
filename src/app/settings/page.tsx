"use client"

import {
  Camera,
  Loader2,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  signOut,
  updateUserDiscordWebhook,
  updateUserDisplayName,
  updateUserPhotoURL,
} from "@/lib/auth"
import { uploadAvatar } from "@/lib/upload-avatar"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [name, setName] = useState("")
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined)
  const [discordWebhook, setDiscordWebhook] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingDiscord, setSavingDiscord] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.displayName)
      setPhotoURL(user.photoURL)
      setDiscordWebhook(user.discordWebhookUrl ?? "")
    }
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

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPhoto(true)
    try {
      const { url } = await uploadAvatar(file, user.uid)
      await updateUserPhotoURL(url)
      setPhotoURL(url)
      toast.success("Foto atualizada")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Falha ao subir foto")
    } finally {
      setUploadingPhoto(false)
      // Reset do input pra permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveDiscord = async () => {
    if (discordWebhook.trim() === (user.discordWebhookUrl ?? "")) {
      toast.info("Sem mudanças pra salvar")
      return
    }
    setSavingDiscord(true)
    try {
      await updateUserDiscordWebhook(discordWebhook)
      toast.success(
        discordWebhook.trim()
          ? "Webhook do Discord salvo"
          : "Webhook do Discord removido",
      )
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Falha ao salvar")
    } finally {
      setSavingDiscord(false)
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
            Meu perfil
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Tua conta e preferências.
          </p>
        </header>

        <section className="border-border bg-card mb-6 rounded-2xl border p-6">
          <h2 className="text-foreground mb-1 text-lg font-semibold">Perfil</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Como você aparece pra você mesmo e pros outros.
          </p>

          <div className="space-y-5">
            {/* Foto de perfil */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Trocar foto de perfil"
                className="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {photoURL ? (
                  // biome-ignore lint/performance/noImgElement: external URL, next/image needs config
                  <img
                    src={photoURL}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {user.initials.slice(0, 1)}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploadingPhoto ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </span>
              </button>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">
                  Foto de perfil
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Clique pra trocar. JPG, PNG ou WebP, até 5MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

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

        <section className="border-border bg-card mb-6 rounded-2xl border p-6">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            Integrações
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Envia atas direto pra outros lugares.
          </p>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="discordWebhook"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Webhook do Discord
              </label>
              <input
                id="discordWebhook"
                type="url"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                disabled={savingDiscord}
                placeholder="https://discord.com/api/webhooks/..."
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
              />
              <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                Pega no Discord: clica na engrenagem de um canal de texto →
                Integrações → Criar Webhook → Copiar URL. Quando configurado, o
                botão "Discord" aparece na ata.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSaveDiscord}
                disabled={
                  savingDiscord ||
                  discordWebhook.trim() === (user.discordWebhookUrl ?? "")
                }
                className="gap-2"
              >
                {savingDiscord && <Loader2 className="h-4 w-4 animate-spin" />}
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
