import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { CURRENT_USER } from "@/lib/user"
import type { Ata } from "@/types/transcription"

export const maxDuration = 30

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const SYSTEM_PROMPT = `Você é um redator de emails corporativos em português brasileiro. Recebe uma ata estruturada de reunião e produz um email profissional para enviar aos participantes e stakeholders compartilhando os pontos-chave.

REGRAS:
1. Tom: cordial, direto, profissional. Sem floreios.
2. Estrutura padrão:
   - Saudação curta ("Olá pessoal," ou "Time,")
   - 1 frase de contexto (que reunião foi, quando)
   - "Principais pontos:" + 3 a 6 bullets curtos com decisões e ações
   - 1 frase sobre próximos passos / próxima reunião (se houver)
   - Assinatura ("Abraço," + nome do redator)
3. NÃO mencione anexos, arquivos em anexo ou "ata anexa". O conteúdo extra é tratado fora do email.
4. Bullets devem destacar APENAS o que importa: decisões fechadas, responsáveis e prazos do plano de ação, e próximos passos relevantes.
5. NÃO copie literalmente a transcrição. Reescreva em voz própria, conciso.
6. Comprimento total: 150 a 350 palavras. Email curto vence email longo.
7. Subject line: começa com "Ata —" seguido de tema + data. Máximo 80 chars.

SAÍDA: apenas JSON puro com o schema:
{
  "subject": "string",
  "body": "string com quebras de linha \\n"
}`

interface EmailRequestBody {
  ata: Ata
}

function buildUserPrompt(ata: Ata, signature: string): string {
  // Envia uma versão compacta da ata pro modelo (sem campos vazios)
  const compact: Record<string, unknown> = { titulo: ata.titulo }
  if (ata.empresa) compact.empresa = ata.empresa
  if (ata.projetoAssunto) compact.projetoAssunto = ata.projetoAssunto
  if (ata.tipoReuniao) compact.tipoReuniao = ata.tipoReuniao
  if (ata.data) compact.data = ata.data
  if (ata.duracao) compact.duracao = ata.duracao
  if (ata.objetivo) compact.objetivo = ata.objetivo
  if (ata.participantes.length > 0)
    compact.participantes = ata.participantes.map((p) =>
      p.cargo ? `${p.nome} (${p.cargo})` : p.nome,
    )
  if (ata.pauta.length > 0) compact.pauta = ata.pauta
  if (ata.decisoes.length > 0) compact.decisoes = ata.decisoes
  if (ata.planoAcao.length > 0)
    compact.planoAcao = ata.planoAcao.map((a) => ({
      descricao: a.descricao,
      responsavel: a.responsavel ?? undefined,
      prazo: a.prazo ?? undefined,
    }))
  if (ata.proximosPassos.length > 0) compact.proximosPassos = ata.proximosPassos
  if (ata.proximaReuniao) compact.proximaReuniao = ata.proximaReuniao
  if (ata.riscosObservacoes.length > 0)
    compact.riscosObservacoes = ata.riscosObservacoes

  return `Redator do email: ${signature}

ATA (JSON):
${JSON.stringify(compact, null, 2)}`
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

  let body: EmailRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  if (!body.ata || typeof body.ata !== "object") {
    return NextResponse.json(
      { error: "Campo 'ata' é obrigatório" },
      { status: 400 },
    )
  }

  try {
    const { text } = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body.ata, CURRENT_USER.nome),
      providerOptions: {
        google: { responseMimeType: "application/json" },
      },
      temperature: 0.4,
    })

    const cleaned = stripFences(text)
    const parsed = JSON.parse(cleaned) as {
      subject?: string
      body?: string
    }

    return NextResponse.json({
      subject: parsed.subject ?? `Ata — ${body.ata.titulo}`,
      body: parsed.body ?? "",
    })
  } catch (error) {
    console.error("[ata/email] generation error:", error)
    const message =
      error instanceof Error ? error.message : "Falha ao gerar email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
