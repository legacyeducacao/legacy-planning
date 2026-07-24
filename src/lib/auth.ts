import { getSupabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { AuthUser, Role } from "@/types/auth"

/**
 * E-mails que ganham papel de Master automaticamente no primeiro login.
 * Outros usuários entram como "padrao". Promover/rebaixar manualmente é
 * feito direto na tabela profiles do Supabase.
 */
const MASTER_EMAILS = new Set<string>([
  "lair.lopes@legacyeducacaocorp.com.br",
  // Adicione outros e-mails de admin aqui se precisar.
])

function deriveInitials(name: string, email: string): string {
  const parts = (name || email.split("@")[0]).trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  return "??"
}

/**
 * Lê (ou cria, no primeiro login) o doc do usuário no Supabase.
 * Retorna o AuthUser combinado (Supabase Auth + role da tabela profiles).
 */
export async function hydrateUser(sbUser: SupabaseUser): Promise<AuthUser> {
  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sbUser.id)
    .single()

  let role: Role = "padrao"
  const userMetadata = sbUser.user_metadata || {}
  let displayName =
    userMetadata.display_name ||
    userMetadata.full_name ||
    sbUser.email?.split("@")[0] ||
    "Usuário"
  let discordWebhookUrl: string | undefined
  let photoURL: string | undefined = userMetadata.avatar_url

  const emailLower = (sbUser.email ?? "").toLowerCase()
  const isWhitelisted = MASTER_EMAILS.has(emailLower)

  if (profile) {
    if (profile.role === "master" || profile.role === "padrao") role = profile.role
    if (profile.display_name) displayName = profile.display_name
    if (profile.discord_webhook_url) discordWebhookUrl = profile.discord_webhook_url
    if (profile.photo_url) photoURL = profile.photo_url

    // Auto-promove: se email entrou no whitelist depois do signup, atualiza
    // o role pra master. Nunca rebaixa.
    if (role === "padrao" && isWhitelisted) {
      role = "master"
      await supabase
        .from("profiles")
        .update({ role: "master" })
        .eq("id", sbUser.id)
    }
  } else {
    // Bootstrap: cria o doc com role baseado no whitelist.
    role = isWhitelisted ? "master" : "padrao"
    await supabase.from("profiles").insert({
      id: sbUser.id,
      email: sbUser.email,
      display_name: displayName,
      role,
      photo_url: photoURL || null,
    })
  }

  return {
    uid: sbUser.id,
    email: sbUser.email ?? "",
    displayName,
    initials: deriveInitials(displayName, sbUser.email ?? ""),
    role,
    photoURL,
    discordWebhookUrl,
  }
}

export function subscribeAuthState(
  onUser: (user: AuthUser | null) => void,
  onError?: (err: Error) => void,
) {
  try {
    const supabase = getSupabase()

    // Busca inicial do usuário/sessão
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          onUser(null)
          return
        }
        hydrateUser(user)
          .then(onUser)
          .catch((err) => {
            console.error("[auth] initial hydrate failed:", err)
            onError?.(err instanceof Error ? err : new Error("hydrate failed"))
            onUser(null)
          })
      })
      .catch((err) => {
        console.error("[auth] getUser failed:", err)
        onUser(null)
      })

    // Escuta mudanças no estado de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sbUser = session?.user ?? null
      if (!sbUser) {
        onUser(null)
        return
      }
      try {
        const user = await hydrateUser(sbUser)
        onUser(user)
      } catch (err) {
        console.error("[auth] hydrate failed:", err)
        onError?.(err instanceof Error ? err : new Error("hydrate failed"))
        onUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  } catch (err) {
    console.error("[auth] subscribeAuthState crash:", err)
    onError?.(err instanceof Error ? err : new Error("subscribeAuthState failed"))
    onUser(null)
    return () => {}
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/login`,
    },
  })
  if (error) throw error
  return new Promise(() => {})
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const supabase = getSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  if (!user) throw new Error("Usuário não encontrado")
  return hydrateUser(user)
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthUser> {
  const supabase = getSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })
  if (error) throw error
  if (!user) throw new Error("Erro ao criar usuário")

  const role = MASTER_EMAILS.has(email.toLowerCase()) ? "master" : "padrao"
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    email,
    display_name: displayName,
    role,
  })
  if (profileError) {
    console.error("[auth] profiles insert error:", profileError)
  }

  return hydrateUser(user)
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Atualiza o nome de exibição do usuário no Supabase Auth e na tabela profiles.
 */
export async function updateUserDisplayName(
  displayName: string,
): Promise<void> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Sem usuário autenticado")
  const trimmed = displayName.trim()
  if (!trimmed) throw new Error("Nome não pode ficar vazio")

  await supabase.auth.updateUser({
    data: { display_name: trimmed },
  })

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id)
  if (error) throw error
}

/**
 * Atualiza a foto de perfil.
 */
export async function updateUserPhotoURL(photoURL: string): Promise<void> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Sem usuário autenticado")

  await supabase.auth.updateUser({
    data: { avatar_url: photoURL },
  })

  const { error } = await supabase
    .from("profiles")
    .update({ photo_url: photoURL })
    .eq("id", user.id)
  if (error) throw error
}

/**
 * Atualiza o webhook URL do Discord no Supabase.
 */
export async function updateUserDiscordWebhook(url: string): Promise<void> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Sem usuário autenticado")
  const trimmed = url.trim()
  if (trimmed && !trimmed.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error(
      "URL inválida — deve começar com https://discord.com/api/webhooks/",
    )
  }

  const { error } = await supabase
    .from("profiles")
    .update({ discord_webhook_url: trimmed || null })
    .eq("id", user.id)
  if (error) throw error
}
