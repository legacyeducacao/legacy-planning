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

/**
 * A tabela `profiles` é compartilhada com o Legacy Academy, que usa os papéis
 * "student" | "collaborator" | "admin" | "master". Aqui só existem dois papéis,
 * então traduzimos. Nunca escrevemos role na tabela: isso mudaria a permissão
 * do usuário dentro do Academy também.
 */
const DB_ROLES_MASTER = new Set(["master", "admin"])

function mapDbRole(dbRole: unknown): Role {
  return typeof dbRole === "string" && DB_ROLES_MASTER.has(dbRole)
    ? "master"
    : "padrao"
}

function deriveInitials(name: string, email: string): string {
  const parts = (name || email.split("@")[0]).trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  return "??"
}

/**
 * Lê o perfil do usuário no Supabase e devolve o AuthUser combinado
 * (Supabase Auth + role da tabela profiles).
 *
 * A linha em `profiles` é criada pelo trigger `handle_new_user` no signup —
 * este app não insere nada lá (a policy de INSERT só permite producer).
 */
export async function hydrateUser(sbUser: SupabaseUser): Promise<AuthUser> {
  let profile: {
    full_name?: string | null
    role?: string | null
    avatar_url?: string | null
  } | null = null
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", sbUser.id)
      .maybeSingle()
    profile = data
  } catch (err) {
    console.warn("[auth] profile fetch error (using fallback):", err)
  }

  const userMetadata = sbUser.user_metadata || {}
  const emailLower = (sbUser.email ?? "").toLowerCase()

  // Whitelist promove só na sessão deste app — não escreve na tabela.
  const role: Role = MASTER_EMAILS.has(emailLower)
    ? "master"
    : mapDbRole(profile?.role)

  const displayName =
    profile?.full_name ||
    userMetadata.display_name ||
    userMetadata.full_name ||
    sbUser.email?.split("@")[0] ||
    "Usuário"
  const photoURL: string | undefined =
    profile?.avatar_url || userMetadata.avatar_url || undefined
  // `profiles` é do Academy e não tem coluna pra isso, então mora no metadata.
  const discordWebhookUrl: string | undefined =
    userMetadata.discord_webhook_url || undefined

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
      .then(({ data: { user }, error }) => {
        if (error || !user) {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sbUser = session?.user ?? null
      if (!sbUser) {
        onUser(null)
        return
      }
      // NUNCA usar await aqui. O supabase-js roda este callback segurando o
      // lock interno do cliente de auth, e qualquer query chama getSession()
      // por baixo — que espera o mesmo lock. Isso trava o login inteiro, já
      // que signInWithPassword só resolve depois dos callbacks. O setTimeout
      // devolve o controle antes de encostar no banco.
      setTimeout(() => {
        hydrateUser(sbUser)
          .then(onUser)
          .catch((err) => {
            console.error("[auth] hydrate failed:", err)
            onError?.(err instanceof Error ? err : new Error("hydrate failed"))
            onUser(null)
          })
      }, 0)
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
      // `full_name` e `password_set` são lidos pelo trigger handle_new_user,
      // que é quem cria a linha em profiles.
      data: {
        full_name: displayName,
        display_name: displayName,
        password_set: true,
      },
    },
  })
  if (error) throw error
  if (!user) throw new Error("Erro ao criar usuário")

  return hydrateUser(user)
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase()
  // scope local: encerra só a sessão deste navegador. O default ('global')
  // revoga TODAS as sessões do usuário — inclusive as do Legacy Academy, que
  // compartilha este projeto Supabase — e derrubava o login aqui.
  const { error } = await supabase.auth.signOut({ scope: "local" })
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
    data: { display_name: trimmed, full_name: trimmed },
  })

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
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
    .update({ avatar_url: photoURL })
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

  // Guardado no user_metadata do Auth: a tabela profiles é do Academy e não
  // tem coluna pra isso.
  const { error } = await supabase.auth.updateUser({
    data: { discord_webhook_url: trimmed || null },
  })
  if (error) throw error
}
