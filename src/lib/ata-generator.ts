import type {
  Ata,
  AtaDiscussao,
  AtaParticipante,
  AtaPlanoAcao,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

/**
 * Local-only ata generator. No LLM/API required.
 *
 * Strategy: produce a structured draft with the canonical 11 sections.
 * Heuristics fill what they can from segments + AssemblyAI intelligence;
 * everything else stays empty for the user to edit inline.
 */

const SECONDS_PER_HOUR = 3600
const SECONDS_PER_MINUTE = 60

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ""
  const h = Math.floor(seconds / SECONDS_PER_HOUR)
  const m = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const s = Math.floor(seconds % SECONDS_PER_MINUTE)
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function extractParticipants(
  segments?: TranscriptionSegment[],
): AtaParticipante[] {
  if (!segments || segments.length === 0) return []
  const seen = new Set<string>()
  const order: string[] = []
  for (const s of segments) {
    const sp = s.speaker?.trim()
    if (!sp) continue
    if (!seen.has(sp)) {
      seen.add(sp)
      order.push(sp)
    }
  }
  return order.map((label, i) => {
    const isGeneric = /^(?:speaker\s*)?[a-z0-9]{1,3}$/i.test(label)
    return {
      nome: isGeneric ? `Participante ${i + 1}` : label,
      cargo: undefined,
    }
  })
}

function splitSentences(text: string): string[] {
  if (!text) return []
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const DECISION_PATTERNS: RegExp[] = [
  /\b(?:ficou|fica|foi|está)\s+(?:decidido|definido|combinado|aprovado|acordado)\b/i,
  /\b(?:decidimos|definimos|combinamos|aprovamos|vetamos|rejeitamos)\b/i,
  /\ba\s+decis[aã]o\s+(?:é|foi|ficou)\b/i,
  /\b(?:vamos|iremos)\s+(?:com|seguir|adotar)\b/i,
  /\b(?:aprovad[ao]|reprovad[ao]|vetad[ao]|rejeitad[ao])\s+(?:por|pela|pelo|por unanimidade)/i,
]

const ACTION_PATTERNS: RegExp[] = [
  /\b(?:fic(?:a|ou)\s+responsável|fic(?:a|ou)\s+com|fic(?:a|ou)\s+encarregad[ao])\b/i,
  /\b(?:vai|vou|vamos|iremos)\s+(?:fazer|enviar|preparar|criar|implementar|revisar|levantar|montar|trazer|apresentar|agendar|organizar|levar|definir|finalizar|entregar|validar|documentar|estruturar)\b/i,
  /\b(?:precisa|precisamos|preciso|tem que|temos que|é necessário)\s+\w+/i,
  /\b(?:até|prazo|deadline)\b.*\b(?:semana|amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo|dia\s*\d|próximo|próxima)/i,
]

const DEADLINE_REGEX =
  /\b(?:até|no dia|no prazo de|prazo\s*:?\s*)\s*([^.!?,]{2,40}?)(?=[.!?,]|$)/i
const RESPONSIBLE_REGEX =
  /\b(?:fic(?:a|ou)\s+(?:responsável|com|encarregad[ao]\s+(?:de|por)?)\s+)([\wÀ-ÿ]+(?:\s+[\wÀ-ÿ]+){0,3})/i

function cleanSentence(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

function extractDecisoes(transcription: string): string[] {
  const sentences = splitSentences(transcription)
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of sentences) {
    if (!DECISION_PATTERNS.some((re) => re.test(s))) continue
    const cleaned = cleanSentence(s)
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
    if (out.length >= 8) break
  }
  return out
}

function extractPlanoAcao(transcription: string): AtaPlanoAcao[] {
  const sentences = splitSentences(transcription)
  const seen = new Set<string>()
  const out: AtaPlanoAcao[] = []
  for (const s of sentences) {
    if (!ACTION_PATTERNS.some((re) => re.test(s))) continue
    const cleaned = cleanSentence(s)
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const respMatch = s.match(RESPONSIBLE_REGEX)
    const prazoMatch = s.match(DEADLINE_REGEX)
    out.push({
      descricao: cleaned,
      responsavel: respMatch?.[1]?.trim(),
      prazo: prazoMatch?.[1]?.trim(),
      status: "Não iniciado",
    })
    if (out.length >= 10) break
  }
  return out
}

function buildPauta(intelligence?: TranscriptionIntelligence): string[] {
  if (intelligence?.chapters && intelligence.chapters.length > 0) {
    return intelligence.chapters
      .map((c) => c.headline || c.gist)
      .filter((s): s is string => Boolean(s?.trim()))
      .slice(0, 6)
  }
  if (intelligence?.keyPhrases && intelligence.keyPhrases.length > 0) {
    return intelligence.keyPhrases
      .slice(0, 5)
      .map(
        (kp) =>
          kp.text.charAt(0).toUpperCase() + kp.text.slice(1).toLowerCase(),
      )
  }
  return []
}

function buildDiscussoes(
  transcription: string,
  intelligence?: TranscriptionIntelligence,
): AtaDiscussao[] {
  // Prefer AssemblyAI chapters — clean, summarized content.
  if (intelligence?.chapters && intelligence.chapters.length > 0) {
    return intelligence.chapters.slice(0, 6).map((c) => {
      const pontos = c.summary
        ? splitSentences(c.summary)
            .map((s) => s.replace(/^[-*•]\s*/, ""))
            .slice(0, 4)
        : c.gist
          ? [c.gist]
          : []
      return {
        topico: c.headline || c.gist || "Tópico",
        pontos,
      }
    })
  }

  if (intelligence?.summary) {
    return [
      {
        topico: "Resumo da reunião",
        pontos: splitSentences(intelligence.summary)
          .map((s) => s.replace(/^[-*•]\s*/, ""))
          .slice(0, 6),
      },
    ]
  }

  // Without intelligence, leave it empty — better than dumping raw transcript fragments.
  return []
}

function buildTitulo(intelligence?: TranscriptionIntelligence): string {
  const firstHeadline = intelligence?.chapters?.[0]?.headline?.trim()
  if (firstHeadline) return firstHeadline
  return "Ata de Reunião"
}

export function generateAtaLocal(input: {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  /** Nome do usuário autenticado, usado como default em responsavelAta. */
  currentUserName?: string
}): Ata {
  const { transcription, segments, intelligence, currentUserName } = input

  const participantes = extractParticipants(segments)
  const pauta = buildPauta(intelligence)
  const discussoes = buildDiscussoes(transcription, intelligence)
  const decisoes = extractDecisoes(transcription)
  const planoAcao = extractPlanoAcao(transcription)

  // Time + duration
  let duracao: string | undefined
  let horarioInicio: string | undefined
  let horarioTermino: string | undefined
  const now = new Date()
  if (segments && segments.length > 0) {
    const start = segments[0].start ?? 0
    const end = segments[segments.length - 1].end ?? 0
    const total = end - start
    if (total > 0) {
      duracao = formatDuration(total)
      const startDate = new Date(now.getTime() - total * 1000)
      horarioInicio = formatTime(startDate)
      horarioTermino = formatTime(now)
    }
  }

  return {
    // Cabeçalho — heurística não preenche; usuário edita
    empresa: undefined,
    projetoAssunto: undefined,
    tipoReuniao: undefined,
    data: now.toLocaleDateString("pt-BR"),
    horarioInicio,
    horarioTermino,
    duracao,
    localPlataforma: undefined,
    responsavelAta: currentUserName,
    liderReuniao: undefined,

    // Conteúdo
    titulo: buildTitulo(intelligence),
    objetivo: undefined,
    participantes,
    ausentes: [],
    pauta,
    discussoes,
    decisoes,
    pendencias: [],
    planoAcao,
    riscosObservacoes: [],
    proximosPassos: [],
    proximaReuniao: undefined,
    horarioEncerramento: formatTime(now),

    geradaEm: now.toISOString(),
  }
}
