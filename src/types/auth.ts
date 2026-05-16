/**
 * Tipos do sistema de autenticação e autorização.
 *
 * Dois papéis:
 * - master:  pode criar/editar/excluir/ver qualquer ata.
 * - padrao:  pode criar; edita só o que criou, é responsável ou participou;
 *            exclui só o que criou; vê só atas aprovadas + as próprias.
 */

export type Role = "master" | "padrao"

export interface AuthUser {
  uid: string
  email: string
  displayName: string
  initials: string
  role: Role
  photoURL?: string
}
