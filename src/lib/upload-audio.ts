import { getSupabase } from "@/lib/supabase"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET ?? "audio"
const FOLDER = "temp_audio"

function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomBytes = new Uint8Array(4)
  crypto.getRandomValues(randomBytes)
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const fileExtension = originalName?.split(".").pop() || "audio"
  return `audio_${timestamp}_${randomString}.${fileExtension}`
}

/**
 * Faz upload de um File pro bucket de áudios no Supabase Storage e devolve
 * uma URL pública (consumível pelo AssemblyAI). O bucket precisa estar
 * configurado como Public no Supabase Dashboard.
 *
 * Refator de Out/2026: antes era uploadFileToFirebase (Firebase Storage),
 * trocado pra Supabase pra não exigir plano Blaze do Firebase.
 */
export async function uploadAudio(
  file: File,
): Promise<{ url: string; path: string }> {
  const supabase = getSupabase()
  const filename = generateUniqueFilename(file.name)
  const path = `${FOLDER}/${filename}`

  console.log(
    `Uploading file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) → Supabase ${BUCKET}/${path}`,
  )

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })

  if (error) {
    throw new Error(`Supabase upload falhou: ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
