/**
 * CLI de teste da Etapa 1 (limpeza contextual).
 *
 * Uso:
 *   bun scripts/test-limpeza.mjs <arquivo-bruto.txt>
 *
 * Exemplo:
 *   bun scripts/test-limpeza.mjs tests/fixtures/2026-05-20-bruta.txt
 *
 * Saída:
 *   - Imprime a transcrição limpa no stdout
 *   - Salva também em tests/fixtures/<nome>-limpa.txt
 *
 * Roda standalone (sem precisar do Next dev server) — chama Gemini direto.
 * Exige GOOGLE_GENERATIVE_AI_API_KEY no env (.env.local ou export).
 */

import "dotenv/config"
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

const MODEL_ID = process.env.GEMINI_LIMPEZA_MODEL ?? "gemini-2.5-flash"
const CONTEXTO_DIR = "contexto-legacy"
const PRODUTOS_DIR = `${CONTEXTO_DIR}/produtos`

/* ───── Contexto loader (duplicado do src/lib/contexto-loader.ts pra evitar
   import de TS no script .mjs — mantém em sync manualmente) ───── */

async function loadContexto() {
  const rootFiles = [
    "empresa.md",
    "produtos.md",
    "equipe.md",
    "glossario.md",
    "template-ata.md",
  ]
  const [empresa, produtos, equipe, glossario, templateAta] = await Promise.all(
    rootFiles.map((f) => readFile(`${CONTEXTO_DIR}/${f}`, "utf8")),
  )

  const produtoFiles = (await readdir(PRODUTOS_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort()
  const detalhes = []
  for (const f of produtoFiles) {
    detalhes.push((await readFile(`${PRODUTOS_DIR}/${f}`, "utf8")).trim())
  }

  return {
    empresa,
    produtos,
    equipe,
    glossario,
    templateAta,
    produtosDetalhes: detalhes.join("\n\n---\n\n"),
  }
}

function formatContextoForLimpeza(ctx) {
  const sections = [
    { title: "EMPRESA", body: ctx.empresa },
    { title: "EQUIPE", body: ctx.equipe },
    { title: "PRODUTOS — ÍNDICE", body: ctx.produtos },
    { title: "PRODUTOS — DETALHES", body: ctx.produtosDetalhes },
    { title: "GLOSSÁRIO", body: ctx.glossario },
  ]
  return sections
    .map(({ title, body }) => `## ${title}\n\n${body.trim()}`)
    .join("\n\n---\n\n")
}

/* ───── Prompt (espelha src/lib/prompts/limpeza.ts) ───── */

const SYSTEM_PROMPT_LIMPEZA = `Você é um revisor especializado em transcrições de reuniões da Legacy Educação. Sua única tarefa é corrigir erros de reconhecimento de fala da transcrição automática, usando o contexto da empresa fornecido.

REGRAS ESTRITAS:

1. Corrija nomes de pessoas, produtos, ferramentas e jargões usando as listas em EQUIPE, PRODUTOS (índice e detalhes) e GLOSSÁRIO.

2. Use a seção "Variações comuns de transcrição" do EQUIPE como mapa de correções automáticas — aplique sem perguntar. Exemplos:
   - "Clayton" → "Clailton"
   - "Lightning" / "Light" → "Legacy"
   - "Sempre Israel" → "Impulsão Empresarial"
   - "Inteligência Israel" → "Inteligência Empresarial"
   - "Lego Explorer" / "Leg Splend" / "Alex Klan" / "Alex Plan" → "Legacy Plan"

3. NÃO reescreva conteúdo. NÃO resuma, NÃO reorganize, NÃO corte. Mantenha falas, repetições, interrupções e estilo coloquial exatamente como foram ditos.

4. Se encontrar uma palavra que parece ser um termo da Legacy mas não bate com nenhum item do catálogo, marque com [?suspeita: termo_original] em vez de adivinhar.

5. Se um nome de pessoa for citado e não estiver no organograma da EQUIPE, mantenha como está e marque com [?não-identificado].

6. Preserve marcadores de fala se existirem (ex.: "Allan:", "Clailton:", "Participante 1:").

7. Preserve TIMESTAMPS, números, preços, prazos e datas exatamente como aparecem na transcrição bruta. Não normalize formatação (ex.: não troque "8 mil" por "R$ 8.000").

8. Não adicione comentários, explicações, prefácio ou pós-âmbulo. Sua resposta deve ser EXCLUSIVAMENTE a transcrição corrigida em texto puro.

SAÍDA: transcrição corrigida em texto puro, sem comentários, sem explicações, sem prefácio. Apenas a transcrição limpa.`

function buildUserPromptLimpeza(contexto, transcricaoBruta) {
  return `## CONTEXTO DA EMPRESA

${contexto}

---

## TRANSCRIÇÃO BRUTA A CORRIGIR

${transcricaoBruta}

---

Retorne apenas a transcrição corrigida em texto puro. Sem comentários.`
}

/* ───── Main ───── */

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error("Uso: bun scripts/test-limpeza.mjs <arquivo-bruto.txt>")
    process.exit(1)
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(
      "GOOGLE_GENERATIVE_AI_API_KEY ausente no env. Configure .env.local.",
    )
    process.exit(1)
  }

  console.error(`[1/4] Lendo transcrição bruta: ${arg}`)
  const transcricaoBruta = await readFile(arg, "utf8")
  const charsIn = transcricaoBruta.length
  console.error(`      ${charsIn} caracteres lidos.`)

  console.error(`[2/4] Carregando contexto Legacy...`)
  const ctx = await loadContexto()
  const contextoFormatado = formatContextoForLimpeza(ctx)
  console.error(`      ${contextoFormatado.length} caracteres de contexto.`)

  console.error(`[3/4] Chamando Gemini (${MODEL_ID})...`)
  const t0 = Date.now()
  const { text } = await generateText({
    model: google(MODEL_ID),
    system: SYSTEM_PROMPT_LIMPEZA,
    prompt: buildUserPromptLimpeza(contextoFormatado, transcricaoBruta),
    temperature: 0.1,
  })
  const ms = Date.now() - t0
  const charsOut = text.length
  console.error(
    `      Resposta em ${ms}ms — ${charsOut} caracteres (delta ${charsOut - charsIn >= 0 ? "+" : ""}${charsOut - charsIn}).`,
  )

  const outName = basename(arg).replace(/\.(txt|md)$/, "") + "-limpa.txt"
  const outDir = dirname(arg).replace(/brutas?$/, "limpas") // tests/fixtures/brutas → tests/fixtures/limpas
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, outName)
  await writeFile(outPath, text.trim() + "\n", "utf8")
  console.error(`[4/4] Salvo em: ${outPath}`)

  // Stdout: a transcrição limpa pura (pra encadear com outros comandos)
  process.stdout.write(text.trim() + "\n")
}

main().catch((err) => {
  console.error("ERRO:", err instanceof Error ? err.message : err)
  process.exit(1)
})
