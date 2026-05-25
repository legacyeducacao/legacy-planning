/**
 * Extração de conteúdo de materiais anexados à reunião.
 *
 * Tipos suportados nesta versão:
 *  - text   → .txt, .md (lê como string)
 *  - image  → .png, .jpg, .jpeg, .webp, .gif (vira data URL pra multimodal)
 *
 * .docx, .pdf ficam pra próxima iteração — exigem libs no client e o ganho
 * não compensa enquanto o usuário pode colar texto direto ou tirar print.
 */

export type MaterialKind = "text" | "image"

export interface MaterialItem {
  /** ID único pra key de React e remoção. */
  id: string
  /** Nome original do arquivo (mostrado na UI). */
  name: string
  kind: MaterialKind
  /** MIME type original — preservado pra mandar pro modelo multimodal. */
  mimeType: string
  /** Pra `text`: conteúdo extraído. Pra `image`: vazio (usa `dataUrl`). */
  text?: string
  /** Pra `image`: data URL `data:<mime>;base64,...`. Pra `text`: vazio. */
  dataUrl?: string
  /** Bytes do arquivo original (pra UI mostrar tamanho). */
  sizeBytes: number
}

const TEXT_EXTENSIONS = /\.(txt|md|markdown|csv|json)$/i
const TEXT_MIMES = /^(text\/|application\/json|application\/xml)/i
const IMAGE_MIMES = /^image\/(png|jpe?g|webp|gif)$/i

/** Heurística pra decidir o tipo do material. */
export function classifyFile(file: File): MaterialKind | null {
  if (IMAGE_MIMES.test(file.type)) return "image"
  if (TEXT_MIMES.test(file.type) || TEXT_EXTENSIONS.test(file.name)) {
    return "text"
  }
  return null
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("Falha de leitura"))
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.readAsText(file)
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("Falha de leitura"))
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.readAsDataURL(file)
  })
}

/** Limite por arquivo de TEXTO (chars). Acima disso, trunca pra não inflar
 *  o prompt e estourar quota do modelo. */
const MAX_TEXT_CHARS = 50_000

/** Limite por arquivo de IMAGEM (bytes). Gemini aceita até 20MB por imagem
 *  mas vamos ser conservadores. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export async function extractMaterial(file: File): Promise<MaterialItem> {
  const kind = classifyFile(file)
  if (!kind) {
    throw new Error(
      `Tipo não suportado: ${file.type || file.name}. Aceitamos txt, md, png, jpg, webp, gif.`,
    )
  }
  if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Imagem muito grande (${Math.round(file.size / 1024 / 1024)}MB). Máx 8MB.`,
    )
  }

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  if (kind === "text") {
    let text = await readAsText(file)
    if (text.length > MAX_TEXT_CHARS) {
      text = `${text.slice(0, MAX_TEXT_CHARS)}\n\n[... truncado em ${MAX_TEXT_CHARS} caracteres ...]`
    }
    return {
      id,
      name: file.name,
      kind,
      mimeType: file.type || "text/plain",
      text,
      sizeBytes: file.size,
    }
  }

  const dataUrl = await readAsDataUrl(file)
  return {
    id,
    name: file.name,
    kind,
    mimeType: file.type,
    dataUrl,
    sizeBytes: file.size,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
