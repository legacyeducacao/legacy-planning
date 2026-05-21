import { mkdir, readdir, writeFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import mammoth from "mammoth"

const SRC = "Produtos"
const OUT = "tmp/produtos-extract"

await mkdir(OUT, { recursive: true })

const files = (await readdir(SRC)).filter(
  (f) => extname(f).toLowerCase() === ".docx",
)

for (const f of files) {
  const inPath = join(SRC, f)
  const outPath = join(OUT, `${basename(f, ".docx")}.txt`)
  try {
    const { value, messages } = await mammoth.extractRawText({ path: inPath })
    await writeFile(outPath, value, "utf8")
    const warn = messages.filter((m) => m.type === "warning").length
    console.log(`OK  ${f} -> ${outPath} (${value.length} chars, ${warn} warns)`)
  } catch (err) {
    console.error(`ERR ${f}: ${err instanceof Error ? err.message : err}`)
  }
}
