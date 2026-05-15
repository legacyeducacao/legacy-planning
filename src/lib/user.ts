/**
 * Identidade do usuário atual. Sem auth no app — fonte única pra evitar
 * inconsistência entre TopBar, ata gerada, exports, etc.
 */
export const CURRENT_USER = {
  nome: "Lair Rodrigo",
  nomeCurto: "Lair R.",
  iniciais: "LR",
} as const
