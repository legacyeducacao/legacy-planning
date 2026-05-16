import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { normalizeAta } from "@/lib/ata-format"
import type { TranscriptionSegment } from "@/types/transcription"

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um especialista em redação de atas de reunião corporativas em português brasileiro. A partir de uma transcrição (com falantes quando disponível), você produz uma ata completa seguindo o modelo brasileiro de 11 seções.

REGRAS DURAS:
1. Não invente nomes próprios, datas, prazos, cargos ou métricas. Se a evidência não estiver na transcrição, use null ou string vazia.
2. Para os campos institucionais (empresa, projetoAssunto, tipoReuniao, objetivo), inferir do conteúdo é OK — mas seja conservador. Se incerto, deixe null.
3. Identifique participantes pelos rótulos de falante (Participante 1, 2, 3) ou por nomes/menções diretas na fala. Não rotule um falante anônimo com um nome real.
4. Decisões: frases declaratórias que selaram algo. Olhe por verbos como "vamos fazer", "fica decidido", "aprovado", "decidimos", "está combinado".
5. Plano de ação: frases imperativas / com responsável / com prazo. "Ele vai preparar X até quinta".
6. Pauta: 3 a 6 tópicos macro, em ordem de aparição. Cada item da pauta deve ter um bloco correspondente em discussoes.
7. Discussões: para cada item da pauta, 2 a 5 pontos-chave em frases curtas, REESCRITAS na voz do redator (não cole o transcript bruto).
8. Riscos/observações: ameaças, gaps, dependências, pontos de atenção mencionados.
9. Tom: formal, claro, objetivo. Sem floreios. Sem repetir.

SAÍDA: apenas JSON puro, sem markdown, sem texto fora, sem comentários, seguindo este schema exato:

{
  "titulo": "string — título descritivo curto, ex: 'Ata da Reunião — Alinhamento de Produto'",
  "empresa": "string ou null",
  "projetoAssunto": "string ou null — tema central inferido",
  "tipoReuniao": "Alinhamento | Status | Decisão | Planejamento | Comitê | Outro | null",
  "objetivo": "string ou null — 1 a 2 frases sobre o propósito",
  "participantes": [{ "nome": "string", "cargo": "string ou null" }],
  "ausentes": [{ "nome": "string", "cargo": "string ou null" }],
  "pauta": ["string"],
  "discussoes": [{ "topico": "string", "pontos": ["string"] }],
  "decisoes": ["string"],
  "pendencias": ["string"],
  "planoAcao": [
    {
      "descricao": "string",
      "responsavel": "string ou null",
      "prazo": "string ou null",
      "status": "Não iniciado"
    }
  ],
  "riscosObservacoes": ["string"],
  "proximosPassos": ["string"],
  "proximaReuniao": {
    "data": "string ou null",
    "horario": "string ou null",
    "local": "string ou null",
    "objetivo": "string ou null"
  }
}`

interface AtaRequestBody {
  transcription: string
  segments?: TranscriptionSegment[]
  data?: string
  duracao?: string
  horarioInicio?: string
  horarioTermino?: string
  currentUserName?: string
}

function buildUserPrompt(body: AtaRequestBody): string {
  const { transcription, segments } = body

  let content: string
  if (segments && segments.length > 0 && segments.some((s) => s.speaker)) {
    // Agrupa por falante consecutivo pra reduzir ruído
    const grouped: string[] = []
    let current = ""
    let lastSpeaker = ""
    for (const seg of segments) {
      const speaker = seg.speaker
        ? /^[a-z0-9]{1,3}$/i.test(seg.speaker)
          ? `Participante ${seg.speaker.toUpperCase()}`
          : seg.speaker
        : ""
      if (speaker !== lastSpeaker) {
        if (current) grouped.push(current.trim())
        current = `[${speaker}] ${seg.text}`
        lastSpeaker = speaker
      } else {
        current += ` ${seg.text}`
      }
    }
    if (current) grouped.push(current.trim())
    content = grouped.join("\n")
  } else {
    content = transcription
  }

  // Hard cap on context — gpt-4o-mini tem 128k mas atas longas ficam caras.
  const MAX_CHARS = 60000
  if (content.length > MAX_CHARS) {
    content = `${content.slice(0, MAX_CHARS)}\n\n[... transcrição truncada — ${content.length - MAX_CHARS} caracteres adicionais não incluídos ...]`
  }

  return `TRANSCRIÇÃO:
${content}`
}

function stripFences(text: string): string {
  const t = text.trim()
  if (t.startsWith("```")) {
    return t
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim()
  }
  return t
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY_MISSING" },
      { status: 503 },
    )
  }

  let body: AtaRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.transcription || typeof body.transcription !== "string") {
    return NextResponse.json(
      { error: "Campo 'transcription' é obrigatório" },
      { status: 400 },
    )
  }
  if (body.transcription.trim().length < 80) {
    return NextResponse.json(
      { error: "Transcrição muito curta para gerar ata" },
      { status: 400 },
    )
  }

  try {
    const { text } = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body),
      providerOptions: {
        google: { responseMimeType: "application/json" },
      },
      temperature: 0.2,
    })

    const cleaned = stripFences(text)
    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error(
        "[ata] JSON parse fail:",
        err,
        "raw:",
        cleaned.slice(0, 500),
      )
      return NextResponse.json(
        { error: "Modelo retornou JSON inválido" },
        { status: 502 },
      )
    }

    // Merge LLM output com metadados controlados pelo servidor
    const llmAta = parsed as Record<string, unknown>
    const now = new Date()
    const ataInput = {
      ...llmAta,
      data: body.data ?? now.toLocaleDateString("pt-BR"),
      horarioInicio: body.horarioInicio ?? llmAta.horarioInicio,
      horarioTermino: body.horarioTermino ?? llmAta.horarioTermino,
      duracao: body.duracao ?? llmAta.duracao,
      geradaEm: now.toISOString(),
    }

    const ata = normalizeAta(ataInput)

    // Defaults pós-LLM: campos que o usuário não precisa preencher
    if (!ata.responsavelAta && body.currentUserName) {
      ata.responsavelAta = body.currentUserName
    }
    if (!ata.horarioEncerramento) ata.horarioEncerramento = formatTime(now)

    return NextResponse.json({ ata })
  } catch (error) {
    console.error("[ata] generation error:", error)
    const message =
      error instanceof Error ? error.message : "Falha ao gerar ata"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
