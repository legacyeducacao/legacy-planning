import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type ModelMessage } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { normalizeAta } from "@/lib/ata-format"
import { formatContextoForPrompt, loadContexto } from "@/lib/contexto-loader"
import type { TranscriptionSegment } from "@/types/transcription"

interface MaterialPayload {
  name: string
  kind: "text" | "image"
  mimeType: string
  text?: string
  dataUrl?: string
}

const PRIMARY_GEMINI = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
const FALLBACK_CLAUDE = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6"

// Lista de modelos OpenRouter pra tentar em sequência. Cada um é uma tentativa
// independente — fila separada por modelo. Pode ser configurado via env
// (comma-separated). Modelos free escolhidos por compatibilidade com pt-BR.
const FALLBACK_OPENROUTER_MODELS = (
  process.env.OPENROUTER_MODELS ??
  process.env.OPENROUTER_MODEL ??
  [
    "deepseek/deepseek-v4-flash:free",
    "z-ai/glm-4.5-air:free",
    "minimax/minimax-m2.5:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

// OpenRouter é OpenAI-compatible; criamos um client com baseURL custom só
// se a env var estiver configurada.
const openrouter = process.env.OPENROUTER_API_KEY
  ? createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null

interface ModelAttempt {
  provider: "gemini" | "anthropic" | "openrouter"
  id: string
  /** Atraso em ms antes de tentar este modelo. Pra dar respiro a 429/overload. */
  delayMs?: number
}

/**
 * Chain de fallback:
 * 1. Flash (primário)
 * 2. Flash de novo após 3s — overload de Flash geralmente passa em segundos
 * 3. Gemini 2.0 Flash — modelo alternativo free-tier, fila separada
 * 4. Gemini 2.5 Flash Lite — último Gemini free-tier
 * 5. OpenRouter (se OPENROUTER_API_KEY) — cada modelo da lista vira uma
 *    tentativa independente. Default: 5 modelos free (DeepSeek V4 Flash,
 *    GLM 4.5 Air, MiniMax M2.5, GPT-OSS 120B, Nemotron 3 Super 120B), cada
 *    um com fila própria. Override via OPENROUTER_MODELS (comma-separated).
 * 6. Gemini 2.5 Pro — só funciona em paid tier (free tier tem limit 0); na
 *    chain pra paid users, ignorado rápido em free tier (429 imediato)
 * 7. Claude Sonnet — só se ANTHROPIC_API_KEY estiver configurada (paid)
 */
function buildFallbackChain(opts: { hasImages: boolean }): ModelAttempt[] {
  const chain: ModelAttempt[] = [
    { provider: "gemini", id: PRIMARY_GEMINI },
    { provider: "gemini", id: PRIMARY_GEMINI, delayMs: 3000 },
  ]
  if (PRIMARY_GEMINI !== "gemini-2.0-flash") {
    chain.push({ provider: "gemini", id: "gemini-2.0-flash" })
  }
  if (PRIMARY_GEMINI !== "gemini-2.5-flash-lite") {
    chain.push({ provider: "gemini", id: "gemini-2.5-flash-lite" })
  }
  // OpenRouter chain free-tier não garante suporte a multimodal; pula quando
  // tem imagem pra não estourar erro de "model doesn't support images".
  if (openrouter && !opts.hasImages) {
    for (const id of FALLBACK_OPENROUTER_MODELS) {
      chain.push({ provider: "openrouter", id })
    }
  }
  if (PRIMARY_GEMINI !== "gemini-2.5-pro") {
    chain.push({ provider: "gemini", id: "gemini-2.5-pro" })
  }
  if (process.env.ANTHROPIC_API_KEY) {
    chain.push({ provider: "anthropic", id: FALLBACK_CLAUDE })
  }
  return chain
}

const RETRYABLE_RE =
  /high demand|overload|rate.?limit|429|503|504|timeout|temporar|unavailable|quota/i

async function generateAtaWithFallback(args: {
  system: string
  prompt: string
  imageParts?: Array<{ dataUrl: string; mimeType: string }>
}): Promise<{ text: string; modelUsed: string }> {
  const hasImages = (args.imageParts?.length ?? 0) > 0
  const chain = buildFallbackChain({ hasImages })
  let lastErr: unknown

  // Quando tem imagem, monta `messages` multimodal; senão usa `prompt` string
  // (caminho rápido, sem mudança de comportamento pro flow antigo).
  const messages: ModelMessage[] | undefined = hasImages
    ? [
        {
          role: "user",
          content: [
            { type: "text", text: args.prompt },
            ...(args.imageParts ?? []).map(
              (img) =>
                ({
                  type: "image" as const,
                  image: img.dataUrl,
                  mediaType: img.mimeType,
                }) satisfies {
                  type: "image"
                  image: string
                  mediaType: string
                },
            ),
          ],
        },
      ]
    : undefined

  for (const attempt of chain) {
    if (attempt.delayMs) {
      await new Promise((r) => setTimeout(r, attempt.delayMs))
    }
    try {
      let model: ReturnType<typeof google>
      if (attempt.provider === "anthropic") {
        model = anthropic(attempt.id) as ReturnType<typeof google>
      } else if (attempt.provider === "openrouter" && openrouter) {
        model = openrouter(attempt.id) as ReturnType<typeof google>
      } else {
        model = google(attempt.id)
      }
      const { text } = await generateText({
        model,
        system: args.system,
        ...(messages ? { messages } : { prompt: args.prompt }),
        // responseMimeType só funciona pro Gemini; Anthropic e OpenRouter
        // ignoram e devolvem text/markdown que stripFences resolve
        providerOptions:
          attempt.provider === "gemini"
            ? { google: { responseMimeType: "application/json" } }
            : undefined,
        temperature: 0.2,
      })
      return { text, modelUsed: `${attempt.provider}:${attempt.id}` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(
        `[ata] modelo ${attempt.provider}:${attempt.id} falhou: ${msg}`,
      )
      if (!RETRYABLE_RE.test(msg)) break // erro não-transient (config, prompt inválido) — não vale tentar outro
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Todos os modelos falharam")
}

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um analista de produto da Legacy Educação responsável por gerar atas de reuniões internas em português brasileiro. Vai receber: (1) o CONTEXTO da empresa (organograma, catálogo de produtos, glossário) e (2) uma TRANSCRIÇÃO automática de uma reunião.

PRINCÍPIO #1 — ANÁLISE COMPLETA E PROFUNDA:
Analise a transcrição de ponta a ponta. Não resuma apenas partes ou trechos iniciais. Extraia o máximo de informações relevantes da reunião, principalmente: decisões tomadas, direcionamentos da liderança, problemas identificados, correções solicitadas, projetos apresentados, ações concluídas/em andamento/atrasadas/bloqueadas/novas, metas e indicadores, valores, riscos e dependências.

PRINCÍPIO #2 — NÃO TRANSFORME SUGESTÕES EM DECISÕES:
Diferencie claramente decisões aprovadas, direcionamentos e ações acordadas de sugestões, hipóteses para teste e assuntos em validação. 
Expressões como "talvez", "eu acho", "poderia", "seria interessante", "quem sabe", "podemos testar" indicam sugestões ou hipóteses — registre-as em "Sugestões e assuntos em validação" dentro de riscosObservacoes, NUNCA em decisoes.

PRINCÍPIO #3 — UTILIZE O CONTEXTO E CORRIJA NOMES:
- Use os participantes e cargos cadastrados no organograma (EQUIPE) como fonte oficial. A transcrição pode errar nomes. Não inclua como participante alguém que foi apenas citado durante a reunião.
- Use a seção "Variações comuns de transcrição" para corrigir nomes e produtos (ex: "Clayton" -> "Clailton", "Lightning" -> "Legacy", "Alex Plan" -> "Legacy Plan"). Se não tiver certeza absoluta de um termo ou produto, registre-o como "Termo a confirmar: [termo]", sem inventar nomes.

PRINCÍPIO #4 — NÃO INVENTE RESPONSÁVEIS OU PRAZOS:
- Se o responsável não ficou claro na reunião, preencha o campo responsavel com "Responsável não definido na reunião". A pessoa que sugeriu uma ação não é necessariamente quem irá executá-la.
- Se não houver prazo acordado, preencha o campo prazo com "Prazo não definido na reunião".
- Sempre que a data da reunião for fornecida no prompt, converta prazos relativos ("hoje", "amanhã", "próxima segunda-feira", "final do mês", "semana que vem") em datas exatas (formato DD/MM/YYYY).

PRINCÍPIO #5 — ESTRUTURA DO PLANO DE AÇÃO:
- Diferencie Projetos (iniciativas amplas, ex: "aumentar vendas") de Planos de Ação (tarefas específicas, executáveis e verificáveis). Não registre objetivos genéricos como ações.
- Cada ação no array "planoAcao" deve conter a descrição estruturada no seguinte formato no campo "descricao":
  "[Prioridade] [Área] Descrição objetiva da ação.
  - Entregável: Critério de conclusão (Se não puder ser identificado na transcrição, registre: 'Critério de conclusão a ser definido pelo responsável')
  - Apoio: Pessoas ou áreas de apoio (ou 'Nenhum')
  - Aprovador: Responsável pela aprovação (se identificado, ou 'Não identificado')
  - Dependências: Dependências (ou 'Nenhuma')"
- Prioridades válidas:
  - P0: urgente ou bloqueia a operação
  - P1: deve ser executada no ciclo atual
  - P2: importante para o próximo ciclo
  - P3: melhoria futura ou ideia em validação
- Identifique pela transcrição se a ação já está em um dos seguintes status: "Não iniciado", "Em andamento", "Concluído", "Atrasada", "Bloqueada", "Aguardando validação".

PRINCÍPIO #6 — CONTEXTO DE INDICADORES, DIVERGÊNCIAS E EVITAR DUPLICIDADES:
- Para cada número/indicador mencionado, registre em riscosObservacoes:
  "INDICADOR: [Nome] | META: [Valor] | REALIZADO: [Valor] | PERÍODO: [Tempo] | INTERPRETAÇÃO: [Texto] | METODOLOGIA/DIVERGÊNCIA: [Se houver]"
- Se houver divergência entre participantes, registre profissionalmente em riscosObservacoes:
  "DIVERGÊNCIA: Ponto em debate entre [Pessoas] (Entendimento A vs Entendimento B). Direcionamento: [Direcionamento que prevaleceu]. Pendente: [O que ficou pendente]"
- Remova duplicidades. A mesma ação não deve aparecer repetida em decisões, pendências, plano de ação e próximos passos.

PRINCÍPIO #7 — SEÇÃO DE VALIDAÇÕES FINAIS:
Sempre inclua um item estruturado no final do array "riscosObservacoes" com o título "INFORMAÇÕES A VALIDAR:", listando de forma organizada:
- Responsáveis não definidos: [...]
- Prazos não definidos: [...]
- Valores não aprovados: [...]
- Termos duvidosos: [...]
- Contradições: [...]
- Ações mencionadas sem definição clara: [...]

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
      "descricao": "string — descrição estruturada seguindo o formato do PRINCÍPIO #5",
      "responsavel": "string ou null",
      "prazo": "string ou null",
      "status": "Não iniciado | Em andamento | Concluído | Atrasada | Bloqueada | Aguardando validação"
    }
  ],
  "riscosObservacoes": ["string — incluindo indicadores, divergências, sugestões e a seção final INFORMAÇÕES A VALIDAR"],
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
  /** Lista de nomes confirmados pelo usuário como participantes. Quando
   *  passada, força o LLM a usar APENAS estes nomes na seção participantes. */
  confirmedParticipants?: string[]
  /** Materiais de apoio anexados (rascunhos, fotos, notas). Texto vira bloco
   *  no prompt; imagem vira message part multimodal. */
  materials?: MaterialPayload[]
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

  // Cap defensivo pra evitar request gigante. Gemini 2.5 Flash aceita ~1M tokens
  // (~4M chars), Claude Sonnet aceita 200K tokens (~800K chars). 500K cobre
  // reuniões de até ~8h em transcrição corrida sem truncar. Override via
  // ATA_MAX_TRANSCRIPTION_CHARS se precisar mais.
  const MAX_CHARS = Number(process.env.ATA_MAX_TRANSCRIPTION_CHARS) || 500_000
  if (content.length > MAX_CHARS) {
    console.warn(
      `[ata] transcrição truncada: ${content.length} → ${MAX_CHARS} chars`,
    )
    content = `${content.slice(0, MAX_CHARS)}\n\n[... transcrição truncada — ${content.length - MAX_CHARS} caracteres adicionais não incluídos ...]`
  }

  const confirmadosBlock =
    body.confirmedParticipants && body.confirmedParticipants.length > 0
      ? `

---

## PARTICIPANTES CONFIRMADOS PELO USUÁRIO

O usuário CONFIRMOU que SÓ as pessoas abaixo estavam na reunião. Use APENAS estes nomes no campo \`participantes\` da ata, ainda que outros nomes apareçam mencionados na transcrição (eles podem ter sido citados em discussão sem estarem presentes). Cruze cada nome com o organograma (seção EQUIPE do contexto) pra atribuir o cargo correto. Se algum nome não estiver no organograma, mantém o nome como dado e deixa cargo null.

${body.confirmedParticipants.map((n) => `- ${n}`).join("\n")}`
      : ""

  const textMateriais = (body.materials ?? []).filter(
    (m) => m.kind === "text" && m.text && m.text.trim().length > 0,
  )
  const imageMateriais = (body.materials ?? []).filter(
    (m) => m.kind === "image" && m.dataUrl,
  )
  const materiaisBlock =
    textMateriais.length > 0 || imageMateriais.length > 0
      ? `

---

## MATERIAIS DE APOIO ANEXADOS PELO USUÁRIO

São rascunhos, notas ou imagens (fotos de quadro, post-its, prints) que o usuário anexou pra complementar a transcrição. Use como contexto pra enriquecer a ata — especialmente decisões, plano de ação e tópicos que ficaram pouco claros na transcrição falada. Se houver conflito entre o material e a fala, o material escrito tem precedência (foi revisado pelo usuário).
${
  textMateriais.length > 0
    ? `\n### Textos (${textMateriais.length})\n${textMateriais
        .map((m) => `\n**${m.name}**\n\`\`\`\n${m.text}\n\`\`\``)
        .join("\n")}`
    : ""
}${
  imageMateriais.length > 0
    ? `\n\n### Imagens (${imageMateriais.length})\nForam anexadas ${imageMateriais.length} imagem(ns) — analisa elas como parte do contexto da reunião. Nomes: ${imageMateriais.map((m) => m.name).join(", ")}.`
    : ""
}`
      : ""

  return `## CONTEXTO DA EMPRESA (Legacy Educação)

${contexto}
${confirmadosBlock}${materiaisBlock}

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

    const imageParts = (body.materials ?? [])
      .filter(
        (m): m is MaterialPayload & { dataUrl: string } =>
          m.kind === "image" && typeof m.dataUrl === "string",
      )
      .map((m) => ({ dataUrl: m.dataUrl, mimeType: m.mimeType }))

    const { text, modelUsed } = await generateAtaWithFallback({
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body, contextoFormatado),
      imageParts,
    })
    console.log(
      `[ata] gerada via ${modelUsed}${imageParts.length > 0 ? ` (${imageParts.length} imagem(ns))` : ""}`,
    )

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
    // horarioEncerramento NÃO é preenchido com a hora de agora — pra upload de
    // arquivo isso seria mentira (não sabemos quando a reunião terminou).
    // Quando vier do LLM (extraído da transcrição), preserva; senão, vazio
    // e o usuário preenche manualmente. Pra gravação ao vivo, o client pode
    // passar body.horarioEncerramento computado de startTime + duração.

    return NextResponse.json({ ata })
  } catch (error) {
    console.error("[ata] generation error:", error)
    const message =
      error instanceof Error ? error.message : "Falha ao gerar ata"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
