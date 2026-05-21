import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { formatContextoForPrompt, loadContexto } from "@/lib/contexto-loader"
import {
  buildUserPromptLimpeza,
  SYSTEM_PROMPT_LIMPEZA,
} from "@/lib/prompts/limpeza"

const MODEL_ID = process.env.GEMINI_LIMPEZA_MODEL ?? "gemini-2.5-flash"

export const maxDuration = 60

interface LimpezaRequestBody {
  transcricaoBruta: string
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY_MISSING" },
      { status: 503 },
    )
  }

  let body: LimpezaRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.transcricaoBruta || typeof body.transcricaoBruta !== "string") {
    return NextResponse.json(
      { error: "Campo 'transcricaoBruta' é obrigatório" },
      { status: 400 },
    )
  }
  if (body.transcricaoBruta.trim().length < 20) {
    return NextResponse.json(
      { error: "Transcrição muito curta" },
      { status: 400 },
    )
  }

  try {
    const ctx = await loadContexto()
    const contextoFormatado = formatContextoForPrompt(ctx, "limpeza")

    const { text } = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT_LIMPEZA,
      prompt: buildUserPromptLimpeza({
        contexto: contextoFormatado,
        transcricaoBruta: body.transcricaoBruta,
      }),
      temperature: 0.1,
    })

    return NextResponse.json({ transcricaoLimpa: text.trim() })
  } catch (error) {
    console.error("[limpeza] error:", error)
    const message =
      error instanceof Error ? error.message : "Falha na limpeza da transcrição"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
