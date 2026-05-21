import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

const CONTEXTO_DIR = "contexto-legacy"
const PRODUTOS_DIR = join(CONTEXTO_DIR, "produtos")

const ROOT_FILES = [
  "empresa.md",
  "produtos.md",
  "equipe.md",
  "glossario.md",
  "template-ata.md",
] as const

export interface ContextoLegacy {
  empresa: string
  produtos: string
  equipe: string
  glossario: string
  templateAta: string
  produtosDetalhes: string
}

async function readMd(path: string): Promise<string> {
  return await readFile(path, "utf8")
}

async function loadProdutosDetalhes(): Promise<string> {
  const files = (await readdir(PRODUTOS_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort()
  const chunks: string[] = []
  for (const f of files) {
    const content = await readMd(join(PRODUTOS_DIR, f))
    chunks.push(content.trim())
  }
  return chunks.join("\n\n---\n\n")
}

export async function loadContexto(): Promise<ContextoLegacy> {
  const [empresa, produtos, equipe, glossario, templateAta] = await Promise.all(
    ROOT_FILES.map((f) => readMd(join(CONTEXTO_DIR, f))),
  )
  const produtosDetalhes = await loadProdutosDetalhes()
  return {
    empresa,
    produtos,
    equipe,
    glossario,
    templateAta,
    produtosDetalhes,
  }
}

/**
 * Formata o contexto concatenado pra inclusão em prompt de LLM.
 * Use diferentes flavors dependendo da etapa:
 * - "limpeza": empresa + equipe + produtos (índice + detalhes) + glossario.
 *   Template não entra na limpeza (só na geração de ata).
 * - "ata": tudo, incluindo template.
 */
export function formatContextoForPrompt(
  ctx: ContextoLegacy,
  flavor: "limpeza" | "ata",
): string {
  const sections: Array<{ title: string; body: string }> = [
    { title: "EMPRESA", body: ctx.empresa },
    { title: "EQUIPE", body: ctx.equipe },
    { title: "PRODUTOS — ÍNDICE", body: ctx.produtos },
    { title: "PRODUTOS — DETALHES", body: ctx.produtosDetalhes },
    { title: "GLOSSÁRIO", body: ctx.glossario },
  ]
  if (flavor === "ata") {
    sections.push({ title: "TEMPLATE DE ATA", body: ctx.templateAta })
  }
  return sections
    .map(({ title, body }) => `## ${title}\n\n${body.trim()}`)
    .join("\n\n---\n\n")
}
