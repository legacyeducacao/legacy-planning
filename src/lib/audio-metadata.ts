/**
 * Extrai a data de gravação de um arquivo de áudio via metadata.
 *
 * Funciona pra M4A (creation_time do átomo moov/mvhd), MP3 (ID3v2 TDRC/TYER),
 * FLAC/OGG (vorbis comments), WAV (BWAV chunk), etc.
 *
 * Fallback: se metadata não tem data ou parsing falha, retorna null —
 * caller deve cair pra file.lastModified.
 */

import { parseBlob } from "music-metadata"

// Sanity: aceita data entre 2020-01-01 e amanhã. Filtra lixo tipo
// epoch zero ou datas no futuro.
const MIN_DATE_MS = new Date("2020-01-01").getTime()
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000

function sanityCheck(date: Date): boolean {
  const t = date.getTime()
  if (Number.isNaN(t)) return false
  if (t < MIN_DATE_MS) return false
  if (t > Date.now() + MAX_FUTURE_MS) return false
  return true
}

export async function getAudioRecordedDate(file: File): Promise<Date | null> {
  try {
    const metadata = await parseBlob(file, { duration: false })

    // common.date: string ISO ou YYYY-MM-DD
    if (metadata.common.date) {
      const d = new Date(metadata.common.date)
      if (sanityCheck(d)) return d
    }

    // common.year: number
    if (metadata.common.year) {
      const d = new Date(metadata.common.year, 0, 1)
      if (sanityCheck(d)) return d
    }

    // QuickTime/M4A: creation_time vem dentro de native, em formato proprietário
    const quicktime = metadata.native["iTunes"] ?? metadata.native["quicktime"]
    if (quicktime) {
      for (const tag of quicktime) {
        if (
          tag.id === "creation_time" ||
          tag.id === "©day" ||
          tag.id === "TDRC"
        ) {
          const d = new Date(String(tag.value))
          if (sanityCheck(d)) return d
        }
      }
    }

    return null
  } catch (err) {
    console.warn(
      "[audio-metadata] parsing falhou:",
      err instanceof Error ? err.message : err,
    )
    return null
  }
}
