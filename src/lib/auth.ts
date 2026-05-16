import {
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { getAuth, getFirestore } from "@/lib/firebase"
import type { AuthUser, Role } from "@/types/auth"

/**
 * E-mails que ganham papel de Master automaticamente no primeiro login.
 * Outros usuários entram como "padrao". Promover/rebaixar manualmente é
 * feito direto no console do Firestore em users/{uid}.role.
 */
const MASTER_EMAILS = new Set<string>([
  "educacaolegacy@gmail.com",
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

  if (snap.exists()) {
    const data = snap.data() as { role?: Role; displayName?: string }
    if (data.role === "master" || data.role === "padrao") role = data.role
    if (data.displayName) displayName = data.displayName
  } else {
    // Bootstrap: cria o doc com role baseado no whitelist.
    role = MASTER_EMAILS.has((fbUser.email ?? "").toLowerCase())
      ? "master"
      : "padrao"
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
