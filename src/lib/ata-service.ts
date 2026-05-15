import { normalizeAta } from "@/lib/ata-format"
import { generateAtaLocal } from "@/lib/ata-generator"
import type {
  Ata,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

export interface AtaGenerationInput {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
}

export interface AtaGenerationResult {
  ata: Ata
  source: "llm" | "local"
  reason?: string // ex: "Sem OPENAI_API_KEY", "Falha na chamada da API"
}

/**
 * Tenta gerar uma ata real via /api/ata (LLM). Cai pra geração heurística
 * local se a key estiver ausente, a chamada falhar ou retornar dados ruins.
 */
export async function generateAta(
  input: AtaGenerationInput,
): Promise<AtaGenerationResult> {
  const local = () => {
    const ata = generateAtaLocal(input)
    return ata
  }

  try {
    const response = await fetch("/api/ata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcription: input.transcription,
        segments: input.segments,
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
    const ata = normalizeAta(data.ata)
    return { ata, source: "llm" }
  } catch (err) {
    return {
      ata: local(),
      source: "local",
      reason: err instanceof Error ? err.message : "Erro de rede",
    }
  }
}
