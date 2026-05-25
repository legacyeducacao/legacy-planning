import { normalizeAta } from "@/lib/ata-format"
import { generateAtaLocal } from "@/lib/ata-generator"
import type { MaterialItem } from "@/lib/material-extract"
import type {
  Ata,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

export interface AtaGenerationInput {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  /** Usuário autenticado — vira o responsavelAta e ownerUid. */
  currentUser?: { uid: string; displayName: string }
  /** Data da reunião no formato DD/MM/YYYY (pt-BR). Se omitida, o servidor
   *  usa a data de hoje como fallback. Normalmente derivada do
   *  `audioSource.recordedAt` (file.lastModified). */
  meetingDate?: string
  /** Lista de nomes confirmados pelo usuário como participantes da reunião.
   *  Quando passada, a IA usa APENAS estes nomes (cruzando com organograma
   *  pra cargo) em vez de inferir das menções na transcrição (que costuma
   *  alucinar). */
  confirmedParticipants?: string[]
  /** Materiais de apoio (rascunhos, fotos de quadro, notas) anexados pelo
   *  usuário. Texto vai no prompt; imagens viram parts multimodais quando o
   *  modelo suportar. */
  materials?: MaterialItem[]
}

export interface AtaGenerationResult {
  ata: Ata
  source: "llm" | "local"
  reason?: string
}

function applyOwnership(
  ata: Ata,
  user?: { uid: string; displayName: string },
): Ata {
  if (!user) return ata
  // ownerUid é um campo de runtime; o tipo Ata não conhece, mas a normalização
  // preserva campos desconhecidos no JSON serializado em localStorage.
  return {
    ...ata,
    responsavelAta: ata.responsavelAta || user.displayName,
    // @ts-expect-error — ownerUid é um campo de extensão, não está no type Ata
    ownerUid: user.uid,
  }
}

/**
 * Tenta gerar uma ata via /api/ata (Gemini). Cai pra heurística local se
 * a key estiver ausente, a chamada falhar ou retornar dados inválidos.
 */
export async function generateAta(
  input: AtaGenerationInput,
): Promise<AtaGenerationResult> {
  const local = () =>
    applyOwnership(
      generateAtaLocal({
        transcription: input.transcription,
        segments: input.segments,
        intelligence: input.intelligence,
        currentUserName: input.currentUser?.displayName,
      }),
      input.currentUser,
    )

  try {
    const response = await fetch("/api/ata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcription: input.transcription,
        segments: input.segments,
        currentUserName: input.currentUser?.displayName,
        data: input.meetingDate,
        confirmedParticipants: input.confirmedParticipants,
        materials: input.materials?.map((m) => ({
          name: m.name,
          kind: m.kind,
          mimeType: m.mimeType,
          text: m.text,
          dataUrl: m.dataUrl,
        })),
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const isKeyMissing =
        body?.error === "GOOGLE_GENERATIVE_AI_API_KEY_MISSING"
      return {
        ata: local(),
        source: "local",
        reason: isKeyMissing
          ? "GOOGLE_GENERATIVE_AI_API_KEY não configurada"
          : body?.error || `Erro ${response.status}`,
      }
    }

    const data = (await response.json()) as { ata: unknown }
    const ata = applyOwnership(normalizeAta(data.ata), input.currentUser)
    return { ata, source: "llm" }
  } catch (err) {
    return {
      ata: local(),
      source: "local",
      reason: err instanceof Error ? err.message : "Erro de rede",
    }
  }
}
