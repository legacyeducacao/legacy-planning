import {
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { getAuth, getFirestore } from "@/lib/firebase"
import type { AuthUser, Role } from "@/types/auth"

/**
 * E-mails que ganham papel de Master automaticamente no primeiro login.
 * Outros usuários entram como "padrao". Promover/rebaixar manualmente é
 * feito direto no console do Firestore em users/{uid}.role.
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
 * Lê (ou cria, no primeiro login) o doc do usuário em Firestore.
 * Retorna o AuthUser combinado (Firebase Auth + role do Firestore).
 */
export async function hydrateUser(fbUser: FirebaseUser): Promise<AuthUser> {
  const db = getFirestore()
  const ref = doc(db, "users", fbUser.uid)
  const snap = await getDoc(ref)

  let role: Role = "padrao"
  let displayName =
    fbUser.displayName || fbUser.email?.split("@")[0] || "Usuário"

  const emailLower = (fbUser.email ?? "").toLowerCase()
  const isWhitelisted = MASTER_EMAILS.has(emailLower)

  if (snap.exists()) {
    const data = snap.data() as { role?: Role; displayName?: string }
    if (data.role === "master" || data.role === "padrao") role = data.role
    if (data.displayName) displayName = data.displayName

    // Auto-promove: se email entrou no whitelist depois do signup, atualiza
    // o role pra master. Nunca rebaixa (master fica master mesmo fora do
    // whitelist — pra rebaixar tem que editar manualmente no Firestore).
    if (role === "padrao" && isWhitelisted) {
      role = "master"
      await updateDoc(ref, { role: "master" })
    }
  } else {
    // Bootstrap: cria o doc com role baseado no whitelist.
    role = isWhitelisted ? "master" : "padrao"
    await setDoc(ref, {
      email: fbUser.email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    })
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email ?? "",
    displayName,
    initials: deriveInitials(displayName, fbUser.email ?? ""),
    role,
    photoURL: fbUser.photoURL ?? undefined,
  }
}

export function subscribeAuthState(
  onUser: (user: AuthUser | null) => void,
  onError?: (err: Error) => void,
) {
  const auth = getAuth()
  return onAuthStateChanged(
    auth,
    async (fbUser) => {
      if (!fbUser) {
        onUser(null)
        return
      }
      try {
        const user = await hydrateUser(fbUser)
        onUser(user)
      } catch (err) {
        console.error("[auth] hydrate failed:", err)
        onError?.(err instanceof Error ? err : new Error("hydrate failed"))
        onUser(null)
      }
    },
    (err) => {
      console.error("[auth] state subscription error:", err)
      onError?.(err)
    },
  )
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const auth = getAuth()
  const provider = new GoogleAuthProvider()
  const { user } = await signInWithPopup(auth, provider)
  return hydrateUser(user)
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const auth = getAuth()
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return hydrateUser(user)
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthUser> {
  const auth = getAuth()
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  // displayName tem que ser persistido manualmente
  const db = getFirestore()
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName,
    role: MASTER_EMAILS.has(email.toLowerCase()) ? "master" : "padrao",
    createdAt: serverTimestamp(),
  })
  return hydrateUser(user)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuth())
}

/**
 * Atualiza o nome de exibição do usuário em ambos Firebase Auth e o doc
 * em users/{uid} do Firestore (mantém em sync).
 */
export async function updateUserDisplayName(
  displayName: string,
): Promise<void> {
  const auth = getAuth()
  const fbUser = auth.currentUser
  if (!fbUser) throw new Error("Sem usuário autenticado")
  const trimmed = displayName.trim()
  if (!trimmed) throw new Error("Nome não pode ficar vazio")
  await updateProfile(fbUser, { displayName: trimmed })
  const db = getFirestore()
  await updateDoc(doc(db, "users", fbUser.uid), { displayName: trimmed })
}

/**
 * Atualiza a foto de perfil — Firebase Auth photoURL + doc Firestore.
 * Recebe a URL pública já gerada (geralmente vem do uploadAvatar).
 */
export async function updateUserPhotoURL(photoURL: string): Promise<void> {
  const auth = getAuth()
  const fbUser = auth.currentUser
  if (!fbUser) throw new Error("Sem usuário autenticado")
  await updateProfile(fbUser, { photoURL })
  const db = getFirestore()
  await updateDoc(doc(db, "users", fbUser.uid), { photoURL })
}
