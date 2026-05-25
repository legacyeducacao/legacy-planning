import type { AuthUser } from "@/types/auth"
import type { Ata } from "@/types/transcription"

/**
 * Centraliza a matriz de permissões da ata.
 *
 *  | Quem    | Criar | Editar                                       | Excluir          | Visualizar         |
 *  |---------|-------|----------------------------------------------|------------------|--------------------|
 *  | Master  | ✅     | ✅ qualquer                                   | ✅ qualquer       | ✅ tudo             |
 *  | Padrão  | ✅     | ✅ criou OU é responsável OU está na reunião  | ✅ só os que criou| ✅ aprovados + próprios |
 *
 *  Mesmo que a UI esconda controles, NUNCA confiar só nesses helpers no
 *  cliente — quando as atas migrarem pra Firestore, as security rules
 *  devem replicar esta mesma matriz.
 */

interface OwnedAta extends Ata {
  /** uid do criador. Atas legadas (sem este campo) tratadas como "do usuário atual" pelo padrão. */
  ownerUid?: string
  /** Status de aprovação. Master aprova; padrão só vê aprovadas + próprias. */
  aprovada?: boolean
  /** Lista opcional de uids participantes (preenchida quando há login). */
  participantesUids?: string[]
}

function isOwner(ata: OwnedAta, user: AuthUser): boolean {
  // Atas legadas sem ownerUid (incluindo ciclos pelo cache do AtaPanel que
  // perdem o campo via normalizeAta) são tratadas como "do usuário atual" —
  // honrando o contrato documentado em OwnedAta.
  if (!ata.ownerUid) return true
  return ata.ownerUid === user.uid
}

function isResponsible(ata: OwnedAta, user: AuthUser): boolean {
  if (!ata.responsavelAta) return false
  const r = ata.responsavelAta.trim().toLowerCase()
  if (!r) return false
  return (
    r === user.displayName.toLowerCase() ||
    r === user.email.toLowerCase() ||
    r.includes(user.displayName.toLowerCase())
  )
}

function isInMeeting(ata: OwnedAta, user: AuthUser): boolean {
  if (ata.participantesUids?.includes(user.uid)) return true
  // Fallback: nome bate com algum participante listado
  const myName = user.displayName.toLowerCase()
  return ata.participantes.some(
    (p) => p.nome && p.nome.toLowerCase().includes(myName),
  )
}

/** Qualquer usuário autenticado pode criar atas. */
export function canCreate(user: AuthUser | null): boolean {
  return !!user
}

export function canEdit(ata: OwnedAta, user: AuthUser | null): boolean {
  if (!user) return false
  if (user.role === "master") return true
  return (
    isOwner(ata, user) || isResponsible(ata, user) || isInMeeting(ata, user)
  )
}

export function canDelete(ata: OwnedAta, user: AuthUser | null): boolean {
  if (!user) return false
  if (user.role === "master") return true
  return isOwner(ata, user)
}

export function canView(ata: OwnedAta, user: AuthUser | null): boolean {
  if (!user) return false
  if (user.role === "master") return true
  if (isOwner(ata, user)) return true
  // Quem é responsavelAta também pode ver (caso de ownerUid setado a um uid
  // antigo após troca de conta com mesmo nome/email).
  if (isResponsible(ata, user)) return true
  if (ata.aprovada === true) return true
  return false
}

export function canApprove(user: AuthUser | null): boolean {
  return user?.role === "master"
}

/** Lista de atas filtrada por permissão de view. */
export function filterViewableAtas<T extends OwnedAta>(
  atas: T[],
  user: AuthUser | null,
): T[] {
  return atas.filter((a) => canView(a, user))
}
