import type { TranscriptParams } from "assemblyai"
import { NextResponse } from "next/server"
import { assemblyai } from "@/lib/assemblyai-client"

// Roda em Node runtime (precisa de Buffer + SDK do AssemblyAI).
export const runtime = "nodejs"
// Bumpa o tempo máximo da função pra acomodar uploads grandes em dev.
export const maxDuration = 300

interface TranscribeOptions {
  language?: string
  diarize?: boolean
  aiFeatures?: {
    autoChapters?: boolean
    summarization?: boolean
    sentimentAnalysis?: boolean
    entityDetection?: boolean
    keyPhrases?: boolean
    contentModeration?: boolean
    topicDetection?: boolean
  }
}

interface PreparedInput {
  audioFileUrl: string
  audioUrlForClient: string
}

/**
 * Lê o request e devolve a URL pública do áudio (já no CDN da AssemblyAI)
 * mais a URL que a UI vai usar pra playback no Studio.
 *
 * Caminho 1: multipart/form-data com `file` → uploada via SDK AssemblyAI.
 * Caminho 2: application/json com `audioUrl` → usa a URL direto.
 */
async function readRequest(
  request: Request,
): Promise<{ input: PreparedInput; options: TranscribeOptions }> {
  const contentType = request.headers.get("content-type") || ""

  // --- Caminho 1: upload de arquivo ---
  if (contentType.startsWith("multipart/form-data")) {
    const formData = await request.formData()
    const file = formData.get("file")
    const optionsRaw = formData.get("options")

    if (!(file instanceof File)) {
      throw new Error("Campo 'file' ausente ou inválido no multipart")
    }

    const options: TranscribeOptions = optionsRaw
      ? JSON.parse(optionsRaw.toString())
      : {}

    console.log(
      `[transcribe] arquivo recebido (${(file.size / 1024 / 1024).toFixed(2)}MB), upload pro AssemblyAI`,
    )

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadUrl = await assemblyai.files.upload(buffer)

    return {
      input: { audioFileUrl: uploadUrl, audioUrlForClient: uploadUrl },
      options,
    }
  }

  // --- Caminho 2: URL direta (JSON) ---
  const body = await request.json()
  const { audioUrl, options = {} } = body as {
    audioUrl?: string
    options?: TranscribeOptions
  }

  if (!audioUrl) {
    throw new Error("Nenhum audioUrl fornecido no JSON")
  }

  return {
    input: { audioFileUrl: audioUrl, audioUrlForClient: audioUrl },
    options,
  }
}

export async function POST(request: Request) {
  console.log("Transcribe function invoked.")

  let prepared: { input: PreparedInput; options: TranscribeOptions }
  try {
    prepared = await readRequest(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao ler request"
    console.error("Falha ao preparar input:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { input, options } = prepared

  try {
    // Monta params do AssemblyAI usando os tipos do SDK
    const params: TranscriptParams = {
      audio_url: input.audioFileUrl,
      // speech_models é required pela AssemblyAI (speech_model singular foi
      // deprecado). Array em ordem de prioridade — Universal-3 Pro pra PT/EN/ES
      // (alta acurácia), Universal-2 como fallback pra idiomas raros.
      speech_models: ["universal-3-pro", "universal-2"],
      speaker_labels: true,
      word_boost: [
        // Produtos Legacy
        "Inteligência Empresarial",
        "Impulsão Empresarial",
        "Legado Empresarial",
        "Legacy Plan",
        "Legacy Academy",
        "LegacyProd",
        "Luma Agent",
        "iPreço",
        "Nina",
        // Pessoas
        "Allan",
        "Clailton",
        "Adriano",
        "Santini",
        "Igor",
        "Lair",
        "Lucas",
        "Marcelo",
        "Petherson",
        "Jocinei",
        "Matheus",
        "Paim",
        // Termos internos
        "executoria",
        "Turma",
        "Incompany",
        "MQL",
        "BSC",
      ],
      boost_param: "high",
    }

    // Recursos de IA da AssemblyAI hoje só rodam em inglês. Se a língua
    // pedida não for `en*` (ou auto-detect), descartamos esses params pra
    // evitar 400 "The following models are not available in this language".
    const langCode = options.language?.trim() ?? ""
    const isEnglish = langCode === "auto" || langCode.startsWith("en")
    const useAutoDetect = !langCode || langCode === "auto"

    if (!useAutoDetect) {
      params.language_code = langCode
    } else {
      params.language_detection = true
    }

    const aiFeatures = options.aiFeatures || {}
    const stripped: string[] = []

    if (isEnglish) {
      // auto_chapters e summarization são mutuamente exclusivos
      if (aiFeatures.autoChapters) {
        params.auto_chapters = true
      } else if (aiFeatures.summarization) {
        params.summarization = true
        params.summary_model = "informative"
        params.summary_type = "bullets"
      }
      if (aiFeatures.sentimentAnalysis) params.sentiment_analysis = true
      if (aiFeatures.entityDetection) params.entity_detection = true
      if (aiFeatures.keyPhrases) params.auto_highlights = true
      if (aiFeatures.contentModeration) params.content_safety = true
      if (aiFeatures.topicDetection) params.iab_categories = true
    } else {
      // Coleta o que foi descartado pra log e diagnóstico
      if (aiFeatures.autoChapters) stripped.push("autoChapters")
      if (aiFeatures.summarization) stripped.push("summarization")
      if (aiFeatures.sentimentAnalysis) stripped.push("sentimentAnalysis")
      if (aiFeatures.entityDetection) stripped.push("entityDetection")
      if (aiFeatures.keyPhrases) stripped.push("keyPhrases")
      if (aiFeatures.contentModeration) stripped.push("contentModeration")
      if (aiFeatures.topicDetection) stripped.push("topicDetection")
      if (stripped.length > 0) {
        console.log(
          `[transcribe] língua '${langCode}' não suporta os recursos: ${stripped.join(", ")}. Descartados.`,
        )
      }
    }

    // submit() retorna imediatamente com transcript queued (sem polling aqui)
    const transcript = await assemblyai.transcripts.submit(params)

    console.log(
      `[transcribe] submitted ${transcript.id} (lang=${params.language_code ?? "auto"}, diarize=${params.speaker_labels})`,
    )

    return NextResponse.json(
      {
        id: transcript.id,
        status: transcript.status,
        audioUrl: input.audioUrlForClient,
        warnings:
          stripped.length > 0 ? { unsupportedFeatures: stripped } : undefined,
      },
      { status: 200 },
    )
  } catch (error: unknown) {
    console.error("Erro ao processar transcrição:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json(
      { error: `Transcrição falhou: ${errorMessage}` },
      { status: 502 },
    )
  }
}
