import { google } from "@ai-sdk/google"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const SYSTEM_PROMPT = `Você é o Planner de Reuniões da Legacy Educação — ajuda gestores a estruturar reuniões nos pilares Comercial, Marketing, Financeiro, Operações, Produto e Liderança.

REGRAS DE CONVERSA:
1. Seja CONCISO. Respostas curtas (3-8 linhas) na maioria das mensagens.
2. UMA pergunta por vez. NUNCA dispare 5 perguntas com sub-perguntas. Se faltar contexto, escolha a UMA mais crítica e pergunte.
3. NÃO ofereça "estrutura genérica" enquanto espera resposta — isso polui. Espere o usuário responder antes de propor pauta detalhada.
4. Quando o usuário tiver fornecido contexto mínimo (área + objetivo + 1-2 dados), aí sim entregue pauta estruturada.
5. Pauta entregue: máximo 5-6 itens, com tempo sugerido, responsável e 1 pergunta-chave por item. Sem explicações longas.
6. Use markdown com moderação: **negrito** em palavras-chave, listas curtas. Evite headers H1/H2 dentro de uma resposta.
7. Tom: direto, profissional, sem floreios. Como um chefe de gabinete eficiente.

FORMATO DE PAUTA (quando o usuário pedir ou estiver pronto):

**Reunião:** [tema]
**Duração:** [X min] · **Participantes:** [lista]

**Pauta**
1. **[Item]** — [tempo] · resp: [pessoa]
   - Pergunta-chave: [uma só]
2. **[Item]** — [tempo] · resp: [pessoa]
   - Pergunta-chave: [uma só]

**Decisões esperadas**
- [Decisão 1]
- [Decisão 2]

**Próximos passos**
- [Ação] — resp: [pessoa] · prazo: [data]

QUANDO PEDIR CONTEXTO:
Em vez de fazer 5 perguntas, faça UMA tipo: "Qual o objetivo principal — alinhar status, decidir prioridade, ou resolver um problema específico?"

Mantenha respostas curtas. Iteração rápida > resposta monumental.`

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_GENERATIVE_AI_API_KEY não configurada. Adicione no .env.local para usar o chatbot.",
      },
      { status: 503 },
    )
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    })

    // Resposta no formato de UI Message Stream que o `useChat` do
    // @ai-sdk/react v6 entende (parts, streaming chunks, etc.).
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Falha ao comunicar com o servidor de IA." },
      { status: 500 },
    )
  }
}
