import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import type { Ata } from "@/types/transcription"

export const maxDuration = 30

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const SYSTEM_PROMPT = `Você é um redator de emails corporativos em português brasileiro. Recebe uma ata estruturada de reunião e produz APENAS o corpo do email para enviar aos participantes e stakeholders compartilhando os pontos-chave. O assunto é gerado separadamente — não escreva "Assunto:" no email.

REGRAS:
1. Tom: cordial, direto, profissional. Sem floreios.
2. Estrutura:
   - Saudação curta ("Olá pessoal," ou "Time,")
   - 1 frase de contexto (que reunião foi, quando)
   - "Principais pontos:" + 3 a 6 bullets curtos com decisões e ações
   - 1 frase sobre próximos passos / próxima reunião (se houver)
   - Assinatura ("Abraço," + nome do redator)
3. NÃO mencione anexos, arquivos em anexo ou "ata anexa". O conteúdo extra é tratado fora do email.
4. Bullets destacam APENAS o que importa: decisões fechadas, responsáveis e prazos do plano de ação, próximos passos relevantes.
5. NÃO copie literalmente a transcrição. Reescreva em voz própria, conciso.
6. Comprimento: 150 a 350 palavras. Email curto vence email longo.

SAÍDA: texto puro do email (UTF-8, com quebras de linha de verdade). Sem JSON, sem markdown além de bullets simples (- ou •), sem cabeçalho "Assunto:".`

interface EmailRequestBody {
  ata: Ata
  /** Nome do autor (usado na assinatura "Abraço,\nNome"). */
  signature?: string
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
    const result = streamText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(
        body.ata,
        body.signature ?? body.ata.responsavelAta ?? "—",
      ),
      temperature: 0.4,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[ata/email] generation error:", error)
    const message =
      error instanceof Error ? error.message : "Falha ao gerar email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
