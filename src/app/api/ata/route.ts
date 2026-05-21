import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { normalizeAta } from "@/lib/ata-format"
import { formatContextoForPrompt, loadContexto } from "@/lib/contexto-loader"
import type { TranscriptionSegment } from "@/types/transcription"

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um analista de produto da Legacy Educação responsável por gerar atas de reuniões internas em português brasileiro. Vai receber: (1) o CONTEXTO da empresa (organograma, catálogo de produtos, glossário) e (2) uma TRANSCRIÇÃO automática que pode conter erros de reconhecimento de fala.

PRINCÍPIO #1 — USE O CONTEXTO:
A transcrição é de uma reunião INTERNA da Legacy Educação. Sempre que possível, preencha os campos institucionais com base no contexto fornecido, não null:
- empresa: "Legacy Educação"
- participantes: use os nomes e CARGOS oficiais do organograma (seção EQUIPE do contexto), na primeira menção
- tipoReuniao, projetoAssunto, objetivo: infira do conteúdo e do escopo dos produtos/áreas mencionados

PRINCÍPIO #2 — CORRIJA ERROS DE TRANSCRIÇÃO:
A transcrição automática frequentemente erra nomes. Use a seção "Variações comuns de transcrição" do contexto EQUIPE como mapa automático de correções. Exemplos:
- "Clayton" → "Clailton"
- "Sempre Israel" / "Inteligência Israel" → "Impulsão Empresarial" / "Inteligência Empresarial"
- "Lightning" / "Light" → "Legacy"
- "Lego Explorer" / "Leg Splend" / "Alex Klan" / "Alex Plan" → "Legacy Plan"
Aplique sem perguntar. Cite produtos sempre pelo nome oficial do catálogo (seção PRODUTOS).

PRINCÍPIO #3 — NÃO INVENTE:
- Nomes de PESSOAS que não estejam no organograma: mantenha como aparecem, ou "Não identificado".
- PRODUTOS que não estejam no catálogo: registre como dito, ou marque na seção riscosObservacoes pra revisão humana.
- NÚMEROS, PREÇOS e PRAZOS: preserve exatamente como ditos na transcrição. Não normalize.

REGRAS DE ESTRUTURA:
1. Identifique participantes pelos rótulos de falante (Participante 1, 2, 3) ou por nomes/menções diretas. Cruze com o organograma pra atribuir cargo.
2. Decisões: frases declaratórias que selaram algo ("vamos fazer", "fica decidido", "aprovado", "decidimos", "está combinado"). DISTINGA decisão tomada vs proposta em discussão.
3. Plano de ação: frases imperativas com responsável + prazo ("Ele vai preparar X até quinta"). Use o primeiro nome do responsável conforme organograma.
4. Pauta: 3 a 6 tópicos macro, em ordem de aparição. Cada item deve ter um bloco correspondente em discussoes.
5. Discussões: para cada item da pauta, 2 a 5 pontos-chave em frases curtas, REESCRITAS na voz do redator (não cole o transcript bruto).
6. Riscos/observações: ameaças, gaps, dependências, pontos de atenção mencionados — incluindo termos suspeitos ("aparece 'X' na transcrição mas não bate com nenhum produto do catálogo").
7. Tom: formal, claro, objetivo. Sem floreios. Sem repetir.

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

function buildUserPrompt(body: AtaRequestBody, contexto: string): string {
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

  return `## CONTEXTO DA EMPRESA (Legacy Educação)

${contexto}

---

## TRANSCRIÇÃO DA REUNIÃO

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
    const ctx = await loadContexto()
    const contextoFormatado = formatContextoForPrompt(ctx, "ata")

    const { text } = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body, contextoFormatado),
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
