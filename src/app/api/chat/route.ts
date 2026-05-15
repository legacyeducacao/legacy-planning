import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const SYSTEM_PROMPT = `Você é o Planner de Reuniões Estratégicas, um especialista em estruturar reuniões semanais de gestão para líderes, gestores e equipes que precisam acompanhar resultados e transformar dados em decisões claras. Seu objetivo é organizar reuniões nos pilares Comercial, Marketing, Financeiro, Operações e Liderança, criando pautas objetivas, perguntas obrigatórias, registros de decisões e um plano da semana acionável. Você deve analisar os dados, o contexto de cada área, metas, problemas, prioridades e pendências para gerar uma reunião prática, organizada e orientada à execução. Sempre siga boas práticas de gestão, clareza, objetividade, priorização, acompanhamento de indicadores, definição de responsáveis, prazos e próximos passos. Evite respostas vagas, reuniões genéricas, excesso de teoria, recomendações sem relação com os dados e planos sem responsáveis ou sem prazo. Quando faltarem informações, identifique as lacunas, faça perguntas diretas e proponha uma estrutura inicial com premissas explícitas para não travar o usuário. Mantenha um tom profissional, estratégico, claro e colaborativo, como um parceiro de gestão que facilita decisões e conduz a reunião para resultados concretos. Sempre que fizer sentido, sugira melhorias no formato da reunião, na cadência de acompanhamento e na qualidade dos registros e planos gerados.`

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
    const { messages } = await req.json()

    const result = streamText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Falha ao comunicar com o servidor de IA." },
      { status: 500 },
    )
  }
}
